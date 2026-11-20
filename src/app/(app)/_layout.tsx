import { Stack } from 'expo-router';

import { useIsGuest } from '@/features/auth';
import { radius } from '@/theme/tokens';

// Native bottom sheet (§5.3): no extra library, and it drags/dismisses like iOS/Android expect.
const SHEET = {
  presentation: 'formSheet' as const,
  sheetAllowedDetents: [0.92],
  sheetGrabberVisible: true,
  sheetCornerRadius: radius.xl,
};

// The tabs, with ride and rider screens stacked on top. Guests see the tabs and ride pages;
// screens that need an account are guarded here, so a deep link can't reach them either.
export default function AppLayout() {
  const guest = useIsGuest();
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="rides/[rideId]/index" />
      <Stack.Protected guard={!guest} redirectTo="/welcome">
        <Stack.Screen name="rides/new" options={SHEET} />
        <Stack.Screen name="rides/[rideId]/edit" options={SHEET} />
        <Stack.Screen name="rides/[rideId]/chat" />
        <Stack.Screen name="riders/[userId]" />
        <Stack.Screen name="settings/edit-profile" />
      </Stack.Protected>
    </Stack>
  );
}
