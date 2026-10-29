import { Pressable, Text, View } from 'react-native';

type Props = {
  text: string;
  author?: string;
  /** Already formatted: "8:23 AM". */
  time?: string;
  /** Your own messages: sky, right-aligned, byline says "You". */
  mine?: boolean;
  /** Hide the "name · time" line, for messages in the middle of a burst from one person. */
  showByline?: boolean;
  /** Your message on its way ("Sending…", faded) or refused ("Not sent · Tap to retry"). */
  status?: 'sending' | 'failed';
  onRetry?: () => void;
};

/** One message. The corner nearest the sender is tightened to 8 px, like a speech tail. */
export function ChatBubble({ text, author, time, mine = false, showByline = true, status, onRetry }: Props) {
  const who = mine ? 'You' : author;
  const byline =
    status === 'sending'
      ? 'Sending…'
      : status === 'failed'
        ? 'Not sent · Tap to retry'
        : [who, time].filter(Boolean).join(' · ');
  const bubble = (
    <View
      className={`rounded-lg px-space-4 py-space-3 ${mine ? 'rounded-br-[8px] bg-sky' : 'rounded-bl-[8px] bg-surface'} ${
        status === 'sending' ? 'opacity-60' : ''
      }`}
    >
      <Text className={`type-body ${mine ? 'text-on-sky' : 'text-ink'}`}>{text}</Text>
    </View>
  );

  return (
    <View
      className={`max-w-[78%] gap-space-1 ${mine ? 'items-end self-end' : 'items-start self-start'}`}
      // Read as one sentence: "Jake, 8:23 AM: Meet at Sixth market?"
      accessible={status !== 'failed'}
      accessibilityLabel={`${who ?? 'Former rider'}${time ? `, ${time}` : ''}: ${text}${status === 'sending' ? ', sending' : ''}`}
    >
      {status === 'failed' ? (
        <Pressable
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel={`Not sent: ${text}`}
          accessibilityHint="Tap to send it again"
          className="items-end gap-space-1"
        >
          {bubble}
          <Text className="type-caption px-space-2 text-danger">{byline}</Text>
        </Pressable>
      ) : (
        <>
          {bubble}
          {showByline && byline !== '' && (
            <Text className="type-caption px-space-2 text-ink-muted">{byline}</Text>
          )}
        </>
      )}
    </View>
  );
}
