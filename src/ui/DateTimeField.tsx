import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Text, View } from 'react-native';

import { useThemeMode } from '@/theme/useThemeMode';

import { Icon } from './Icon';
import { PressableScale } from './PressableScale';

type Props = {
  label: string;
  value: Date;
  onChange: (value: Date) => void;
  mode: 'date' | 'time';
  /** How the value reads in the field, e.g. "Tue 3/18" or "11:00 AM". */
  format: (value: Date) => string;
  /** IANA zone the picker shows. FlyTag passes America/Los_Angeles so it matches the app. */
  timeZoneName?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  error?: string;
};

/**
 * A TextField-looking button that opens the native picker (§8.5). Android shows its system
 * dialog; iOS expands a spinner under the field (tap the field again to close it).
 */
export function DateTimeField({
  label,
  value,
  onChange,
  mode,
  format,
  timeZoneName,
  minimumDate,
  maximumDate,
  error,
}: Props) {
  const { theme } = useThemeMode();
  const [open, setOpen] = useState(false);
  const shown = format(value);

  const onPress = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value,
        mode,
        timeZoneName,
        minimumDate,
        maximumDate,
        is24Hour: false,
        onValueChange: (_e, picked) => onChange(picked),
      });
    } else {
      setOpen((o) => !o);
    }
  };

  const border = error ? 'border-danger' : open ? 'border-sky-deep' : 'border-line-strong';

  return (
    <View className="gap-[6px]">
      <Text className="type-body-sm font-600 text-ink">{label}</Text>
      <PressableScale
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${shown}`}
        accessibilityHint={error ?? `Opens the ${mode} picker`}
        accessibilityState={{ expanded: Platform.OS === 'ios' ? open : undefined }}
      >
        <View
          className={`h-control-md flex-row items-center justify-between rounded-pill border-[1.5px] bg-surface px-space-5 ${border}`}
        >
          <Text className="type-body text-ink">{shown}</Text>
          {mode === 'time' && <Icon name="clock" size={20} className="text-ink-muted" />}
        </View>
      </PressableScale>
      {open && Platform.OS === 'ios' && (
        <DateTimePicker
          value={value}
          mode={mode}
          display="spinner"
          timeZoneName={timeZoneName}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          minuteInterval={5}
          themeVariant={theme}
          onValueChange={(_e, picked) => onChange(picked)}
        />
      )}
      {error && <Text className="pl-space-5 font-400 text-[13px] leading-[16px] text-danger">{error}</Text>}
    </View>
  );
}
