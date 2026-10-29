import { useEffect } from 'react';
import { useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, G, Path } from 'react-native-svg';

import { useThemeColors } from '@/theme/useThemeMode';

type Props = {
  width?: number;
  /** "glide": fly in once from the right on mount (Welcome screen). */
  animate?: 'none' | 'glide';
  delay?: number;
  /** Pass "" when the plane is decoration next to the wordmark. */
  label?: string;
};

// The straight glide from the artifact: 2.2 s, cubic-bezier(.16,.84,.3,1), overshooting to
// -6 px at 75% and settling at rest. Once, never looping.
const GLIDE_MS = 2200;
const OVERSHOOT_PX = -6;
const ease = Easing.bezier(0.16, 0.84, 0.3, 1);
const PORTHOLES = [112, 138, 164, 190, 216, 242];

/** The FlyTag plane, side view, nose left. The only place flare (red) is allowed. */
export function Plane({ width = 240, animate = 'none', delay = 0, label = 'FlyTag airplane' }: Props) {
  const c = useThemeColors();
  const screen = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const glide = animate === 'glide' && !reduceMotion;
  const x = useSharedValue(glide ? screen.width : 0);

  useEffect(() => {
    if (!glide) return;
    x.set(
      withDelay(
        delay,
        withSequence(
          withTiming(OVERSHOOT_PX, { duration: GLIDE_MS * 0.75, easing: ease }),
          withTiming(0, { duration: GLIDE_MS * 0.25, easing: Easing.out(Easing.quad) }),
        ),
      ),
    );
  }, [glide, delay, x]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));
  const decorative = label === '';

  return (
    <Animated.View
      style={style}
      accessible={!decorative}
      accessibilityRole={decorative ? undefined : 'image'}
      accessibilityLabel={decorative ? undefined : label}
      importantForAccessibility={decorative ? 'no-hide-descendants' : 'yes'}
    >
      <Svg width={width} height={Math.round((width * 146) / 340)} viewBox="30 14 340 146">
        <Path d="M152 78L192 50H208L198 78Z" fill={c.atmos} />
        <Path d="M324 78L342 64H352L344 78Z" fill={c.flareDeep} />
        <Path d="M300 78L336 22C340 16 352 16 352 26L346 78Z" fill={c.flare} />
        <Path d="M344 24C347 18 352 20 352 26L346 78H339Z" fill={c.flareDeep} />
        <Path
          d="M40 100C40 86 56 78 80 78H332L362 72C368 71 369 79 364 84L340 110C334 116 326 118 318 118H80C56 118 40 112 40 100Z"
          fill={c.onCharcoal}
        />
        <Path d="M41 105H346L340 110C334 116 326 118 318 118H80C60 118 46 114 41 105Z" fill={c.planeShade} />
        <Path d="M58 99H344L339 104H50C52 101 55 99 58 99Z" fill={c.flare} />
        <Path d="M50 94C54 86 64 82 76 82L74 94Z" fill={c.sky} />
        <G fill={c.atmosDeep}>
          {PORTHOLES.map((cx) => (
            <Circle key={cx} cx={cx} cy={90} r={4} />
          ))}
        </G>
        <Path d="M140 106L216 152H238L208 106Z" fill={c.sky} />
        <Path d="M216 152H238L234 146H212Z" fill={c.atmos} />
        <Path d="M316 106L348 128H362L346 104Z" fill={c.flare} />
        <Path d="M348 128H362L360 124H343Z" fill={c.flareDeep} />
      </Svg>
    </Animated.View>
  );
}
