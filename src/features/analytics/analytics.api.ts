import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '@/lib/supabase';

// Where the first tagged link's source waits until onboarding saves it. Device storage, because
// the visit and the signup are separated by a Google sign-in that reloads the page.
const SOURCE_KEY = 'flytag.signupSource';

/** Mark the signed-in rider active today. The server ignores repeats on the same day. */
export async function recordActivity(): Promise<void> {
  const { error } = await supabase.rpc('record_activity');
  if (error) throw error;
}

/** Remember a link's source, unless one is already remembered (the first link gets the credit). */
export async function rememberSignupSource(source: string): Promise<void> {
  const existing = await AsyncStorage.getItem(SOURCE_KEY);
  if (!existing) await AsyncStorage.setItem(SOURCE_KEY, source);
}

export async function readSignupSource(): Promise<string | null> {
  return AsyncStorage.getItem(SOURCE_KEY);
}

/** After onboarding saved it, so a second account on the same browser doesn't inherit it. */
export async function forgetSignupSource(): Promise<void> {
  await AsyncStorage.removeItem(SOURCE_KEY);
}
