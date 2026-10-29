import { StyleSheet, View, type ViewProps } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { colors } from '@/theme/tokens';
import { useThemeColors, useThemeMode } from '@/theme/useThemeMode';

type Palette = (typeof colors)['light'];
// One soft blob of haze: an ellipse centred at (x, y) with radii (rx, ry), all as fractions of
// the screen, fading from `color` at `opacity` to transparent. Same numbers as the artifact's CSS.
type Blob = { x: number; y: number; rx: number; ry: number; color: keyof Palette; opacity: number };

const MIST: Blob[] = [
  { x: 0.78, y: 0.22, rx: 0.4, ry: 0.45, color: 'sky', opacity: 0.85 },
  { x: 0.88, y: 0.78, rx: 0.38, ry: 0.5, color: 'skySoft', opacity: 0.95 },
  { x: 0.3, y: 0.55, rx: 0.45, ry: 0.35, color: 'surface', opacity: 0.7 },
  { x: 0.08, y: 0.95, rx: 0.3, ry: 0.3, color: 'sky', opacity: 0.45 },
];
const CHARCOAL: Blob[] = [
  { x: 0.78, y: 0.28, rx: 0.45, ry: 0.5, color: 'atmosDeep', opacity: 0.8 },
  { x: 0.25, y: 0.6, rx: 0.5, ry: 0.45, color: 'charcoal', opacity: 0.9 },
  { x: 0.08, y: 0.96, rx: 0.3, ry: 0.3, color: 'atmos', opacity: 0.45 },
];
const SKY: Blob[] = [
  { x: 0.3, y: 0.3, rx: 0.55, ry: 0.14, color: 'onAtmos', opacity: 0.16 },
  { x: 0.72, y: 0.7, rx: 0.6, ry: 0.12, color: 'onAtmos', opacity: 0.12 },
  { x: 0.05, y: 0, rx: 0.55, ry: 0.55, color: 'atmos', opacity: 0.95 },
  { x: 1, y: 1, rx: 0.5, ry: 0.5, color: 'atmos', opacity: 0.8 },
];

type Props = ViewProps & { tone?: 'mist' | 'charcoal' | 'sky'; className?: string };

/**
 * The haze behind glass. Glass on a flat colour just looks grey, so screens with glass sit on
 * one of these. In the Charcoal theme the mist backdrop uses the charcoal haze, as in the artifact.
 */
export function Backdrop({ tone = 'mist', className = '', children, ...rest }: Props) {
  const c = useThemeColors();
  const { theme } = useThemeMode();
  const dark = tone === 'charcoal' || (tone === 'mist' && theme === 'dark');
  const blobs = tone === 'sky' ? SKY : dark ? CHARCOAL : MIST;
  // The charcoal tone's base is the dark mist value in either theme.
  const base = tone === 'sky' ? c.atmosDeep : tone === 'charcoal' ? colors.dark.mist : c.mist;

  return (
    <View {...rest} className={`flex-1 ${className}`} style={{ backgroundColor: base }}>
      {/* Explicit size: on the web an unsized SVG is 300×150, not the full screen. */}
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
        <Defs>
          {blobs.map((b, i) => (
            <RadialGradient key={i} id={`haze${i}`} cx={b.x} cy={b.y} rx={b.rx} ry={b.ry} fx={b.x} fy={b.y}>
              <Stop offset="0" stopColor={c[b.color]} stopOpacity={b.opacity} />
              <Stop offset="1" stopColor={c[b.color]} stopOpacity={0} />
            </RadialGradient>
          ))}
        </Defs>
        {blobs.map((_, i) => (
          <Rect key={i} width="100%" height="100%" fill={`url(#haze${i})`} />
        ))}
      </Svg>
      {children}
    </View>
  );
}
