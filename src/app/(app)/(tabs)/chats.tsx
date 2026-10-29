import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader, Backdrop, EmptyState } from '@/ui';

// Placeholder until its feature lands (see docs/spec/09-roadmap.md).
export default function ChatsTab() {
  return (
    <Backdrop>
      <SafeAreaView className="flex-1" edges={['top']}>
        <AppHeader eyebrow="Your rides" title="Chats" trailing={null} />
        <EmptyState
          icon="chat"
          title="No chats yet"
          body="Join or post a ride to chat with your co-riders."
        />
      </SafeAreaView>
    </Backdrop>
  );
}
