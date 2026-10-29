import { Text } from 'react-native';

/** A system line in a chat ("Jake joined"): small, centred, muted, never a bubble (§9.6). */
export function ChatSystemLine({ text, time }: { text: string; time?: string }) {
  return (
    <Text className="type-caption self-center px-space-4 py-space-1 text-center text-ink-muted">
      {text}
      {time ? ` · ${time}` : ''}
    </Text>
  );
}
