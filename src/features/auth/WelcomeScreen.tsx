import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Backdrop, Button, Plane } from '@/ui';

/**
 * Screen 01 (§9.1): sky backdrop, the plane glides in once, then "Get started" (Sign up) or
 * "Sign in". Signed-out only: a saved session skips straight past it.
 */
export function WelcomeScreen() {
  return (
    <Backdrop tone="sky">
      <SafeAreaView className="flex-1 items-center justify-center gap-space-5 px-space-5">
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
          <Button
            variant="glass"
            size="lg"
            block
            iconEnd="arrow-right"
            onPress={() => router.push('/sign-up')}
          >
            Get started
          </Button>
          <Button
            variant="glass"
            size="lg"
            block
            iconEnd="arrow-right"
            onPress={() => router.push('/sign-in')}
          >
            Sign in
          </Button>
        </View>
      </SafeAreaView>
    </Backdrop>
  );
}
