import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useThemeMode } from '@/theme/useThemeMode';
import { Backdrop, Button, Plane } from '@/ui';

// Temporary home while the app has no screens: links to the component gallery.
// Replaced by the auth gate (Welcome / Rides) in Phase 2.
export default function Index() {
  const { theme, toggleTheme } = useThemeMode();

  return (
    <Backdrop tone="sky">
      <SafeAreaView className="flex-1 justify-end gap-space-5 px-space-5 pb-space-6">
        <Plane width={230} animate="glide" delay={300} label="" />
        <View>
          <Text className="type-display text-on-atmos" maxFontSizeMultiplier={1.2}>
            FlyTag.
          </Text>
          <Text className="type-body-lg mt-space-3 text-on-atmos">Phase 1 · design system</Text>
        </View>
        <Button variant="glass" size="lg" block iconEnd="arrow-right" onPress={() => router.push('/dev/ui')}>
          Open gallery
        </Button>
        <Button variant="glass" block onPress={toggleTheme}>
          {theme === 'dark' ? 'Switch to Mist' : 'Switch to Charcoal'}
        </Button>
      </SafeAreaView>
    </Backdrop>
  );
}
