import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Brand motion: press scales to 0.98 over 150–200 ms; Reduce Motion turns the movement off.
const PRESSED_SCALE = 0.98;
const DURATION_MS = 160;

type Props = Omit<PressableProps, 'style'> & { style?: StyleProp<ViewStyle> };

/**
 * The touch target for every pressable ui/ component. It carries no visuals of its own:
 * components put their styled View inside, so className styling never touches the animated view.
 */
export function PressableScale({ style, onPressIn, onPressOut, disabled, ...rest }: Props) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  // .get()/.set() instead of .value: the React Compiler treats hook return values as immutable,
  // and these accessors are Reanimated's compiler-safe way to read and write a shared value.
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={(e) => {
        if (!reduceMotion) scale.set(withTiming(PRESSED_SCALE, { duration: DURATION_MS }));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.set(withTiming(1, { duration: DURATION_MS }));
        onPressOut?.(e);
      }}
      style={[style, animatedStyle]}
    />
  );
}
