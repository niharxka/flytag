import { useState } from 'react';
import { Text, View } from 'react-native';

import { withAlpha } from '@/theme/color';
import { useThemeColors } from '@/theme/useThemeMode';

import { Icon, type IconName } from './Icon';
import { PressableScale } from './PressableScale';

type Option = string | { label: string; icon?: IconName };

type Props = {
  options: Option[];
  /** Controlled index. Leave out to let the control keep its own state. */
  value?: number;
  defaultValue?: number;
  onChange?: (index: number) => void;
  /** What the choice is about, e.g. "Direction". */
  label: string;
};

/** Pill track (mist-deep) with the chosen option in sky. Options are 40 tall inside a 48 track. */
export function SegmentedControl({ options, value, defaultValue = 0, onChange, label }: Props) {
  const c = useThemeColors();
  const [own, setOwn] = useState(defaultValue);
  const selected = value ?? own;

  return (
    <View
      className="flex-row gap-space-1 rounded-pill bg-mist-deep p-space-1"
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
    >
      {options.map((o, i) => {
        const opt = typeof o === 'string' ? { label: o } : o;
        const on = i === selected;
        const ink = on ? 'text-on-sky' : 'text-ink-muted';
        return (
          <PressableScale
            key={opt.label}
            style={{ flex: 1 }}
            onPress={() => {
              setOwn(i);
              onChange?.(i);
            }}
            accessibilityRole="radio"
            accessibilityLabel={opt.label}
            accessibilityState={{ checked: on }}
          >
            <View
              className={`h-[40px] flex-row items-center justify-center gap-space-2 rounded-pill px-space-4 ${on ? 'bg-sky' : ''}`}
              style={on ? { boxShadow: `0 2px 8px ${withAlpha(c.skyDeep, 0.18)}` } : undefined}
            >
              {opt.icon && <Icon name={opt.icon} size={18} className={ink} />}
              <Text className={`font-600 text-[15px] leading-[20px] ${ink}`} numberOfLines={1}>
                {opt.label}
              </Text>
            </View>
          </PressableScale>
        );
      })}
    </View>
  );
}
