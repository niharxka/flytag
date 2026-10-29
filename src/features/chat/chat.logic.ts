import type { Message } from './chat.api';

// Messages from the same person this close together read as one burst: one byline, not five.
const GROUP_GAP_MS = 5 * 60 * 1000;

export type ChatItem =
  | { type: 'system'; message: Message }
  | { type: 'text'; message: Message; mine: boolean; showByline: boolean };

/**
 * Decide how each message is drawn. Input is newest first (the order the list is inverted in).
 * A text message shows its byline (name · time) only when it's the last of a run: the next
 * newer message is from someone else, a system line, or more than 5 minutes later.
 */
export function toChatItems(newestFirst: Message[], myId: string | undefined): ChatItem[] {
  return newestFirst.map((m, i) => {
    if (m.kind === 'system') return { type: 'system', message: m };
    const newer = newestFirst[i - 1];
    const endsRun =
      !newer ||
      newer.kind === 'system' ||
      newer.authorId !== m.authorId ||
      Date.parse(newer.createdAt) - Date.parse(m.createdAt) > GROUP_GAP_MS;
    // A failed message always shows its byline, which carries "Tap to retry".
    return {
      type: 'text',
      message: m,
      mine: m.authorId === myId,
      showByline: endsRun || m.status === 'failed',
    };
  });
}

/** One-line preview for the Chats tab: "You: …", "Jake: …", or the system line itself. */
export function previewLine(c: {
  lastBody: string | null;
  lastKind: 'text' | 'system' | null;
  lastAuthorName: string | null;
  lastIsMine: boolean;
}): string {
  if (!c.lastBody) return 'No messages yet';
  if (c.lastKind === 'system') return c.lastBody;
  return `${c.lastIsMine ? 'You' : (c.lastAuthorName ?? 'Former rider')}: ${c.lastBody}`;
}
