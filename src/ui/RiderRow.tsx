import { Text, View } from 'react-native';

import { Avatar } from './Avatar';
import { IconButton } from './IconButton';
import { Tag, type TagTone } from './Tag';

type Props = {
  name: string;
  college?: string;
  src?: string;
  /** Rider intent, e.g. { label: 'Networking', tone: 'sky' } or { label: 'FlyPal', tone: 'deep' }. */
  tag?: { label: string; tone?: TagTone };
  /** Whether this rider shares a phone number with co-riders. */
  phoneShared?: boolean;
  onCall?: () => void;
};

/** A rider in a ride's panel. The call button stays visible when disabled and says why. */
export function RiderRow({ name, college, src, tag, phoneShared = false, onCall }: Props) {
  return (
    <View className="flex-row items-center gap-space-3 rounded-pill bg-surface p-space-2">
      <Avatar name={name} src={src} />
      <View className="min-w-0 flex-1">
        <Text className="font-600 text-[16px] leading-[20px] text-ink" numberOfLines={1}>
          {name}
        </Text>
        {college && <Text className="font-400 text-[13px] leading-[16px] text-ink-muted">{college}</Text>}
      </View>
      {tag && <Tag label={tag.label} tone={tag.tone ?? 'sky'} />}
      <IconButton
        icon="phone"
        size="sm"
        variant={phoneShared ? 'charcoal' : 'muted'}
        disabled={!phoneShared}
        label={phoneShared ? `Call ${name}` : `${name} hasn’t shared a number`}
        onPress={onCall}
      />
    </View>
  );
}
