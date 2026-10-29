// Loaded at runtime with useFonts while we're on Expo Go. From Phase 6 (dev builds) these move
// into the expo-font config plugin so they're embedded in the binary and there's no load step.
// Keys must match FONT_FILES in scripts/build-tokens.ts: each weight is its own family name.
export const fontAssets = {
  'OpenSauceOne-Regular': require('../../assets/fonts/OpenSauceOne-Regular.ttf'),
  'OpenSauceOne-Medium': require('../../assets/fonts/OpenSauceOne-Medium.ttf'),
  'OpenSauceOne-SemiBold': require('../../assets/fonts/OpenSauceOne-SemiBold.ttf'),
  'OpenSauceOne-Bold': require('../../assets/fonts/OpenSauceOne-Bold.ttf'),
  'OpenSauceOne-ExtraBold': require('../../assets/fonts/OpenSauceOne-ExtraBold.ttf'),
  'OpenSauceOne-Black': require('../../assets/fonts/OpenSauceOne-Black.ttf'),
};
