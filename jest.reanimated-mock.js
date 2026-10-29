// Stand-in for react-native-reanimated in Jest. Reanimated 4 needs its native UI-thread runtime,
// and its shipped mock currently trips over react-native-worklets under jest-expo. ui/ uses only
// the APIs below: animations jump to their end value, Animated.View is a plain View.
const { View } = require('react-native');

const identity = (v) => v;

module.exports = {
  __esModule: true,
  default: { View, createAnimatedComponent: identity },
  useSharedValue: (initial) => {
    let value = initial;
    return { get: () => value, set: (v) => (value = v) };
  },
  useAnimatedStyle: (fn) => fn(),
  useReducedMotion: () => false,
  withTiming: identity,
  withDelay: (_ms, v) => v,
  withSequence: (...steps) => steps[steps.length - 1],
  Easing: { bezier: () => identity, out: identity, quad: identity },
};
