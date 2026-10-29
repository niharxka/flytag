import { Text, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { useShadow } from '@/theme/useThemeMode';

import { Icon, type IconName } from './Icon';
import { PressableScale } from './PressableScale';

type Props = Omit<PressableProps, 'children' | 'style'> & {
  /** Read aloud when round, shown when extended: "Post a ride". */
  label: string;
  icon?: IconName;
  extended?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Floating action: the screen's main create action, lifted above the content. */
export function Fab({ label, icon = 'plus', extended = false, style, ...rest }: Props) {
  const lift = useShadow('lift');

  return (
    <PressableScale {...rest} accessibilityRole="button" accessibilityLabel={label} style={style}>
      <View
        className={`h-control-lg min-w-control-lg flex-row items-center justify-center gap-space-2 rounded-pill bg-inverse ${
          extended ? 'px-space-4' : 'w-control-lg'
        }`}
        style={lift}
      >
        <Icon name={icon} size={26} strokeWidth={2} className="text-on-inverse" />
        {extended && <Text className="font-600 text-[16px] leading-[24px] text-on-inverse">{label}</Text>}
      </View>
    </PressableScale>
  );
}
