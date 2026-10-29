import { Text, View } from 'react-native';

type Props = {
  text: string;
  author?: string;
  /** Already formatted: "8:23 AM". */
  time?: string;
  /** Your own messages: sky, right-aligned, byline says "You". */
  mine?: boolean;
};

/** One message. The corner nearest the sender is tightened to 8 px, like a speech tail. */
export function ChatBubble({ text, author, time, mine = false }: Props) {
  const byline = [mine ? 'You' : author, time].filter(Boolean).join(' · ');
  return (
    <View className={`max-w-[78%] gap-space-1 ${mine ? 'items-end self-end' : 'items-start self-start'}`}>
      <View
        className={`rounded-lg px-space-4 py-space-3 ${mine ? 'rounded-br-[8px] bg-sky' : 'rounded-bl-[8px] bg-surface'}`}
      >
        <Text className={`type-body ${mine ? 'text-on-sky' : 'text-ink'}`}>{text}</Text>
      </View>
      {byline !== '' && <Text className="type-caption px-space-2 text-ink-muted">{byline}</Text>}
    </View>
  );
}
