import { useState } from 'react';
import { Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Icon } from './Icon';
import { PressableScale } from './PressableScale';
import './interop';

type Props = {
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  onChange?: (n: number) => void;
  /** e.g. "Max riders". */
  label?: string;
};

function StepButton({
  kind,
  disabled,
  onPress,
}: {
  kind: 'less' | 'more';
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={kind === 'less' ? 'Fewer seats' : 'More seats'}
      accessibilityState={{ disabled }}
    >
      <View
        className={`h-[40px] w-[40px] items-center justify-center rounded-pill bg-surface ${disabled ? 'opacity-40' : ''}`}
      >
        {kind === 'more' ? (
          <Icon name="plus" size={18} strokeWidth={2.2} className="text-ink" />
        ) : (
          // The icon set has no minus; this is the plus's horizontal stroke.
          <Svg
            width={18}
            height={18}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            className="text-ink"
          >
            <Path d="M5 12h14" />
          </Svg>
        )}
      </View>
    </PressableScale>
  );
}

/**
 * − value + in a mist-deep pill. To screen readers it's one "adjustable" control
 * (swipe up/down to change), with the buttons still reachable for touch.
 */
export function SeatStepper({ value, defaultValue = 3, min = 1, max = 6, onChange, label = 'Seats' }: Props) {
  const [own, setOwn] = useState(defaultValue);
  const v = value ?? own;
  const set = (n: number) => {
    const next = Math.max(min, Math.min(max, n));
    setOwn(next);
    onChange?.(next);
  };

  return (
    <View
      className="flex-row items-center gap-space-2 self-start rounded-pill bg-mist-deep p-space-1"
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min, max, now: v, text: String(v) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => set(e.nativeEvent.actionName === 'increment' ? v + 1 : v - 1)}
    >
      <StepButton kind="less" disabled={v <= min} onPress={() => set(v - 1)} />
      <Text
        className="min-w-space-6 text-center font-700 text-[18px] leading-[24px] text-ink"
        style={{ fontVariant: ['tabular-nums'] }}
      >
        {v}
      </Text>
      <StepButton kind="more" disabled={v >= max} onPress={() => set(v + 1)} />
    </View>
  );
}
