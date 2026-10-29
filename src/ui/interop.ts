import { cssInterop } from 'nativewind';
import Svg from 'react-native-svg';

// NativeWind only wires className into React Native's own components. Registering Svg lets
// `<Icon className="text-sky-deep" />` work: the text colour becomes Svg's `color` prop, which
// the icon paths read through stroke="currentColor". Imported for its side effect by Icon.tsx.
cssInterop(Svg, { className: { target: 'style', nativeStyleToProp: { color: true } } });

declare module 'react-native-svg' {
  interface SvgProps {
    className?: string;
  }
}
