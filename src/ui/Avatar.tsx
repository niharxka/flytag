import { Image } from 'expo-image';
import { Text, View } from 'react-native';

import { radius, size as sizes } from '@/theme/tokens';
import { useThemeColors } from '@/theme/useThemeMode';

import { Icon } from './Icon';
import { PressableScale } from './PressableScale';

export type AvatarTone = 'sky' | 'deep' | 'charcoal' | 'white';

type Props = {
  name?: string;
  /** Profile photo URL. Without one we show initials. */
  src?: string;
  size?: number;
  shape?: 'circle' | 'tile';
  /** 2 px mist ring, to separate overlapping avatars in a stack. */
  ring?: boolean;
  tone?: AvatarTone;
  onPress?: () => void;
  /** What tapping does, e.g. "Open profile". */
  buttonLabel?: string;
};

const BOX: Record<AvatarTone, string> = {
  sky: 'bg-sky',
  deep: 'bg-atmos-deep',
  charcoal: 'bg-charcoal',
  white: 'bg-surface',
};
const INK: Record<AvatarTone, string> = {
  sky: 'text-on-sky',
  deep: 'text-on-atmos',
  charcoal: 'text-on-charcoal',
  white: 'text-ink',
};
const NAME_TONES: AvatarTone[] = ['sky', 'deep', 'charcoal'];

/** Same name → same colour everywhere (sum of character codes), so riders are recognisable. */
export function toneForName(name: string): AvatarTone {
  let sum = 0;
  for (const ch of name) sum += ch.charCodeAt(0);
  return NAME_TONES[sum % NAME_TONES.length];
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

export function Avatar({
  name = '',
  src,
  size = sizes.avatarMd,
  shape = 'circle',
  ring,
  tone,
  onPress,
  buttonLabel,
}: Props) {
  const c = useThemeColors();
  const t = tone ?? (name ? toneForName(name) : 'white');
  const box = {
    width: size,
    height: size,
    borderRadius: shape === 'tile' ? radius.md : radius.pill,
    boxShadow: ring ? `0 0 0 2px ${c.mist}` : undefined,
  };
  const letters = initials(name);

  const face = (
    <View
      className={`items-center justify-center overflow-hidden ${BOX[t]}`}
      style={box}
      accessible={!onPress}
      accessibilityRole={onPress ? undefined : 'image'}
      accessibilityLabel={onPress ? undefined : name || 'Profile'}
    >
      {src ? (
        <Image source={src} style={{ width: size, height: size }} contentFit="cover" />
      ) : letters ? (
        <Text className={`font-700 ${INK[t]}`} style={{ fontSize: Math.round(size * 0.38) }}>
          {letters}
        </Text>
      ) : (
        <Icon name="user" size={Math.round(size * 0.55)} strokeWidth={2} className={INK[t]} />
      )}
    </View>
  );

  if (!onPress) return face;
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={buttonLabel ?? 'Open profile'}
      hitSlop={size < sizes.controlMd ? (sizes.controlMd - size) / 2 : undefined}
    >
      {face}
    </PressableScale>
  );
}
