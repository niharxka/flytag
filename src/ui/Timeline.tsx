import { Text, View } from 'react-native';

export type StepState = 'done' | 'current' | 'next';

type Props = { steps: { label: string; state?: StepState }[]; label?: string };

const PILL: Record<StepState, string> = {
  done: 'bg-sky',
  current: 'bg-inverse',
  next: 'bg-glass border-[1.5px] border-line-strong',
};
const INK: Record<StepState, string> = { done: 'text-on-sky', current: 'text-on-inverse', next: 'text-ink' };
const SPOKEN: Record<StepState, string> = { done: 'done', current: 'current step', next: 'not yet' };

/**
 * Ride progress as a row of equal-width pills: done = sky, current = inverse, next = outlined.
 * Equal widths keep the steps evenly spaced whatever the words are. The brand artifact joined
 * 3 pills with dashed lines; with 4 steps on a phone those lines shrank to stray dots, so the
 * colour sequence alone carries the progression.
 */
export function Timeline({ steps, label = 'Ride progress' }: Props) {
  return (
    <View className="flex-row gap-space-2" accessibilityLabel={label} accessibilityRole="summary">
      {steps.map((s) => {
        const state = s.state ?? 'next';
        return (
          <View
            key={s.label}
            className={`h-[32px] flex-1 items-center justify-center rounded-pill px-space-2 ${PILL[state]}`}
            accessible
            accessibilityLabel={`${s.label}, ${SPOKEN[state]}`}
          >
            {/* Shrinks a little instead of cutting off ("At campus", large accessibility text). */}
            <Text
              className={`font-700 text-[14px] leading-[20px] ${INK[state]}`}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              {s.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
