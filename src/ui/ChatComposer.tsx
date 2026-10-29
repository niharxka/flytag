import { useState } from 'react';
import { TextInput } from 'react-native';

import { useThemeColors } from '@/theme/useThemeMode';

import { GlassView } from './GlassView';
import { IconButton } from './IconButton';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  placeholder?: string;
};

/** Glass pill with a text input and a send button. Send is disabled until there's text. */
export function ChatComposer({ value, onChangeText, onSend, placeholder = 'Message the ride' }: Props) {
  const c = useThemeColors();
  const [focused, setFocused] = useState(false);
  const empty = value.trim() === '';

  return (
    <GlassView
      className="flex-row items-center gap-space-2 rounded-pill py-[6px] pl-space-5 pr-[6px]"
      shadow={false}
      // The artifact's focus-within ring: 2 px focus colour around the whole pill.
      style={focused ? { borderColor: c.focus, borderWidth: 2 } : undefined}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={() => !empty && onSend()}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        placeholderTextColor={c.inkMuted}
        accessibilityLabel={placeholder}
        returnKeyType="send"
        className="min-h-control-sm flex-1 font-400 text-[16px] text-ink"
      />
      <IconButton icon="send" label="Send" variant="charcoal" size="sm" disabled={empty} onPress={onSend} />
    </GlassView>
  );
}
