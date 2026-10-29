import { Stack } from 'expo-router';

// Signed-in app. The tabs now; ride detail, rider profile and settings stack on top later.
export default function AppLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
