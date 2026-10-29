import { Tabs, type BottomTabBarProps } from 'expo-router/js-tabs';
import { View } from 'react-native';

import { spacing } from '@/theme/tokens';
import { TabBar, type IconName } from '@/ui';

const ICONS: Record<string, IconName> = {
  index: 'plane-depart',
  chats: 'chat',
  alerts: 'bell',
  profile: 'user',
};

// Adapts the navigator's state to the presentational TabBar, floating space-4 above the
// bottom inset (§5.3). Screens pad their content so the last item clears it.
function FloatingTabBar({ state, descriptors, navigateToTab, insets }: BottomTabBarProps) {
  const items = state.routes.map((route, i) => ({
    label: descriptors[route.key].options.title ?? route.name,
    icon: ICONS[route.name] ?? 'home',
    active: state.index === i,
    onPress: () => navigateToTab(route.key),
  }));
  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: spacing.space4,
        right: spacing.space4,
        bottom: insets.bottom + spacing.space4,
      }}
    >
      <TabBar items={items} />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <FloatingTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Rides' }} />
      <Tabs.Screen name="chats" options={{ title: 'Chats' }} />
      <Tabs.Screen name="alerts" options={{ title: 'Alerts' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
