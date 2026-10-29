// See jest.reanimated-mock.js for why Reanimated is replaced in tests. package.json also maps
// `react-native-reanimated/mock` to the same file, because expo-router/testing-library mocks
// Reanimated with that path and would otherwise override this.
jest.mock('react-native-reanimated', () => require('./jest.reanimated-mock'));
