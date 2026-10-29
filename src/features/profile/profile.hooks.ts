import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  completeOnboarding,
  getAvatarUrl,
  getMyPrivateProfile,
  getMyProfile,
  listColleges,
  profileKeys,
  removeAvatar,
  updateProfile,
  uploadAvatar,
} from './profile.api';
import type { EditProfile, Onboarding } from './profile.schemas';

/** The signed-in rider's profile. Disabled until there's a session. */
export function useMyProfile(userId: string | undefined) {
  return useQuery({
    queryKey: profileKeys.me(userId ?? ''),
    queryFn: () => getMyProfile(userId!),
    enabled: Boolean(userId),
  });
}

export function useMyPrivateProfile(userId: string) {
  return useQuery({ queryKey: profileKeys.private(userId), queryFn: () => getMyPrivateProfile(userId) });
}

export function useColleges() {
  // The list only changes with a migration, so never treat it as stale.
  return useQuery({ queryKey: profileKeys.colleges, queryFn: listColleges, staleTime: Infinity });
}

/** A signed link for a photo path, refreshed before it expires (links last an hour). */
export function useAvatarUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: profileKeys.avatarUrl(path ?? ''),
    queryFn: () => getAvatarUrl(path!),
    enabled: Boolean(path),
    staleTime: 50 * 60 * 1000,
  });
}

export function useCompleteOnboarding(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Onboarding) => completeOnboarding(userId, input),
    // Refetching the profile brings in onboarded_at, which opens the (app) routes.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: profileKeys.me(userId) }),
  });
}

// Your name and home appear on ride cards, so edits refresh those too.
function useRefreshAfterProfileChange(userId: string) {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: profileKeys.me(userId) }),
      queryClient.invalidateQueries({ queryKey: profileKeys.private(userId) }),
      queryClient.invalidateQueries({ queryKey: ['rides'] }),
    ]);
}

export function useUpdateProfile(userId: string) {
  const refresh = useRefreshAfterProfileChange(userId);
  return useMutation({
    mutationFn: (input: EditProfile) => updateProfile(userId, input),
    onSuccess: refresh,
  });
}

export function useUploadAvatar(userId: string) {
  const refresh = useRefreshAfterProfileChange(userId);
  return useMutation({
    mutationFn: ({ uri, previousPath }: { uri: string; previousPath: string | null }) =>
      uploadAvatar(userId, uri, previousPath),
    onSuccess: refresh,
  });
}

export function useRemoveAvatar(userId: string) {
  const refresh = useRefreshAfterProfileChange(userId);
  return useMutation({ mutationFn: (path: string) => removeAvatar(userId, path), onSuccess: refresh });
}
