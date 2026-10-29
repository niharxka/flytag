import type { Session } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

// Re-exported so the rest of the app never imports Supabase directly (lint rule, §4.2).
export type { Session };

/**
 * Email a 6-digit code. With `signUp` it creates the account if needed (the hook rejects
 * non-UCSD); without it the email must already have an account, or Supabase answers
 * `otp_disabled`. Existing riders who sign up again just get a code; their name is kept.
 */
export async function sendCode(email: string, signUp?: { displayName: string }): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: signUp
      ? { shouldCreateUser: true, data: { display_name: signUp.displayName } }
      : { shouldCreateUser: false },
  });
  if (error) throw error;
}

/** Exchange the emailed code for a session. Supabase stores it; onAuthChange then fires. */
export async function verifyCode(email: string, code: string): Promise<void> {
  const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/** The saved session from a previous launch, if any. */
export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/** Calls back on every sign-in, sign-out and token refresh. Returns an unsubscribe function. */
export function onAuthChange(callback: (session: Session | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => data.subscription.unsubscribe();
}
