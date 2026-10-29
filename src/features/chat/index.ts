// Chat: a ride's live messages (members only), the preview on the ride page, and the Chats tab.
// Reads/writes the messages table directly (RLS guards it); Realtime streams new rows.
// System lines ("Jake joined") are written by database triggers, never by the app.
export { ChatPreview } from './ChatPreview';
export { ChatScreen } from './ChatScreen';
export { ChatsScreen } from './ChatsScreen';
