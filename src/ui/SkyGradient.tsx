import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';

import { useThemeColors } from '@/theme/useThemeMode';

// CSS `linear-gradient(115deg, …)` as start/end points in a unit box: 115° points right and a
// little down, so the line runs from (0.05, 0.29) to (0.95, 0.71).
const START = { x: 0.05, y: 0.29 };
const END = { x: 0.95, y: 0.71 };

type Props = {
  /** Where sky-glow is reached, as a fraction: RideCard 0.9, ContentCard 0.85 (from the artifact). */
  glowAt?: number;
};

/** The sky → sky-glow fill behind highlighted cards. Sits absolutely inside a clipped parent. */
export function SkyGradient({ glowAt = 0.9 }: Props) {
  const c = useThemeColors();
  return (
    <LinearGradient
      colors={[c.sky, c.skyGlow]}
      locations={[0, glowAt]}
      start={START}
      end={END}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    />
  );
}
