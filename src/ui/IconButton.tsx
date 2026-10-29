import { View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { Icon, type IconName } from './Icon';
import { PressableScale } from './PressableScale';

type Variant = 'white' | 'charcoal' | 'sky' | 'glass' | 'muted';

const BOX: Record<Variant, string> = {
  white: 'bg-surface border-transparent',
  charcoal: 'bg-inverse border-transparent',
  sky: 'bg-sky border-transparent',
  glass: 'bg-glass border-glass-edge',
  muted: 'bg-mist-deep border-transparent',
};
const INK: Record<Variant, string> = {
  white: 'text-sky-deep',
  charcoal: 'text-on-inverse',
  sky: 'text-on-sky',
  glass: 'text-ink',
  muted: 'text-ink-muted',
};
const SM_SLOP = { top: 6, bottom: 6, left: 6, right: 6 };

type Props = Omit<PressableProps, 'children' | 'style'> & {
  icon: IconName;
  /** Required: a standalone icon means nothing to a screen reader without it. */
  label: string;
  variant?: Variant;
  /** sm (36) only inside a row that's at least 48 tall. */
  size?: 'sm' | 'md';
  /** On the sky backdrop the white circle stays white in both themes, with an atmos-deep icon. */
  onSky?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Round icon-only button. */
export function IconButton({
  icon,
  label,
  variant = 'white',
  size = 'md',
  onSky = false,
  disabled,
  style,
  ...rest
}: Props) {
  const skyWhite = onSky && variant === 'white';
  const box = skyWhite ? 'bg-on-atmos border-transparent' : BOX[variant];
  const ink = skyWhite ? 'text-atmos-deep' : INK[variant];
  const dims = size === 'sm' ? 'h-control-sm w-control-sm' : 'h-control-md w-control-md';

  return (
    <PressableScale
      {...rest}
      disabled={disabled}
      hitSlop={size === 'sm' ? SM_SLOP : undefined}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(disabled) }}
      style={style}
    >
      <View
        className={`items-center justify-center rounded-pill border ${dims} ${box} ${disabled ? 'opacity-[0.45]' : ''}`}
      >
        <Icon name={icon} size={size === 'sm' ? 18 : 22} strokeWidth={2} className={ink} />
      </View>
    </PressableScale>
  );
}
