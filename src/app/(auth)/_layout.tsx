import { Stack } from 'expo-router';

import { useSession } from '@/features/auth';

// Signed out: Welcome → Sign up or Sign in → Verify. Signed in but not onboarded: only Onboarding.
export default function AuthLayout() {
  const { session } = useSession();
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!session} redirectTo="/onboarding">
        <Stack.Screen name="welcome" />
        <Stack.Screen name="sign-up" />
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="verify" />
      </Stack.Protected>
      <Stack.Protected guard={Boolean(session)} redirectTo="/welcome">
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
    </Stack>
  );
}
