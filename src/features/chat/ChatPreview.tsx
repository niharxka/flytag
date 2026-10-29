import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { useSession } from '@/features/auth';
import { formatRideTime } from '@/lib/dates';
import { Button, ChatBubble, ChatSystemLine, GlassView } from '@/ui';

import { useMessages, useRideRealtime } from './chat.hooks';
import { toChatItems } from './chat.logic';

const PREVIEW_COUNT = 3;

/**
 * The chat panel on a ride's detail page: the last few messages and "Open chat". It also keeps
 * the detail page live (new messages, people joining or leaving) while it's on screen.
 */
export function ChatPreview({ rideId, isMember }: { rideId: string; isMember: boolean }) {
  const { session } = useSession();
  const messages = useMessages(rideId, isMember);
  useRideRealtime(rideId, isMember);
  // Newest three, shown oldest → newest like the chat itself.
  const recent = toChatItems((messages.data ?? []).slice(0, PREVIEW_COUNT), session?.user.id).reverse();

  return (
    <GlassView className="gap-space-3 rounded-lg p-space-5">
      <Text className="type-label text-ink-muted" accessibilityRole="header">
        Chat
      </Text>
      {!isMember ? (
        <Text className="type-body-sm text-ink-muted">Join to chat with riders.</Text>
      ) : (
        <>
          {recent.length === 0 ? (
            <Text className="type-body-sm text-ink-muted">No messages yet. Say hi and pick a meet spot.</Text>
          ) : (
            <View className="gap-space-2">
              {recent.map((item) =>
                item.type === 'system' ? (
                  <ChatSystemLine key={item.message.id} text={item.message.body} />
                ) : (
                  <ChatBubble
                    key={item.message.id}
                    text={item.message.body}
                    mine={item.mine}
                    author={item.message.authorName ?? undefined}
                    time={formatRideTime(item.message.createdAt)}
                    status={item.message.status}
                  />
                ),
              )}
            </View>
          )}
          <Button
            variant="secondary"
            block
            icon="chat"
            onPress={() => router.push({ pathname: '/rides/[rideId]/chat', params: { rideId } })}
          >
            Open chat
          </Button>
        </>
      )}
    </GlassView>
  );
}
