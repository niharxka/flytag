import { Text, View } from 'react-native';

import { useShadow } from '@/theme/useThemeMode';

import { AvatarStack } from './AvatarStack';
import { GlassView } from './GlassView';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';
import { SkyGradient } from './SkyGradient';
import { Tag } from './Tag';

type Props = {
  /** Already formatted: "Tue 3/18". */
  date: string;
  /** Already formatted: "11:00 AM". */
  time: string;
  seatsTaken: number;
  seatsMax: number;
  riders?: string[];
  direction?: 'to-airport' | 'to-campus';
  /** The ride you're looking at / in. Spends the sky gradient, so one per list. */
  selected?: boolean;
  highlight?: boolean;
  onPress?: () => void;
};

export function RideCard({
  date,
  time,
  seatsTaken,
  seatsMax,
  riders = [],
  direction = 'to-airport',
  selected,
  highlight,
  onPress,
}: Props) {
  const shadow = useShadow('glass');
  const sky = Boolean(selected || highlight);
  const full = seatsTaken >= seatsMax;
  const ink = sky ? 'text-on-sky' : 'text-ink';
  const seats = `${seatsTaken} of ${seatsMax} seats`;

  const body = (
    <View className="flex-row items-center gap-space-4 py-space-4 pl-space-5 pr-space-4">
      <Icon name={direction === 'to-campus' ? 'plane-land' : 'plane-depart'} size={26} className={ink} />
      <View className="min-w-0 flex-1">
        <Text className={`type-label opacity-80 ${ink}`}>{date}</Text>
        <Text className={`mt-[2px] font-700 text-[22px] leading-[28px] tracking-[-0.33px] ${ink}`}>
          {time}
        </Text>
      </View>
      <View className="items-end gap-space-1">
        {riders.length > 0 && <AvatarStack names={riders} size={28} max={3} />}
        {full ? (
          <Tag tone="go" icon="users" label="Full" />
        ) : (
          <Text className={`font-400 text-[13px] leading-[16px] ${ink}`}>{seats}</Text>
        )}
      </View>
      <View className="opacity-70">
        <Icon name="chevron-right" size={20} className={ink} />
      </View>
    </View>
  );

  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${date}, ${time}, ${full ? 'full' : `${seatsTaken} of ${seatsMax} seats taken`}`}
      accessibilityState={{ selected: Boolean(selected) }}
    >
      {sky ? (
        <View className="overflow-hidden rounded-lg border border-glass-edge" style={shadow}>
          <SkyGradient glowAt={0.9} />
          {body}
        </View>
      ) : (
        <GlassView className="rounded-lg">{body}</GlassView>
      )}
    </PressableScale>
  );
}
