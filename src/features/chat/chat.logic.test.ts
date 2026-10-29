import type { Message } from './chat.api';
import { previewLine, toChatItems } from './chat.logic';

const msg = (id: string, authorId: string | null, at: string, kind: 'text' | 'system' = 'text'): Message => ({
  id,
  rideId: 'r',
  authorId,
  authorName: null,
  kind,
  body: id,
  createdAt: at,
});

describe('toChatItems', () => {
  it('groups a burst from one person under one byline (on the newest)', () => {
    // newest first
    const items = toChatItems(
      [
        msg('c', 'jake', '2026-03-18T18:03:00Z'),
        msg('b', 'jake', '2026-03-18T18:02:00Z'),
        msg('a', 'me', '2026-03-18T18:01:00Z'),
      ],
      'me',
    );
    expect(items.map((i) => (i.type === 'text' ? [i.message.id, i.mine, i.showByline] : i.type))).toEqual([
      ['c', false, true],
      ['b', false, false],
      ['a', true, true],
    ]);
  });
  it('starts a new byline after a 5-minute gap or a system line', () => {
    const items = toChatItems(
      [
        msg('d', 'jake', '2026-03-18T18:20:00Z'),
        msg('c', 'jake', '2026-03-18T18:10:00Z'),
        msg('s', null, '2026-03-18T18:09:00Z', 'system'),
        msg('b', 'jake', '2026-03-18T18:08:00Z'),
      ],
      'me',
    );
    expect(items.map((i) => (i.type === 'text' ? i.showByline : 'system'))).toEqual([
      true,
      true,
      'system',
      true,
    ]);
  });
  it('always shows the byline of a failed message (it holds "Tap to retry")', () => {
    const failed = { ...msg('b', 'me', '2026-03-18T18:01:00Z'), status: 'failed' as const };
    const items = toChatItems([msg('c', 'me', '2026-03-18T18:02:00Z'), failed], 'me');
    expect(items[1].type === 'text' && items[1].showByline).toBe(true);
  });
});

describe('previewLine', () => {
  it('prefixes who said it', () => {
    expect(previewLine({ lastBody: 'hi', lastKind: 'text', lastAuthorName: 'Jake', lastIsMine: false })).toBe(
      'Jake: hi',
    );
    expect(previewLine({ lastBody: 'hi', lastKind: 'text', lastAuthorName: 'Me', lastIsMine: true })).toBe(
      'You: hi',
    );
    expect(previewLine({ lastBody: 'hi', lastKind: 'text', lastAuthorName: null, lastIsMine: false })).toBe(
      'Former rider: hi',
    );
  });
  it('shows system lines as they are, and an empty chat', () => {
    expect(
      previewLine({ lastBody: 'Jake joined', lastKind: 'system', lastAuthorName: null, lastIsMine: false }),
    ).toBe('Jake joined');
    expect(previewLine({ lastBody: null, lastKind: null, lastAuthorName: null, lastIsMine: false })).toBe(
      'No messages yet',
    );
  });
});
