import { Redirect, router } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useThemeColors } from '@/theme/useThemeMode';
import { Backdrop, Button } from '@/ui';

import { useSession } from './AuthProvider';

/**
 * Where Google sends the browser back after sign-in (/auth/callback). supabase-js has already
 * swapped the ?code= for a session while the app started; this page just waits for it and
 * moves on, or explains a refusal (e.g. "Use your @ucsd.edu email." from the hook).
 */
export function AuthCallback({ error }: { error?: string }) {
  const c = useThemeColors();
  const { session, initializing } = useSession();

  if (!error && session) return <Redirect href="/" />;

  const failed = error ?? (!initializing ? 'Sign-in didn’t finish. Try again.' : undefined);
  return (
    <Backdrop tone="sky">
      <SafeAreaView className="flex-1 items-center justify-center gap-space-4 px-space-5">
        {failed ? (
          <View className="gap-space-4 self-stretch">
            <Text
              className="type-body rounded-md bg-surface p-space-4 text-center text-danger"
              accessibilityRole="alert"
            >
              {failed}
            </Text>
            <Button variant="glass" size="lg" block onPress={() => router.replace('/welcome')}>
              Back
            </Button>
          </View>
        ) : (
          <ActivityIndicator color={c.onAtmos} accessibilityLabel="Signing you in" />
        )}
      </SafeAreaView>
    </Backdrop>
  );
}
