import { Text, View } from 'react-native';

import { GlassView } from './GlassView';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';

type Props = {
  /**
   * chevron: a trailing > that tells people the row opens something (e.g. the editor).
   * onRemove: a trailing × that deletes the row (e.g. a saved area); its label is "Remove <label>".
   */
  items: { label: string; meta?: string; chevron?: boolean; onRemove?: () => void }[];
  /** Index of the highlighted row, if any. */
  active?: number;
  onSelect?: (index: number) => void;
  label: string;
};

// The × is 18 pt; this slop grows its touch area to the 48 pt minimum.
const REMOVE_SLOP = { top: 15, bottom: 15, left: 15, right: 15 };

/** Numbered glass menu (01, 02 …) from the deck's agenda, used for Profile settings. */
export function Menu({ items, active, onSelect, label }: Props) {
  return (
    <GlassView className="rounded-lg p-space-2" accessibilityRole="menu" accessibilityLabel={label}>
      {items.map((it, i) => {
        const on = i === active;
        const n = String(i + 1).padStart(2, '0');
        return (
          <PressableScale
            // Index too: a custom label can match another row's (an area called "Sixth").
            key={`${i}-${it.label}`}
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
              {/* With a value, the label keeps its full width and a long value ("Thurgood Marshall
                  College") is the one that gets shortened; without one, the label fills the row. */}
              <Text
                className={`type-body ${it.meta ? 'shrink-0' : 'flex-1'} ${on ? 'text-on-inverse' : 'text-ink'}`}
                numberOfLines={1}
              >
                {it.label}
              </Text>
              {it.meta && (
                <Text
                  className={`flex-1 text-right font-400 text-[14px] opacity-80 ${on ? 'text-on-inverse' : 'text-ink'}`}
                  numberOfLines={1}
                >
                  {it.meta}
                </Text>
              )}
              {it.onRemove && (
                <PressableScale
                  onPress={it.onRemove}
                  hitSlop={REMOVE_SLOP}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${it.label}`}
                >
                  <Icon
                    name="x"
                    size={18}
                    strokeWidth={2}
                    className={on ? 'text-on-inverse' : 'text-ink-muted'}
                  />
                </PressableScale>
              )}
              {it.chevron && (
                <Icon
                  name="chevron-right"
                  size={18}
                  strokeWidth={2}
                  className={on ? 'text-on-inverse' : 'text-ink-muted'}
                />
              )}
            </View>
          </PressableScale>
        );
      })}
    </GlassView>
  );
}
