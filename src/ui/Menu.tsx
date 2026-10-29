import { Text, View } from 'react-native';

import { GlassView } from './GlassView';
import { PressableScale } from './PressableScale';

type Props = {
  items: { label: string; meta?: string }[];
  /** Index of the highlighted row, if any. */
  active?: number;
  onSelect?: (index: number) => void;
  label: string;
};

/** Numbered glass menu (01, 02 …) from the deck's agenda, used for Profile settings. */
export function Menu({ items, active, onSelect, label }: Props) {
  return (
    <GlassView className="rounded-lg p-space-2" accessibilityRole="menu" accessibilityLabel={label}>
      {items.map((it, i) => {
        const on = i === active;
        const n = String(i + 1).padStart(2, '0');
        return (
          <PressableScale
            key={it.label}
            onPress={() => onSelect?.(i)}
            accessibilityRole="menuitem"
            accessibilityLabel={it.meta ? `${it.label}, ${it.meta}` : it.label}
            accessibilityState={{ selected: on }}
          >
            <View
              className={`flex-row items-center gap-space-4 rounded-pill px-space-4 py-space-3 ${on ? 'bg-inverse' : ''}`}
            >
              <Text
                className={`font-700 text-[13px] leading-[16px] tracking-[0.52px] ${on ? 'text-on-inverse opacity-75' : 'text-ink-muted'}`}
                style={{ fontVariant: ['tabular-nums'] }}
              >
                {n}
              </Text>
              <Text className={`type-body flex-1 ${on ? 'text-on-inverse' : 'text-ink'}`} numberOfLines={1}>
                {it.label}
              </Text>
              {it.meta && (
                <Text className={`font-400 text-[14px] opacity-80 ${on ? 'text-on-inverse' : 'text-ink'}`}>
                  {it.meta}
                </Text>
              )}
            </View>
          </PressableScale>
        );
      })}
    </GlassView>
  );
}
