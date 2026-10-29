import { router } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, RefreshControl, SectionList, Text, View } from 'react-native';

import { formatRideDate, formatRideTime } from '@/lib/dates';
import { errorMessage } from '@/lib/errors';
import { useThemeColors } from '@/theme/useThemeMode';
import { Button, ContentCard, EmptyState, RideCard } from '@/ui';

import type { Direction } from './rides.api';
import { useRides } from './rides.hooks';
import { groupRidesByDay } from './rides.logic';

type Props = {
  direction: Direction;
  onPostRide: () => void;
  /** Space to leave under the last card so the FAB and tab bar don't cover it. */
  bottomInset: number;
};

/** The Rides tab list (§9.4): sticky day headers, pull to refresh, loads more as you scroll. */
export function RideList({ direction, onPostRide, bottomInset }: Props) {
  const c = useThemeColors();
  const rides = useRides(direction);
  const days = useMemo(() => groupRidesByDay(rides.data ?? []), [rides.data]);

  if (rides.isPending) {
    return <ActivityIndicator className="mt-space-7" color={c.inkMuted} accessibilityLabel="Loading rides" />;
  }
  if (rides.isError) {
    return (
      <EmptyState
        icon="search"
        title="Couldn’t load rides"
        body={errorMessage(rides.error)}
        action={
          <Button variant="secondary" onPress={() => rides.refetch()}>
            Try again
          </Button>
        }
      />
    );
  }

  return (
    <SectionList
      sections={days}
      keyExtractor={(ride) => ride.id}
      stickySectionHeadersEnabled
      contentContainerStyle={{ paddingBottom: bottomInset }}
      refreshControl={
        <RefreshControl
          refreshing={rides.isRefetching && !rides.isFetchingNextPage}
          onRefresh={() => void rides.refetch()}
          tintColor={c.inkMuted}
        />
      }
      onEndReached={() => {
        if (rides.hasNextPage && !rides.isFetchingNextPage) void rides.fetchNextPage();
      }}
      onEndReachedThreshold={0.5}
      renderSectionHeader={({ section }) => (
        <View className="px-space-4 pb-space-2 pt-space-4">
          <View className="self-start rounded-pill bg-surface px-space-3 py-space-1">
            <Text className="type-label text-ink-muted" accessibilityRole="header">
              {section.title}
            </Text>
          </View>
        </View>
      )}
      renderItem={({ item }) => (
        <View className="px-space-4 pb-space-3">
          <RideCard
            date={formatRideDate(item.departAt)}
            time={formatRideTime(item.departAt)}
            seatsTaken={item.seatsTaken}
            seatsMax={item.seatsMax}
            riders={item.riderNames}
            direction={item.direction === 'to_campus' ? 'to-campus' : 'to-airport'}
            highlight={item.isMember}
            onPress={() => router.push({ pathname: '/rides/[rideId]', params: { rideId: item.id } })}
          />
        </View>
      )}
      ListEmptyComponent={
        <View className="p-space-4">
          <ContentCard
            icon={direction === 'to_campus' ? 'plane-land' : 'plane-depart'}
            title="No rides yet for this direction"
            body="Post one and classmates heading the same way can tag along."
            footer={
              <View className="mt-space-4">
                <Button variant="sky" icon="plus" onPress={onPostRide}>
                  Post a ride
                </Button>
              </View>
            }
          />
        </View>
      }
      ListFooterComponent={
        rides.isFetchingNextPage ? <ActivityIndicator className="py-space-4" color={c.inkMuted} /> : undefined
      }
    />
  );
}
