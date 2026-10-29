import type { Session } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

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

// Google shows only UCSD accounts (`hd`) and always lets you pick which one. That's a hint for
// the account chooser; the server-side hook is what actually rejects non-UCSD sign-ups.
const GOOGLE_PARAMS = { hd: 'ucsd.edu', prompt: 'select_account' };

/**
 * "Continue with Google". New students get an account (the hook still requires @ucsd.edu);
 * returning ones are signed in. Resolves when signed in, or with false if they backed out.
 *
 * Web: the page goes to Google and comes back to /auth/callback, where supabase-js finishes
 * on its own (this call never resolves; the page has navigated away).
 * Phones: Google opens in an in-app browser; when it returns to our redirect address we take
 * the code from it and exchange it for a session here.
 */
export async function signInWithGoogle(): Promise<boolean> {
  const redirectTo =
    Platform.OS === 'web' ? `${window.location.origin}/auth/callback` : Linking.createURL('auth/callback');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, queryParams: GOOGLE_PARAMS, skipBrowserRedirect: Platform.OS !== 'web' },
  });
  if (error) throw error;
  if (Platform.OS === 'web') return new Promise<boolean>(() => {});

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') return false; // closed the browser: not an error

  // expo-linking's parser: React Native's own URL support is incomplete on some versions.
  const params = Linking.parse(result.url).queryParams ?? {};
  const failure = params.error_description ?? params.error;
  // e.g. the hook's "Use your @ucsd.edu email." for a personal Gmail.
  if (failure) throw new Error(String(failure));
  const code = typeof params.code === 'string' ? params.code : undefined;
  if (!code) throw new Error('Google sign-in didn’t finish. Try again.');
  const exchanged = await supabase.auth.exchangeCodeForSession(code);
  if (exchanged.error) throw exchanged.error;
  return true;
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
