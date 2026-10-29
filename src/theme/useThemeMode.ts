import { useColorScheme } from 'nativewind';

import { colors, shadows, type ThemeName } from './tokens';

type ShadowName = keyof typeof shadows;

/**
 * Current theme (Mist = light, Charcoal = dark) and a way to change it.
 * Follows the phone's setting until the user picks one. Setting it calls RN's
 * Appearance.setColorScheme, which flips the CSS variables in global.css, so every
 * token class re-colours without components re-rendering by hand.
 * Not persisted yet: the theme switch in Profile (Phase 7) will store the choice.
 */
export function useThemeMode() {
  const { colorScheme, setColorScheme, toggleColorScheme } = useColorScheme();
  const theme: ThemeName = colorScheme === 'dark' ? 'dark' : 'light';
  return { theme, setTheme: setColorScheme, toggleTheme: toggleColorScheme };
}

/** Token colours as JS values for the current theme: for SVG fills, gradients, placeholder colours. */
export function useThemeColors() {
  return colors[useThemeMode().theme];
}

/** A shadow token as a style, for the current theme. React Native draws CSS box-shadow strings. */
export function useShadow(name: ShadowName) {
  return { boxShadow: shadows[name][useThemeMode().theme] };
}
