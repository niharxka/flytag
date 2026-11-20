import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useCallback } from 'react';

import { sendCode, signInWithGoogle, signOut, verifyCode } from './auth.api';
import { useGuestBrowsing } from './auth.store';
import { useSession } from './AuthProvider';

/** Signed out but looking around. Screens use this to hide people and swap actions for "Sign in". */
export function useIsGuest(): boolean {
  return !useSession().session;
}

/**
 * Wraps an action that needs an account (post, join, chat): runs it when signed in, otherwise
 * opens Welcome. Signing in there brings them back to the app; "Keep browsing" goes back.
 */
export function useRequireSignIn() {
  const guest = useIsGuest();
  return useCallback(
    (action: () => void) => (guest ? router.push('/welcome') : action()),
    [guest],
  );
}

// No cache invalidation here: a successful verify/sign-out changes the session, AuthProvider
// hears about it, and the root layout's route guards move the user to the right screen.

/** A display name means sign up; without one (Sign in, resending on Verify) no account is created. */
export function useSendCode() {
  return useMutation({
    mutationFn: ({ email, displayName }: { email: string; displayName?: string }) =>
      sendCode(email, displayName ? { displayName } : undefined),
  });
}

export function useVerifyCode() {
  return useMutation({
    mutationFn: ({ email, code }: { email: string; code: string }) => verifyCode(email, code),
  });
}

export function useSignOut() {
  const stopBrowsing = useGuestBrowsing((s) => s.stopBrowsing);
  // Signing out lands on Welcome, not back in guest mode. Cleared before the session goes, so
  // the gate never sees "signed out and browsing" for a moment and flashes the guest tabs.
  return useMutation({ mutationFn: signOut, onMutate: stopBrowsing });
}

export function useSignInWithGoogle() {
  return useMutation({ mutationFn: signInWithGoogle });
}
