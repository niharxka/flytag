import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { AppState } from 'react-native';

import {
  chatKeys,
  listMessages,
  listMyChats,
  MESSAGES_PAGE_SIZE,
  sendMessage,
  subscribeToRide,
  type Message,
  type MessageCursor,
} from './chat.api';

type Pages = InfiniteData<Message[], MessageCursor | null>;

/** A ride's chat, newest first, 50 at a time; scrolling up loads older pages. Members only. */
export function useMessages(rideId: string, enabled = true) {
  return useInfiniteQuery({
    queryKey: chatKeys.messages(rideId),
    queryFn: ({ pageParam }) => listMessages(rideId, pageParam),
    initialPageParam: null as MessageCursor | null,
    getNextPageParam: (last) =>
      last.length < MESSAGES_PAGE_SIZE
        ? undefined
        : { createdAt: last[last.length - 1].createdAt, id: last[last.length - 1].id },
    select: (data) => data.pages.flat(),
    enabled,
  });
}

/** Rides I'm in with their latest message (Chats tab). */
export function useMyChats() {
  return useQuery({ queryKey: chatKeys.myChats(), queryFn: listMyChats });
}

// Put a message at the top of the newest page, or update it in place if it's already there
// (the live echo of a message we sent, or a retry).
function upsertNewest(data: Pages | undefined, m: Message): Pages | undefined {
  if (!data) return data;
  const exists = data.pages.some((p) => p.some((x) => x.id === m.id));
  const pages = exists
    ? data.pages.map((p) =>
        p.map((x) => (x.id === m.id ? { ...x, ...m, authorName: m.authorName ?? x.authorName } : x)),
      )
    : [[m, ...(data.pages[0] ?? [])], ...data.pages.slice(1)];
  return { ...data, pages };
}

/**
 * Send, optimistically (§8.2): the bubble appears at once as "Sending…", then settles when the
 * server accepts it, or turns into "Not sent · Tap to retry". Retrying reuses the same id, so
 * a message that did arrive can never be posted twice.
 */
export function useSendMessage(rideId: string, myId: string | undefined) {
  const queryClient = useQueryClient();
  const key = chatKeys.messages(rideId);
  const setStatus = (id: string, status: Message['status']) =>
    queryClient.setQueryData<Pages>(
      key,
      (d) => d && { ...d, pages: d.pages.map((p) => p.map((x) => (x.id === id ? { ...x, status } : x))) },
    );

  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) => sendMessage(id, rideId, body),
    onMutate: async ({ id, body }) => {
      await queryClient.cancelQueries({ queryKey: key });
      queryClient.setQueryData<Pages>(key, (d) =>
        upsertNewest(d, {
          id,
          rideId,
          authorId: myId ?? null,
          authorName: null,
          kind: 'text',
          body,
          createdAt: new Date().toISOString(),
          status: 'sending',
        }),
      );
    },
    onSuccess: (_r, { id }) => {
      setStatus(id, undefined);
      void queryClient.invalidateQueries({ queryKey: chatKeys.myChats() });
    },
    onError: (_e, { id }) => setStatus(id, 'failed'),
  });
}

/**
 * Live updates for one ride while its screen is focused (§8.3). New messages go straight into
 * the cache; joins and leaves refresh the ride and its riders. Leaving the screen stops the
 * subscription; coming back to the app refetches, because Realtime can miss events while the
 * app is in the background.
 */
export function useRideRealtime(rideId: string, enabled: boolean) {
  const queryClient = useQueryClient();
  useFocusEffect(
    useCallback(() => {
      if (!enabled) return;
      const refreshRide = () => {
        // Ride queries live in features/rides; their keys all start with 'rides'.
        void queryClient.invalidateQueries({ queryKey: ['rides'] });
        void queryClient.invalidateQueries({ queryKey: chatKeys.myChats() });
      };
      const stop = subscribeToRide(rideId, {
        onMessage: (m) => {
          queryClient.setQueryData<Pages>(chatKeys.messages(rideId), (d) => upsertNewest(d, m));
          void queryClient.invalidateQueries({ queryKey: chatKeys.myChats() });
        },
        onMembersChanged: refreshRide,
        onConnected: () => void queryClient.invalidateQueries({ queryKey: chatKeys.messages(rideId) }),
      });
      const sub = AppState.addEventListener('change', (state) => {
        if (state !== 'active') return;
        void queryClient.invalidateQueries({ queryKey: chatKeys.messages(rideId) });
        refreshRide();
      });
      return () => {
        stop();
        sub.remove();
      };
    }, [rideId, enabled, queryClient]),
  );
}
