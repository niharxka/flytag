import type { Session } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

// Re-exported so the rest of the app never imports Supabase directly (lint rule, §4.2).
export type { Session };

/** Email a 6-digit sign-in code. Creates the account on first use (the hook rejects non-UCSD). */
export async function sendCode(email: string, displayName?: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true, data: displayName ? { display_name: displayName } : undefined },
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
