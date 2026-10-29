import Svg, { Circle, Path } from 'react-native-svg';

import { icons, type IconName } from './icons.generated';
import './interop';

export type { IconName };

type Props = {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  /** Colour comes from a text-* class, e.g. "text-ink". */
  className?: string;
  /** Only for icons that stand alone and mean something; icons beside words stay decorative. */
  label?: string;
};

/** FlyTag icon set: 24 grid, 1.75 stroke, round caps and joins, drawn in the current text colour. */
export function Icon({ name, size = 20, strokeWidth = 1.75, className, label }: Props) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      accessible={Boolean(label)}
      accessibilityLabel={label}
      accessibilityRole={label ? 'image' : undefined}
      importantForAccessibility={label ? 'yes' : 'no-hide-descendants'}
    >
      {icons[name].map((s, i) =>
        s.type === 'path' ? <Path key={i} d={s.d} /> : <Circle key={i} cx={s.cx} cy={s.cy} r={s.r} />,
      )}
    </Svg>
  );
}
