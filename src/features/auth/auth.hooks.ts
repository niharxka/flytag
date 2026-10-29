import { useMutation } from '@tanstack/react-query';

import { sendCode, signOut, verifyCode } from './auth.api';

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
  return useMutation({ mutationFn: signOut });
}
