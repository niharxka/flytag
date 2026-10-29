import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { withAlpha } from '@/theme/color';
import { useShadow, useThemeColors } from '@/theme/useThemeMode';

import { GlassView } from './GlassView';
import { Icon, type IconName } from './Icon';
import { SkyGradient } from './SkyGradient';

type Tone = 'glass' | 'sky' | 'charcoal';

type Props = {
  title: string;
  body?: string;
  /** Number pill before the title, e.g. "01". */
  index?: string;
  icon?: IconName;
  /** charcoal stays dark in both themes and is flat (the deck never shadows its dark panels). */
  tone?: Tone;
  footer?: ReactNode;
};

const INK: Record<Tone, string> = { glass: 'text-ink', sky: 'text-on-sky', charcoal: 'text-on-charcoal' };
const INDEX: Record<Tone, string> = {
  glass: 'bg-surface border-ink',
  sky: 'bg-sky-glow border-on-sky',
  charcoal: 'bg-transparent border-on-charcoal',
};

export function ContentCard({ title, body, index, icon, tone = 'glass', footer }: Props) {
  const c = useThemeColors();
  const shadow = useShadow('glass');
  const ink = INK[tone];

  const content = (
    <View className="p-space-5">
      <View className="mb-space-3 flex-row items-center gap-space-3">
        {index && (
          <View
            className={`h-[28px] min-w-[44px] items-center justify-center rounded-pill border px-space-3 ${INDEX[tone]}`}
          >
            <Text className={`font-700 text-[13px] leading-[16px] ${tone === 'glass' ? 'text-ink' : ink}`}>
              {index}
            </Text>
          </View>
        )}
        {icon && <Icon name={icon} size={26} className={ink} />}
        <Text className={`type-heading flex-1 ${ink}`} accessibilityRole="header">
          {title}
        </Text>
      </View>
      {body && (
        <Text className={`type-body-sm ${ink} ${tone === 'charcoal' ? 'opacity-80' : 'opacity-90'}`}>
          {body}
        </Text>
      )}
      {footer}
    </View>
  );

  if (tone === 'glass') return <GlassView className="rounded-lg">{content}</GlassView>;
  if (tone === 'sky') {
    return (
      <View className="overflow-hidden rounded-lg border border-glass-edge" style={shadow}>
        <SkyGradient glowAt={0.85} />
        {content}
      </View>
    );
  }
  return (
    <View
      className="rounded-lg bg-charcoal"
      style={{ borderWidth: 1, borderColor: withAlpha(c.onCharcoal, 0.08) }}
    >
      {content}
    </View>
  );
}
