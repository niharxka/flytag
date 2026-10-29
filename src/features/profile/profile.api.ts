import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { supabase } from '@/lib/supabase';

import type { EditProfile, Onboarding } from './profile.schemas';

export type RiderIntent = 'networking' | 'flypal';

export type Profile = {
  id: string;
  displayName: string;
  collegeId: string | null;
  /** Custom home ("Pacific Beach") when not at a college. */
  homeLabel: string | null;
  /** What to show as home: the college name or the custom label. */
  homeName: string | null;
  intent: RiderIntent | null;
  avatarPath: string | null;
  onboardedAt: string | null;
};

/** The signed-in rider's private details, for the edit screen. */
export type PrivateProfile = { phone: string | null; sharePhone: boolean };

export type College = { id: string; name: string };

const AVATAR_BUCKET = 'avatars';
// Square photos at 512 px look sharp at the largest size we show (88 pt at 3×) and stay ~60 KB.
const AVATAR_PX = 512;
// Signed links expire; the hook refreshes them before this.
const AVATAR_LINK_SECONDS = 60 * 60;

export const profileKeys = {
  all: ['profile'] as const,
  me: (userId: string) => [...profileKeys.all, 'me', userId] as const,
  private: (userId: string) => [...profileKeys.all, 'private', userId] as const,
  avatarUrl: (path: string) => [...profileKeys.all, 'avatar', path] as const,
  colleges: ['colleges'] as const,
};

export async function getMyProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, college_id, home_label, intent, avatar_path, onboarded_at, colleges(name)')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return {
    id: data.id,
    displayName: data.display_name,
    collegeId: data.college_id,
    homeLabel: data.home_label,
    homeName: data.colleges?.name ?? data.home_label,
    intent: data.intent,
    avatarPath: data.avatar_path,
    onboardedAt: data.onboarded_at,
  };
}

export async function getMyPrivateProfile(userId: string): Promise<PrivateProfile> {
  const { data, error } = await supabase
    .from('profile_private')
    .select('phone_e164, share_phone')
    .eq('user_id', userId)
    .single();
  if (error) throw error;
  return { phone: data.phone_e164, sharePhone: data.share_phone };
}

export async function listColleges(): Promise<College[]> {
  const { data, error } = await supabase.from('colleges').select('id, name').order('sort');
  if (error) throw error;
  return data;
}

// Private row first, public row second, for both onboarding and editing. Two single-row,
// owner-only updates rather than an RPC (spec §3 rule 2): no rule spans the two rows and both
// are safe to repeat. .select().single() on the second turns "RLS matched no row" into an error.
async function savePrivate(userId: string, input: { phone?: string; sharePhone: boolean }) {
  const { error } = await supabase
    .from('profile_private')
    .update({ phone_e164: input.phone ?? null, share_phone: input.sharePhone })
    .eq('user_id', userId);
  if (error) throw error;
}

/** Finish onboarding. onboarded_at is written last, so a failed first step leaves you on the form. */
export async function completeOnboarding(userId: string, input: Onboarding): Promise<void> {
  await savePrivate(userId, input);
  const { error } = await supabase
    .from('profiles')
    .update({
      college_id: input.collegeId,
      home_label: input.homeLabel,
      intent: input.intent === 'none' ? null : input.intent,
      onboarded_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select('id')
    .single();
  if (error) throw error;
}

export async function updateProfile(userId: string, input: EditProfile): Promise<void> {
  await savePrivate(userId, input);
  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: input.displayName,
      // Both columns every time, so switching college ↔ custom never leaves one of each.
      college_id: input.collegeId,
      home_label: input.homeLabel,
      intent: input.intent === 'none' ? null : input.intent,
    })
    .eq('id', userId)
    .select('id')
    .single();
  if (error) throw error;
}

/**
 * Upload a photo picked from the library and make it the profile photo.
 * 1. Shrink to a 512 px JPEG on the phone (a camera photo is several MB).
 * 2. Upload to avatars/<user id>/<timestamp>.jpg: a new name each time, so no cached old photo.
 * 3. Point the profile at it, then delete the old file. If that delete fails, the cost is one
 *    orphaned file, not a broken profile.
 */
export async function uploadAvatar(
  userId: string,
  localUri: string,
  previousPath: string | null,
): Promise<void> {
  const rendered = await ImageManipulator.manipulate(localUri).resize({ width: AVATAR_PX }).renderAsync();
  const photo = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 });
  const bytes = await (await fetch(photo.uri)).arrayBuffer();

  const path = `${userId}/${Date.now()}.jpg`;
  const upload = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, bytes, { contentType: 'image/jpeg' });
  if (upload.error) throw upload.error;

  const { error } = await supabase
    .from('profiles')
    .update({ avatar_path: path })
    .eq('id', userId)
    .select('id')
    .single();
  if (error) throw error;

  if (previousPath) await supabase.storage.from(AVATAR_BUCKET).remove([previousPath]);
}

/** Remove the profile photo (back to initials). */
export async function removeAvatar(userId: string, path: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ avatar_path: null })
    .eq('id', userId)
    .select('id')
    .single();
  if (error) throw error;
  await supabase.storage.from(AVATAR_BUCKET).remove([path]);
}

/** A temporary link to a photo in the private avatars bucket. */
export async function getAvatarUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .createSignedUrl(path, AVATAR_LINK_SECONDS);
  if (error) throw error;
  return data.signedUrl;
}
