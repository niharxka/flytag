// See jest.reanimated-mock.js for why Reanimated is replaced in tests. package.json also maps
// `react-native-reanimated/mock` to the same file, because expo-router/testing-library mocks
// Reanimated with that path and would otherwise override this.
jest.mock('react-native-reanimated', () => require('./jest.reanimated-mock'));

// AsyncStorage is a native module, absent under Jest. The theme preference store imports it, and
// every ui/ component reaches that store through useThemeMode, so use the library's in-memory mock.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
