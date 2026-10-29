import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { errorMessage } from '@/lib/errors';
import { Backdrop, Button, GoogleButton, Plane } from '@/ui';

import { useSignInWithGoogle } from './auth.hooks';

// Email codes need a real email service in production, so the public app signs in with Google
// only. Development builds keep the email-code screens for the demo accounts and Mailpit.
const EMAIL_CODES = __DEV__;

/**
 * Screen 01 (§9.1): sky backdrop, the plane glides in once, then "Continue with Google"
 * (UCSD accounts; new students get an account, returning ones are signed in). Signed-out only.
 */
export function WelcomeScreen() {
  const google = useSignInWithGoogle();

  return (
    <Backdrop tone="sky">
      <SafeAreaView className="flex-1">
        {/* Padding lives on this inner view: on the web SafeAreaView replaces its own side padding with the (zero) insets. */}
        <View className="flex-1 items-center justify-center gap-space-5 px-space-5">
          <Plane width={230} animate="glide" delay={300} label="" />
          <View className="items-center">
            <Text
              className="type-display text-center text-on-atmos"
              maxFontSizeMultiplier={1.2}
              accessibilityRole="header"
            >
              FlyTag.
            </Text>
            <Text className="type-body-lg mt-space-3 text-center text-on-atmos">
              Tag along with fellow classmates to and from the airport.
            </Text>
          </View>
          {/* items-center shrinks children to their content; self-stretch keeps the buttons full width. */}
          <View className="gap-space-3 self-stretch">
            <GoogleButton onPress={() => google.mutate()} loading={google.isPending} />
            <Text className="type-body-sm text-center text-on-atmos">Use your @ucsd.edu Google account.</Text>
            {google.error && (
              <Text
                className="type-body-sm rounded-md bg-surface px-space-4 py-space-3 text-center text-danger"
                accessibilityRole="alert"
              >
                {errorMessage(google.error)}
              </Text>
            )}
            {EMAIL_CODES && (
              <Button variant="glass" block onPress={() => router.push('/sign-in')}>
                Use an email code (dev)
              </Button>
            )}
          </View>
        </View>
      </SafeAreaView>
    </Backdrop>
  );
}
