import { Stack } from 'expo-router';

import { radius } from '@/theme/tokens';

// Signed-in app: the tabs, with ride screens stacked on top.
export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      {/* Native bottom sheet (§5.3): no extra library, and it drags/dismisses like iOS/Android expect. */}
      <Stack.Screen
        name="rides/new"
        options={{
          presentation: 'formSheet',
          sheetAllowedDetents: [0.92],
          sheetGrabberVisible: true,
          sheetCornerRadius: radius.xl,
        }}
      />
      <Stack.Screen name="rides/[rideId]" />
    </Stack>
  );
}
