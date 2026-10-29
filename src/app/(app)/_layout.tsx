import { Stack } from 'expo-router';

import { radius } from '@/theme/tokens';

// Native bottom sheet (§5.3): no extra library, and it drags/dismisses like iOS/Android expect.
const SHEET = {
  presentation: 'formSheet' as const,
  sheetAllowedDetents: [0.92],
  sheetGrabberVisible: true,
  sheetCornerRadius: radius.xl,
};

// Signed-in app: the tabs, with ride and rider screens stacked on top.
export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="rides/new" options={SHEET} />
      <Stack.Screen name="rides/[rideId]/index" />
      <Stack.Screen name="rides/[rideId]/edit" options={SHEET} />
      <Stack.Screen name="rides/[rideId]/chat" />
      <Stack.Screen name="riders/[userId]" />
      <Stack.Screen name="settings/edit-profile" />
    </Stack>
  );
}
