import { supabase } from '@/lib/supabase';

import type { Onboarding } from './profile.schemas';

export type RiderIntent = 'networking' | 'flypal';

export type Profile = {
  id: string;
  displayName: string;
  collegeId: string | null;
  collegeName: string | null;
  intent: RiderIntent | null;
  avatarPath: string | null;
  onboardedAt: string | null;
};

export type College = { id: string; name: string };

export const profileKeys = {
  all: ['profile'] as const,
  me: (userId: string) => [...profileKeys.all, 'me', userId] as const,
  colleges: ['colleges'] as const,
};

export async function getMyProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, college_id, intent, avatar_path, onboarded_at, colleges(name)')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return {
    id: data.id,
    displayName: data.display_name,
    collegeId: data.college_id,
    collegeName: data.colleges?.name ?? null,
    intent: data.intent,
    avatarPath: data.avatar_path,
    onboardedAt: data.onboarded_at,
  };
}

export async function listColleges(): Promise<College[]> {
  const { data, error } = await supabase.from('colleges').select('id, name').order('sort');
  if (error) throw error;
  return data;
}

/**
 * Save onboarding. Two single-row, owner-only updates rather than an RPC (spec §3 rule 2):
 * nothing has to stay consistent *between* the rows, and both are safe to repeat. The order
 * matters: onboarded_at is written last, so if the first update fails the user simply stays
 * on the onboarding screen and can try again.
 */
export async function completeOnboarding(userId: string, input: Onboarding): Promise<void> {
  // 1. Private details: phone (or none) and whether co-riders may see it.
  const priv = await supabase
    .from('profile_private')
    .update({ phone_e164: input.phone ?? null, share_phone: input.sharePhone })
    .eq('user_id', userId);
  if (priv.error) throw priv.error;

  // 2. Public profile, which opens the app. .select().single() errors if RLS matched no row.
  const pub = await supabase
    .from('profiles')
    .update({
      college_id: input.collegeId,
      intent: input.intent === 'none' ? null : input.intent,
      onboarded_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select('id')
    .single();
  if (pub.error) throw pub.error;
}
