import { useRef, useState, type ComponentRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

type Props = {
  value: string;
  onChangeText: (digits: string) => void;
  length?: number;
  label?: string;
  error?: string;
  autoFocus?: boolean;
  editable?: boolean;
};

/**
 * One-time-code entry shown as boxes. Under the boxes is a single invisible TextInput, so paste,
 * the iOS "From Messages/Mail" suggestion and Android autofill all work natively, and a screen
 * reader hears one field ("6-digit code") instead of six.
 */
export function CodeField({
  value,
  onChangeText,
  length = 6,
  label = `${length}-digit code`,
  error,
  autoFocus,
  editable = true,
}: Props) {
  const input = useRef<ComponentRef<typeof TextInput>>(null);
  const [focused, setFocused] = useState(false);
  const active = Math.min(value.length, length - 1);

  return (
    <View className="gap-[6px]">
      <Pressable onPress={() => input.current?.focus()} accessible={false} importantForAccessibility="no">
        <View className="flex-row justify-between" importantForAccessibility="no-hide-descendants">
          {Array.from({ length }, (_, i) => {
            const border = error
              ? 'border-danger'
              : focused && i === active
                ? 'border-sky-deep border-2'
                : 'border-line-strong border-[1.5px]';
            return (
              <View
                key={i}
                className={`h-control-lg w-[48px] items-center justify-center rounded-md bg-surface ${border}`}
              >
                <Text className="font-700 text-[24px] leading-[28px] text-ink">{value[i] ?? ''}</Text>
              </View>
            );
          })}
        </View>
        <TextInput
          ref={input}
          value={value}
          onChangeText={(t) => onChangeText(t.replace(/\D/g, '').slice(0, length))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          maxLength={length}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          autoFocus={autoFocus}
          editable={editable}
          caretHidden
          accessibilityLabel={label}
          accessibilityHint={error}
          style={[StyleSheet.absoluteFill, { opacity: 0 }]}
        />
      </Pressable>
      {error && <Text className="font-400 text-[13px] leading-[16px] text-danger">{error}</Text>}
    </View>
  );
}
