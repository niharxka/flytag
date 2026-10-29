import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import { Text, View } from 'react-native';

import { useThemeColors, useThemeMode } from '@/theme/useThemeMode';

// Web version of DateTimeField (Metro picks *.web.tsx for the browser build). The native picker
// has no web support, so this uses the browser's own <input type="date|time">, which shows
// a proper picker on phones and laptops alike. Same props and contract as the native file.

type Props = {
  label: string;
  value: Date;
  onChange: (value: Date) => void;
  mode: 'date' | 'time';
  format: (value: Date) => string;
  timeZoneName?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  error?: string;
};

const LOCAL_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

export function DateTimeField({ label, value, onChange, mode, timeZoneName, minimumDate, maximumDate, error }: Props) {
  const c = useThemeColors();
  const { theme } = useThemeMode();
  const tz = timeZoneName ?? LOCAL_TZ;
  // The input speaks wall-clock strings ("2026-03-18", "11:00") in the ride's time zone.
  const pattern = mode === 'date' ? 'yyyy-MM-dd' : 'HH:mm';
  const toInput = (d: Date) => formatInTimeZone(d, tz, pattern);

  const handle = (raw: string) => {
    if (!raw) return;
    // Hand back an instant whose wall-clock day (or time) in `tz` is what was picked. Noon for
    // dates, so no time zone shift can roll it into another day.
    const day = mode === 'date' ? raw : formatInTimeZone(value, tz, 'yyyy-MM-dd');
    const time = mode === 'date' ? '12:00' : raw;
    onChange(fromZonedTime(`${day}T${time}:00`, tz));
  };

  return (
    <View className="gap-[6px]">
      <Text className="type-body-sm font-600 text-ink">{label}</Text>
      <input
        type={mode}
        aria-label={label}
        aria-invalid={Boolean(error)}
        value={toInput(value)}
        min={mode === 'date' && minimumDate ? toInput(minimumDate) : undefined}
        max={mode === 'date' && maximumDate ? toInput(maximumDate) : undefined}
        step={mode === 'time' ? 300 : undefined}
        onChange={(e) => handle(e.target.value)}
        style={{
          height: 48,
          borderRadius: 999,
          border: `1.5px solid ${error ? c.danger : c.lineStrong}`,
          padding: '0 24px',
          background: c.surface,
          color: c.ink,
          fontFamily: 'OpenSauceOne-Regular',
          fontSize: 16,
          // The browser's picker popup follows the app's theme, not the computer's.
          colorScheme: theme,
        }}
      />
      {error && <Text className="pl-space-5 font-400 text-[13px] leading-[16px] text-danger">{error}</Text>}
    </View>
  );
}
