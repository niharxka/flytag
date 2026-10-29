import { useState } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';

import { useThemeColors } from '@/theme/useThemeMode';

type Props = Omit<TextInputProps, 'style' | 'className'> & {
  label: string;
  hint?: string;
  /** Replaces the hint and turns the field danger-red. Always words, never colour alone. */
  error?: string;
  /** "glass" inside glass panels (sign in); "solid" on sheets and plain grounds. */
  variant?: 'solid' | 'glass';
};

export function TextField({ label, hint, error, variant = 'solid', onFocus, onBlur, ...input }: Props) {
  const c = useThemeColors();
  const [focused, setFocused] = useState(false);
  const message = error ?? hint;

  const border = error
    ? 'border-danger'
    : focused
      ? 'border-sky-deep'
      : variant === 'glass'
        ? 'border-glass-edge'
        : 'border-line-strong';
  // The artifact's focus ring: 3 px sky-soft halo, then a 2 px sky-deep line outside it.
  const ring = focused ? { boxShadow: `0 0 0 3px ${c.skySoft}, 0 0 0 5px ${c.skyDeep}` } : undefined;

  return (
    <View className="gap-[6px]">
      <Text className="type-body-sm font-600 text-ink">{label}</Text>
      <TextInput
        {...input}
        accessibilityLabel={label}
        accessibilityHint={message}
        aria-invalid={Boolean(error)}
        placeholderTextColor={c.inkMuted}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        // No line-height here: on iOS it pushes single-line input text off-centre.
        className={`h-control-md rounded-pill border-[1.5px] px-space-5 font-400 text-[16px] text-ink ${border} ${variant === 'glass' ? 'bg-glass' : 'bg-surface'}`}
        style={ring}
      />
      {message && (
        <Text
          className={`pl-space-5 text-[13px] font-400 leading-[16px] ${error ? 'text-danger' : 'text-ink-muted'}`}
        >
          {message}
        </Text>
      )}
    </View>
  );
}
