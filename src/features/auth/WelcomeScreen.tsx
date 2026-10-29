import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Backdrop, Button, Plane } from '@/ui';

/** Screen 01 (§9.1): sky backdrop, the plane glides in once, then "Get started". Signed-out only. */
export function WelcomeScreen() {
  return (
    <Backdrop tone="sky">
      <SafeAreaView className="flex-1 justify-end gap-space-5 px-space-5 pb-space-6">
        <Plane width={230} animate="glide" delay={300} label="" />
        <View>
          <Text className="type-display text-on-atmos" maxFontSizeMultiplier={1.2} accessibilityRole="header">
            FlyTag.
          </Text>
          <Text className="type-body-lg mt-space-3 text-on-atmos">
            Tag along with fellow classmates to and from the airport.
          </Text>
        </View>
        <Button variant="glass" size="lg" block iconEnd="arrow-right" onPress={() => router.push('/sign-in')}>
          Get started
        </Button>
      </SafeAreaView>
    </Backdrop>
  );
}
