import { Text, View } from 'react-native';

import { GlassView } from './GlassView';
import { Icon, type IconName } from './Icon';
import { PressableScale } from './PressableScale';

/** Rendered height (8 padding + 56 tab + 8 padding), so screens can keep content clear of it. */
export const TAB_BAR_HEIGHT = 72;

export type TabItem = { label: string; icon: IconName; active?: boolean; onPress?: () => void };

type Props = { items: TabItem[] };

/**
 * Floating glass pill of tabs; the active one is an inverse pill. Presentational: Phase 2
 * plugs it into Expo Router's Tabs as a custom tab bar, floating 16 px above the bottom inset.
 */
export function TabBar({ items }: Props) {
  return (
    <GlassView className="flex-row gap-space-1 rounded-pill p-space-2" accessibilityRole="tablist">
      {items.map((it) => {
        const ink = it.active ? 'text-on-inverse' : 'text-ink-muted';
        return (
          <PressableScale
            key={it.label}
            style={{ flex: 1 }}
            onPress={it.onPress}
            accessibilityRole="tab"
            accessibilityLabel={it.label}
            accessibilityState={{ selected: Boolean(it.active) }}
          >
            <View
              className={`items-center gap-[2px] rounded-pill px-space-1 py-space-2 ${it.active ? 'bg-inverse' : ''}`}
            >
              <Icon name={it.icon} size={22} className={ink} />
              <Text className={`type-caption ${ink}`} numberOfLines={1}>
                {it.label}
              </Text>
            </View>
          </PressableScale>
        );
      })}
    </GlassView>
  );
}
