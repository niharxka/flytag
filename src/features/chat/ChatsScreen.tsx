import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatChatTime, formatRideDate, formatRideTime } from '@/lib/dates';
import { errorMessage } from '@/lib/errors';
import { spacing } from '@/theme/tokens';
import { useThemeColors } from '@/theme/useThemeMode';
import { AppHeader, AvatarStack, Backdrop, Button, EmptyState, GlassView, Icon, TAB_BAR_HEIGHT } from '@/ui';

import type { ChatSummary } from './chat.api';
import { useMyChats } from './chat.hooks';
import { previewLine } from './chat.logic';

function ChatRow({ chat }: { chat: ChatSummary }) {
  const when = `${formatRideDate(chat.departAt)} · ${formatRideTime(chat.departAt)}`;
  const preview = previewLine(chat);
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/rides/[rideId]/chat', params: { rideId: chat.rideId } })}
      accessibilityRole="button"
      accessibilityLabel={`Chat for ${when}. ${preview}`}
    >
      <GlassView className="flex-row items-center gap-space-3 rounded-lg p-space-4">
        <Icon
          name={chat.direction === 'to_campus' ? 'plane-land' : 'plane-depart'}
          size={24}
          className="text-ink"
        />
        <View className="min-w-0 flex-1 gap-[2px]">
          <View className="flex-row items-center justify-between gap-space-2">
            <Text className="type-heading flex-1 text-ink" numberOfLines={1}>
              {when}
            </Text>
            {chat.lastAt && (
              <Text className="type-caption text-ink-muted">{formatChatTime(chat.lastAt)}</Text>
            )}
          </View>
          <Text className="type-body-sm text-ink-muted" numberOfLines={1}>
            {preview}
          </Text>
        </View>
        <AvatarStack names={chat.riderNames} size={28} max={3} />
      </GlassView>
    </Pressable>
  );
}

/** Chats tab (§9.7): one row per ride you're in, most recent activity first. */
export function ChatsScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const chats = useMyChats();
  const { refetch } = chats;
  // Fresh every time the tab is opened (new messages may have arrived elsewhere).
  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  return (
    <Backdrop>
      <SafeAreaView className="flex-1" edges={['top']}>
        <AppHeader eyebrow="Your rides" title="Chats" trailing={null} />
        {chats.isPending ? (
          <ActivityIndicator className="mt-space-6" color={c.inkMuted} accessibilityLabel="Loading chats" />
        ) : chats.isError ? (
          <EmptyState
            icon="chat"
            title="Couldn’t load chats"
            body={errorMessage(chats.error)}
            action={
              <Button variant="secondary" onPress={() => chats.refetch()}>
                Try again
              </Button>
            }
          />
        ) : (
          <FlatList
            data={chats.data}
            keyExtractor={(chat) => chat.rideId}
            renderItem={({ item }) => <ChatRow chat={item} />}
            contentContainerClassName="gap-space-3 px-space-4"
            contentContainerStyle={{ paddingBottom: insets.bottom + TAB_BAR_HEIGHT + spacing.space6 }}
            refreshControl={
              <RefreshControl
                refreshing={chats.isRefetching}
                onRefresh={() => void chats.refetch()}
                tintColor={c.inkMuted}
              />
            }
            ListEmptyComponent={
              <EmptyState
                icon="chat"
                title="No chats yet"
                body="Join or post a ride to chat with your co-riders."
                action={
                  <Button variant="sky" icon="search" onPress={() => router.push('/')}>
                    Find a ride
                  </Button>
                }
              />
            }
          />
        )}
      </SafeAreaView>
    </Backdrop>
  );
}
