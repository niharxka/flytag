import { Text, View } from 'react-native';

import { Avatar } from './Avatar';

type Props = { names: string[]; max?: number; size?: number };

// Avatars overlap by 10 px, as in the artifact.
const OVERLAP = -10;

/** Up to `max` riders' faces, then a "+N" chip. Read out as "N riders", not each name. */
export function AvatarStack({ names, max = 3, size = 32 }: Props) {
  const shown = names.slice(0, max);
  const more = names.length - shown.length;
  return (
    <View
      className="flex-row items-center"
      accessible
      accessibilityLabel={`${names.length} ${names.length === 1 ? 'rider' : 'riders'}`}
    >
      {shown.map((n, i) => (
        <View key={`${n}-${i}`} style={{ marginLeft: i === 0 ? 0 : OVERLAP }}>
          <Avatar name={n} size={size} ring />
        </View>
      ))}
      {more > 0 && (
        <View
          className="items-center justify-center rounded-pill bg-mist-deep"
          style={{ width: size, height: size, marginLeft: OVERLAP }}
        >
          <Text className="font-700 text-ink" style={{ fontSize: Math.round(size * 0.36) }}>
            +{more}
          </Text>
        </View>
      )}
    </View>
  );
}
