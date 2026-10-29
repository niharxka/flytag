import { Text, View } from 'react-native';

import { Icon, type IconName } from './Icon';

export type TagTone = 'sky' | 'deep' | 'glass' | 'charcoal' | 'go' | 'outline';

type Props = {
  label: string;
  /** Rider intents keep their colours: Networking = sky, FlyPal = deep. go = success (e.g. "Full"). */
  tone?: TagTone;
  icon?: IconName;
};

const BOX: Record<TagTone, string> = {
  sky: 'bg-sky',
  deep: 'bg-atmos-deep',
  glass: 'bg-glass border border-glass-edge',
  charcoal: 'bg-inverse',
  go: 'bg-surface border border-go',
  outline: 'border border-line-strong',
};
const INK: Record<TagTone, string> = {
  sky: 'text-on-sky',
  deep: 'text-on-atmos',
  glass: 'text-ink',
  charcoal: 'text-on-inverse',
  go: 'text-go',
  outline: 'text-ink',
};

export function Tag({ label, tone = 'glass', icon }: Props) {
  return (
    <View
      className={`h-[26px] flex-row items-center gap-space-1 self-start rounded-pill px-space-3 ${BOX[tone]}`}
    >
      {icon && <Icon name={icon} size={14} strokeWidth={2} className={INK[tone]} />}
      <Text className={`type-caption ${INK[tone]}`} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}
