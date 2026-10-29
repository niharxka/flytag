import { useColorScheme } from 'nativewind';
import { useEffect } from 'react';

import { useThemePref, type ThemePref } from './themePref.store';
import { colors, shadows, type ThemeName } from './tokens';

type ShadowName = keyof typeof shadows;

const SCHEME: Record<ThemePref, 'system' | 'light' | 'dark'> = {
  system: 'system',
  mist: 'light',
  charcoal: 'dark',
};

/**
 * Current theme (Mist = light, Charcoal = dark), the saved preference, and ways to change it.
 * `theme` is what's on screen; `pref` can also be 'system', meaning "follow the phone".
 * Changing the preference only writes the store; useApplyThemePref turns it into colours.
 */
export function useThemeMode() {
  const { colorScheme } = useColorScheme();
  const { pref, setPref } = useThemePref();
  const theme: ThemeName = colorScheme === 'dark' ? 'dark' : 'light';
  const setTheme = (t: ThemeName) => setPref(t === 'dark' ? 'charcoal' : 'mist');
  // Flip what's on screen, even when the pref is 'system': tapping should always visibly change.
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');
  return { theme, pref, setPref, setTheme, toggleTheme };
}

/**
 * Call once, in the root layout. Pushes the saved preference into NativeWind, which calls
 * RN's Appearance.setColorScheme and flips the CSS variables in global.css, so every token
 * class re-colours. Runs again after AsyncStorage rehydrates the store on launch.
 */
export function useApplyThemePref() {
  const { setColorScheme } = useColorScheme();
  const pref = useThemePref((s) => s.pref);
  useEffect(() => {
    setColorScheme(SCHEME[pref]);
  }, [pref, setColorScheme]);
}

/** Token colours as JS values for the current theme: for SVG fills, gradients, placeholder colours. */
export function useThemeColors() {
  return colors[useThemeMode().theme];
}

/** A shadow token as a style, for the current theme. React Native draws CSS box-shadow strings. */
export function useShadow(name: ShadowName) {
  return { boxShadow: shadows[name][useThemeMode().theme] };
}
