import {
  ActivityIndicator,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { withAlpha } from '@/theme/color';
import type { ColorName } from '@/theme/tokens';
import { useThemeColors } from '@/theme/useThemeMode';

import { Icon, type IconName } from './Icon';
import { PressableScale } from './PressableScale';

type Variant = 'primary' | 'sky' | 'secondary' | 'ghost' | 'glass';
type Size = 'sm' | 'md' | 'lg';

// Class strings are written out in full: NativeWind finds classes by scanning source text,
// so a class built at runtime (`bg-${x}`) would never be compiled.
const BOX: Record<Variant, string> = {
  primary: 'bg-inverse border-transparent',
  sky: 'bg-sky border-transparent',
  secondary: 'bg-surface border-line-strong',
  ghost: 'bg-transparent border-transparent',
  glass: 'bg-glass-on-sky',
};
const INK: Record<Variant, string> = {
  primary: 'text-on-inverse',
  sky: 'text-on-sky',
  secondary: 'text-ink',
  ghost: 'text-ink',
  glass: 'text-on-atmos',
};
// Same colours as INK, as JS values for the spinner (ActivityIndicator takes a colour prop).
const SPINNER: Record<Variant, ColorName> = {
  primary: 'onInverse',
  sky: 'onSky',
  secondary: 'ink',
  ghost: 'ink',
  glass: 'onAtmos',
};
const SIZE: Record<Size, string> = {
  sm: 'h-control-sm px-space-4',
  md: 'h-control-md px-space-5',
  lg: 'h-control-lg px-space-6',
};
const LABEL: Record<Size, string> = {
  sm: 'text-[14px] leading-[24px]',
  md: 'text-[16px] leading-[24px]',
  lg: 'text-[18px] leading-[24px]',
};
// sm is 36 tall; the slop makes the touch area 48 without changing how it looks.
const SM_SLOP = { top: 6, bottom: 6, left: 0, right: 0 };

type Props = Omit<PressableProps, 'children' | 'style'> & {
  /** Verb-first, 2–3 words: "Join ride". */
  children: string;
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  iconEnd?: IconName;
  /** Shows a spinner in place of the leading icon and blocks presses. */
  loading?: boolean;
  /** Full width. */
  block?: boolean;
  /** Layout only (flex, margins). Looks come from variant and size. */
  style?: StyleProp<ViewStyle>;
};

/** Pill button. Primary (`inverse`) at most once per screen; sky for the one action to notice. */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconEnd,
  loading = false,
  block = false,
  disabled,
  style,
  ...rest
}: Props) {
  const c = useThemeColors();
  const inactive = Boolean(disabled) || loading;
  const iconSize = size === 'lg' ? 22 : 18;
  // The glass rim is white at 35% in both themes: there's no token for it, so it's mixed here.
  const glassRim = variant === 'glass' ? { borderWidth: 1, borderColor: withAlpha(c.onAtmos, 0.35) } : null;

  return (
    <PressableScale
      {...rest}
      disabled={inactive}
      hitSlop={size === 'sm' ? SM_SLOP : undefined}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={[{ alignSelf: block ? 'stretch' : 'flex-start' }, style]}
    >
      {({ pressed }) => (
        <View
          className={`flex-row items-center justify-center gap-space-2 rounded-pill border-[1.5px] ${BOX[variant]} ${SIZE[size]} ${
            variant === 'ghost' && pressed ? 'bg-mist-deep' : ''
          } ${inactive ? 'opacity-[0.45]' : ''}`}
          style={glassRim}
        >
          {loading ? (
            <ActivityIndicator size="small" color={c[SPINNER[variant]]} />
          ) : (
            icon && <Icon name={icon} size={iconSize} className={INK[variant]} />
          )}
          <Text
            numberOfLines={1}
            className={`${variant === 'glass' ? 'font-500' : 'font-600'} tracking-[-0.08px] ${LABEL[size]} ${INK[variant]}`}
          >
            {children}
          </Text>
          {iconEnd && <Icon name={iconEnd} size={iconSize} className={INK[variant]} />}
        </View>
      )}
    </PressableScale>
  );
}
