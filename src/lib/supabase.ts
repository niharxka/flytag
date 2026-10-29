import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import type { Database } from './database.types';
import { env } from './env';

/**
 * The one Supabase client (spec §8.1). Only *.api.ts files import it (lint enforces this).
 * Setup follows Supabase's Expo guide: the session persists in AsyncStorage so you stay signed
 * in across launches. PKCE is the secure redirect flow "Sign in with Google" uses: the app
 * keeps a one-time secret and swaps the code Google returns for a session.
 */
export const supabase = createClient<Database>(env.supabaseUrl, env.supabasePublishableKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    flowType: 'pkce',
    // On the web, Google sends the browser back to /auth/callback?code=…; supabase-js reads that
    // code itself. Phones get the code from the in-app browser instead (see auth.api.ts).
    detectSessionInUrl: Platform.OS === 'web',
  },
});

// Refresh the access token only while the app is on screen. A backgrounded app can't keep a
// timer alive, so the refresh would otherwise fire late or not at all.
AppState.addEventListener('change', (state) => {
  if (state === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});
