import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { completeOnboarding, getMyProfile, listColleges, profileKeys } from './profile.api';
import type { Onboarding } from './profile.schemas';

/** The signed-in rider's profile. Disabled until there's a session. */
export function useMyProfile(userId: string | undefined) {
  return useQuery({
    queryKey: profileKeys.me(userId ?? ''),
    queryFn: () => getMyProfile(userId!),
    enabled: Boolean(userId),
  });
}

export function useColleges() {
  // The list only changes with a migration, so never treat it as stale.
  return useQuery({ queryKey: profileKeys.colleges, queryFn: listColleges, staleTime: Infinity });
}

export function useCompleteOnboarding(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Onboarding) => completeOnboarding(userId, input),
    // Refetching the profile brings in onboarded_at, which opens the (app) routes.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: profileKeys.me(userId) }),
  });
}
