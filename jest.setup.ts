// Reanimated 4 needs its native UI-thread runtime, which Jest doesn't have, and its shipped
// mock currently trips over react-native-worklets under jest-expo. ui/ uses only the APIs
// below, so we stand them in directly: animations jump to their end value, Animated.View is a View.
jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  const identity = <T>(v: T) => v;
  return {
    __esModule: true,
    default: { View, createAnimatedComponent: identity },
    useSharedValue: (initial: unknown) => {
      let value = initial;
      return { get: () => value, set: (v: unknown) => (value = v) };
    },
    useAnimatedStyle: (fn: () => object) => fn(),
    useReducedMotion: () => false,
    withTiming: identity,
    withDelay: (_ms: number, v: unknown) => v,
    withSequence: (...steps: unknown[]) => steps[steps.length - 1],
    Easing: { bezier: () => identity, out: identity, quad: identity },
  };
});
