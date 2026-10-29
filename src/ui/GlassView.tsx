import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View, type ViewProps } from 'react-native';

import { withAlpha } from '@/theme/color';
import { blur } from '@/theme/tokens';
import { useShadow, useThemeColors, useThemeMode } from '@/theme/useThemeMode';

type Props = ViewProps & {
  className?: string;
  /** "mist": glass over mist/charcoal grounds. "sky": glass-on-sky over the atmos backdrop. */
  tone?: 'mist' | 'sky';
  /** "soft" for small pills where a strong blur smears the text behind. */
  strength?: 'glass' | 'soft';
  shadow?: boolean;
};

// expo-blur's intensity runs 0–100; 2× the token's px radius lands close to the artifact's look.
const intensity = (px: number) => Math.min(100, px * 2);
// §5.3 fallback. Android blur needs a BlurTargetView wired to whatever sits behind each panel,
// which floating glass (tab bar, cards over a list) can't promise, so Android draws a
// near-opaque surface instead. This is the only place that decision lives.
const ANDROID_FILL_OPACITY = 0.92;

/** Frosted panel: blur + translucent glass fill + 1 px glass-edge rim + shadow-glass. */
export function GlassView({
  className = '',
  tone = 'mist',
  strength = 'glass',
  shadow = true,
  style,
  children,
  ...rest
}: Props) {
  const { theme } = useThemeMode();
  const c = useThemeColors();
  const shadowStyle = useShadow('glass');
  const onSky = tone === 'sky';

  const fill =
    Platform.OS === 'android' && !onSky
      ? withAlpha(c.surface, ANDROID_FILL_OPACITY)
      : onSky
        ? c.glassOnSky
        : c.glass;
  const edge = onSky ? withAlpha(c.onAtmos, 0.3) : c.glassEdge;

  return (
    <View
      {...rest}
      className={`overflow-hidden border ${className}`}
      style={[{ borderColor: edge }, shadow && !onSky && shadowStyle, style]}
    >
      {Platform.OS === 'ios' && (
        <BlurView
          intensity={intensity(strength === 'soft' ? blur.glassBlurSoft : blur.glassBlur)}
          tint={onSky ? 'dark' : theme}
          style={StyleSheet.absoluteFill}
        />
      )}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: fill }]} />
      {children}
    </View>
  );
}
