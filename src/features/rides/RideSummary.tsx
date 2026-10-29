import { router } from 'expo-router';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatRideDate, formatRideTime } from '@/lib/dates';
import { errorMessage } from '@/lib/errors';
import { useThemeColors } from '@/theme/useThemeMode';
import { AppHeader, AvatarStack, Backdrop, Button, EmptyState, GlassView, Tag } from '@/ui';

import { useRide } from './rides.hooks';
import { formatSeats } from './rides.logic';

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View className="gap-space-1">
      <Text className="type-label text-ink-muted">{label}</Text>
      <Text className="type-body text-ink">{value}</Text>
    </View>
  );
}

/**
 * Read-only ride page for Phase 3, so posting (and tapping a card) has somewhere to land.
 * Phase 4 replaces it with the full detail screen: timeline, riders panel, join/leave, fare share.
 */
export function RideSummary({ rideId }: { rideId: string }) {
  const c = useThemeColors();
  const ride = useRide(rideId);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  if (ride.isPending) {
    return (
      <Backdrop>
        <ActivityIndicator className="mt-space-8" color={c.inkMuted} accessibilityLabel="Loading ride" />
      </Backdrop>
    );
  }
  if (ride.isError) {
    return (
      <Backdrop>
        <SafeAreaView className="flex-1">
          <AppHeader title="Ride" onBack={back} trailing={null} />
          <EmptyState icon="search" title="Couldn’t load this ride" body={errorMessage(ride.error)} />
        </SafeAreaView>
      </Backdrop>
    );
  }

  const r = ride.data;
  const eyebrow = [formatRideDate(r.departAt), [r.hostName, r.hostHome].filter(Boolean).join(', ')]
    .filter(Boolean)
    .join(' · ');

  return (
    <Backdrop>
      <SafeAreaView className="flex-1">
        <ScrollView contentContainerClassName="pb-space-7">
          <AppHeader eyebrow={eyebrow} title={formatRideTime(r.departAt)} onBack={back} trailing={null} />
          <View className="gap-space-3 px-space-4">
            <GlassView className="gap-space-4 rounded-lg p-space-5">
              <View className="flex-row items-center justify-between">
                <Text className="type-label text-ink-muted">
                  Riders · {formatSeats(r.seatsTaken, r.seatsMax)}
                </Text>
                {r.seatsTaken >= r.seatsMax && <Tag tone="go" icon="users" label="Full" />}
              </View>
              <View className="flex-row items-center gap-space-3">
                <AvatarStack names={r.riderNames} max={6} size={40} />
                <Text className="type-body-sm flex-1 text-ink-muted">{r.riderNames.join(', ')}</Text>
              </View>
              {r.isHost && <Tag tone="charcoal" label="You’re hosting" />}
              {!r.isHost && r.isMember && <Tag tone="sky" label="You’re in" />}
            </GlassView>
            {(r.meetSpot || r.estTotalCostCents != null || r.notes) && (
              <GlassView className="gap-space-4 rounded-lg p-space-5">
                {r.meetSpot && <Detail label="Meet spot" value={r.meetSpot} />}
                {r.estTotalCostCents != null && (
                  <Detail label="Estimated total fare" value={`$${(r.estTotalCostCents / 100).toFixed(2)}`} />
                )}
                {r.notes && <Detail label="Notes" value={r.notes} />}
              </GlassView>
            )}
            <Text className="type-body-sm px-space-2 text-ink-muted">
              Joining, the riders list and chat arrive in the next update.
            </Text>
            <Button variant="secondary" block onPress={back}>
              Back to rides
            </Button>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Backdrop>
  );
}
