import { Text, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';

import { useThemeColors } from '@/theme/useThemeMode';

export type StepState = 'done' | 'current' | 'next';

type Props = { steps: { label: string; state?: StepState }[]; label?: string };

const PILL: Record<StepState, string> = {
  done: 'bg-sky',
  current: 'bg-inverse',
  next: 'bg-glass border-[1.5px] border-line-strong',
};
const INK: Record<StepState, string> = { done: 'text-on-sky', current: 'text-on-inverse', next: 'text-ink' };
const SPOKEN: Record<StepState, string> = { done: 'done', current: 'current step', next: 'not yet' };

/** Ride progress as pills joined by dashed lines: done = sky, current = inverse, next = outlined. */
export function Timeline({ steps, label = 'Ride progress' }: Props) {
  const c = useThemeColors();
  return (
    <View className="flex-row items-center" accessibilityLabel={label} accessibilityRole="summary">
      {steps.map((s, i) => {
        const state = s.state ?? 'next';
        const last = i === steps.length - 1;
        return (
          <View key={s.label} className={`flex-row items-center ${last ? '' : 'flex-1'}`}>
            <View
              className={`h-[32px] flex-row items-center rounded-pill px-space-4 ${PILL[state]}`}
              accessible
              accessibilityLabel={`${s.label}, ${SPOKEN[state]}`}
            >
              <Text className={`font-700 text-[14px] leading-[20px] ${INK[state]}`} numberOfLines={1}>
                {s.label}
              </Text>
            </View>
            {!last && (
              // React Native can't dash a single border side on iOS, so the connector is drawn.
              <View className="mx-space-2 min-w-space-4 flex-1">
                <Svg height={2} width="100%">
                  <Line
                    x1="0"
                    y1="1"
                    x2="100%"
                    y2="1"
                    stroke={c.lineStrong}
                    strokeWidth={2}
                    strokeDasharray="4 4"
                  />
                </Svg>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}
