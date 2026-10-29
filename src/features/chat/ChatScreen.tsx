import * as Crypto from 'expo-crypto';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSession } from '@/features/auth';
import { useRide, useRideMembers } from '@/features/rides';
import { formatRideDate, formatRideTime } from '@/lib/dates';
import { errorMessage } from '@/lib/errors';
import { useThemeColors } from '@/theme/useThemeMode';
import { AppHeader, Backdrop, Button, ChatBubble, ChatComposer, ChatSystemLine, EmptyState, Tag } from '@/ui';

import { useMessages, useRideRealtime, useSendMessage } from './chat.hooks';
import { toChatItems } from './chat.logic';
import { messageBodySchema } from './chat.schemas';

/** A ride's chat (§9.6): live, newest at the bottom, meet spot pinned on top. Members only. */
export function ChatScreen({ rideId }: { rideId: string }) {
  const c = useThemeColors();
  const { session } = useSession();
  const myId = session?.user.id;
  const ride = useRide(rideId);
  const isMember = ride.data?.isMember ?? false;
  const members = useRideMembers(rideId);
  const messages = useMessages(rideId, isMember);
  const send = useSendMessage(rideId, myId);
  const [draft, setDraft] = useState('');
  useRideRealtime(rideId, isMember);

  // Live messages arrive without a name; current riders' names fill it in.
  const names = useMemo(
    () => new Map((members.data ?? []).map((m) => [m.userId, m.displayName])),
    [members.data],
  );
  const items = useMemo(() => toChatItems(messages.data ?? [], myId), [messages.data, myId]);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const onSend = () => {
    const body = messageBodySchema.safeParse(draft);
    if (!body.success) return;
    send.mutate({ id: Crypto.randomUUID(), body: body.data });
    setDraft('');
  };

  const r = ride.data;
  const eyebrow = r ? `${formatRideDate(r.departAt)} · ${formatRideTime(r.departAt)}` : undefined;

  return (
    <Backdrop>
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <AppHeader eyebrow={eyebrow} title="Chat" onBack={back} trailing={null} />
        {r?.meetSpot && (
          <View className="px-space-4 pb-space-2">
            <Tag tone="glass" icon="pin" label={`Meet at ${r.meetSpot}`} />
          </View>
        )}

        {ride.isPending ? (
          <ActivityIndicator color={c.inkMuted} accessibilityLabel="Loading chat" />
        ) : !isMember ? (
          <EmptyState
            icon="chat"
            title="Join to chat with riders"
            body="Only people in this ride can see its chat."
            action={
              <Button variant="secondary" onPress={back}>
                Back to the ride
              </Button>
            }
          />
        ) : (
          // Full-screen route, so the standard keyboard avoider measures correctly here.
          <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <FlatList
              // Inverted: index 0 (the newest) sits at the bottom, and "end reached" means the top.
              inverted
              data={items}
              keyExtractor={(item) => item.message.id}
              contentContainerClassName="gap-space-2 px-space-4 py-space-3"
              keyboardDismissMode="interactive"
              keyboardShouldPersistTaps="handled"
              onEndReached={() => {
                if (messages.hasNextPage && !messages.isFetchingNextPage) void messages.fetchNextPage();
              }}
              onEndReachedThreshold={0.3}
              ListFooterComponent={
                messages.isFetchingNextPage || messages.isPending ? (
                  <ActivityIndicator className="py-space-3" color={c.inkMuted} />
                ) : undefined
              }
              ListEmptyComponent={
                messages.isError ? (
                  <EmptyState
                    icon="chat"
                    title="Couldn’t load messages"
                    body={errorMessage(messages.error)}
                  />
                ) : undefined
              }
              renderItem={({ item }) =>
                item.type === 'system' ? (
                  <ChatSystemLine text={item.message.body} />
                ) : (
                  <ChatBubble
                    text={item.message.body}
                    mine={item.mine}
                    author={
                      item.message.authorName ?? names.get(item.message.authorId ?? '') ?? 'Former rider'
                    }
                    time={formatRideTime(item.message.createdAt)}
                    showByline={item.showByline}
                    status={item.message.status}
                    onRetry={() => send.mutate({ id: item.message.id, body: item.message.body })}
                  />
                )
              }
            />
            {send.error && (
              <View className="px-space-4">
                <Tag tone="outline" label={errorMessage(send.error)} />
              </View>
            )}
            <View className="px-space-4 pb-space-2 pt-space-1">
              <ChatComposer value={draft} onChangeText={setDraft} onSend={onSend} />
            </View>
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>
    </Backdrop>
  );
}
