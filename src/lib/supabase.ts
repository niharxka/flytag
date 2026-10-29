import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, processLock } from '@supabase/supabase-js';
import { AppState } from 'react-native';

import type { Database } from './database.types';
import { env } from './env';

/**
 * The one Supabase client (spec §8.1). Only *.api.ts files import it (lint enforces this).
 * Setup follows Supabase's Expo guide: the session persists in AsyncStorage so you stay signed
 * in across launches; processLock stops two token refreshes racing each other.
 */
export const supabase = createClient<Database>(env.supabaseUrl, env.supabasePublishableKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // There are no sign-in links (codes only), so never look for a session in a URL.
    detectSessionInUrl: false,
    lock: processLock,
  },
});

// Refresh the access token only while the app is on screen. A backgrounded app can't keep a
// timer alive, so the refresh would otherwise fire late or not at all.
AppState.addEventListener('change', (state) => {
  if (state === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});
