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

// Web only. In CSS a positioned layer (the blur and fill here) paints ON TOP of ordinary content
// like a text input, whatever the source order, so the glass swallowed taps on the chat box.
// The panel gets its own layering context and the two layers sit behind its content. Phones
// stack by order already, so they're untouched.
const WEB_OWN_LAYERS = Platform.OS === 'web' ? { zIndex: 0 } : null;
const WEB_BEHIND_CONTENT = Platform.OS === 'web' ? { zIndex: -1 } : null;

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
      style={[{ borderColor: edge }, shadow && !onSky && shadowStyle, WEB_OWN_LAYERS, style]}
    >
      {/* iOS: native blur. Web: expo-blur uses the browser's backdrop-filter. */}
      {(Platform.OS === 'ios' || Platform.OS === 'web') && (
        <BlurView
          intensity={intensity(strength === 'soft' ? blur.glassBlurSoft : blur.glassBlur)}
          tint={onSky ? 'dark' : theme}
          style={[StyleSheet.absoluteFill, WEB_BEHIND_CONTENT]}
          pointerEvents="none"
        />
      )}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, WEB_BEHIND_CONTENT, { backgroundColor: fill }]} />
      {children}
    </View>
  );
}
