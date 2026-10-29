import '../../global.css';

import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { AuthProvider, useSession } from '@/features/auth';
import { useMyProfile } from '@/features/profile';
import { queryClient } from '@/lib/queryClient';
import { fontAssets } from '@/theme/fonts';
import { useApplyThemePref, useThemeMode } from '@/theme/useThemeMode';

// Keep the splash up until fonts, the saved session and (if signed in) the profile are known,
// so nobody sees Welcome flash before they're sent to the tabs.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  if (!fontsLoaded && !fontError) return null;
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RootStack />
      </AuthProvider>
    </QueryClientProvider>
  );
}

/**
 * The auth gate (§9.2–9.3). Three states, each opening one part of the app:
 *   signed out            → (auth): welcome, sign-in, verify
 *   signed in, no onboard → (auth): onboarding
 *   onboarded             → (app): the tabs
 * Stack.Protected removes the screens whose guard is false and redirects away from them.
 */
function RootStack() {
  useApplyThemePref();
  const { theme } = useThemeMode();
  const { session, initializing } = useSession();
  const profile = useMyProfile(session?.user.id);
  const waitingForProfile = Boolean(session) && profile.isPending;
  const ready = !initializing && !waitingForProfile;
  const onboarded = Boolean(session && profile.data?.onboardedAt);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        {/* redirectTo matters: the app opens at "/", which only exists inside (app). Without it,
            a signed-out launch has nowhere to go and shows "Unmatched route". */}
        <Stack.Protected guard={!onboarded} redirectTo="/">
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={onboarded} redirectTo={session ? '/onboarding' : '/welcome'}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Screen name="dev/ui" />
      </Stack>
    </>
  );
}
