import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSession } from '@/features/auth';
import { useMyProfile } from '@/features/profile';
import { formatRideDate, formatRideTime } from '@/lib/dates';
import { errorMessage } from '@/lib/errors';
import { useThemeColors } from '@/theme/useThemeMode';
import {
  AppHeader,
  Backdrop,
  Button,
  EmptyState,
  GlassView,
  IconButton,
  SegmentedControl,
  Timeline,
} from '@/ui';

import type { Ride, RiderIntent } from './rides.api';
import { RidersPanel } from './RidersPanel';
import { useCancelRide, useJoinRide, useLeaveRide, useRide } from './rides.hooks';
import { fareShareDollars, rideTimeline } from './rides.logic';

const TAG_CHOICES: (RiderIntent | null)[] = [null, 'networking', 'flypal'];

function Detail({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View className="gap-space-1">
      <Text className="type-label text-ink-muted">{label}</Text>
      <Text className="type-body text-ink">{value}</Text>
      {sub && <Text className="type-body-sm text-ink-muted">{sub}</Text>}
    </View>
  );
}

/** Screen 05 (§9.6): timeline, riders, details, and Join / Leave / host actions. */
export function RideDetail({ rideId }: { rideId: string }) {
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
  return <Loaded ride={ride.data} back={back} />;
}

function Loaded({ ride: r, back }: { ride: Ride; back: () => void }) {
  const { session } = useSession();
  const me = useMyProfile(session?.user.id);
  const join = useJoinRide(r.id);
  const leave = useLeaveRide(r.id);
  const cancel = useCancelRide(r.id);
  // Tag for this ride, starting from the profile's (decision for §15 #7).
  const [tag, setTag] = useState<RiderIntent | null | undefined>(undefined);
  const chosenTag = tag === undefined ? (me.data?.intent ?? null) : tag;

  // Read the clock once per visit (render must be pure); reopening the ride updates it.
  const [openedAt] = useState(() => Date.now());
  const departed = new Date(r.departAt).getTime() <= openedAt;
  const full = r.seatsTaken >= r.seatsMax;
  const open = !r.cancelled && !departed;
  const share = fareShareDollars(r.estTotalCostCents, r.seatsTaken);
  const eyebrow = [formatRideDate(r.departAt), [r.hostName, r.hostHome].filter(Boolean).join(', ')]
    .filter(Boolean)
    .join(' · ');
  const actionError = join.error ?? leave.error ?? cancel.error;

  const confirmLeave = () =>
    Alert.alert(
      'Leave this ride?',
      r.isHost
        ? r.seatsTaken > 1
          ? 'The rider who joined first becomes the host.'
          : 'You’re the only one in it, so the ride will be cancelled.'
        : 'Your seat opens up for someone else.',
      [
        { text: 'Stay', style: 'cancel' },
        { text: 'Leave ride', style: 'destructive', onPress: () => leave.mutate() },
      ],
    );
  const confirmCancel = () =>
    Alert.alert('Cancel this ride?', 'It disappears for everyone, including riders who joined.', [
      { text: 'Keep ride', style: 'cancel' },
      {
        text: 'Cancel ride',
        style: 'destructive',
        onPress: () => cancel.mutate(undefined, { onSuccess: back }),
      },
    ]);

  return (
    <Backdrop>
      <SafeAreaView className="flex-1">
        <ScrollView contentContainerClassName="pb-space-7">
          <AppHeader
            eyebrow={eyebrow}
            title={formatRideTime(r.departAt)}
            onBack={back}
            trailing={
              r.isHost && open ? (
                <IconButton
                  icon="pencil"
                  label="Edit ride"
                  variant="glass"
                  onPress={() => router.push({ pathname: '/rides/[rideId]/edit', params: { rideId: r.id } })}
                />
              ) : null
            }
          />
          <View className="gap-space-3 px-space-4">
            {r.cancelled && (
              <Text
                className="type-body-sm rounded-md bg-surface p-space-3 text-danger"
                accessibilityRole="alert"
              >
                This ride was cancelled.
              </Text>
            )}
            <Timeline steps={rideTimeline(r)} />

            <RidersPanel ride={r} />

            {(r.meetSpot || share != null || r.notes) && (
              <GlassView className="gap-space-4 rounded-lg p-space-5">
                {r.meetSpot && <Detail label="Meet spot" value={r.meetSpot} />}
                {share != null && (
                  <Detail
                    label="Fare"
                    value={`About $${share} each`}
                    sub={`$${Math.round(r.estTotalCostCents! / 100)} total, split between ${r.seatsTaken} ${
                      r.seatsTaken === 1 ? 'rider' : 'riders'
                    }. Drops as people join.`}
                  />
                )}
                {r.notes && <Detail label="Notes" value={r.notes} />}
              </GlassView>
            )}

            {actionError && (
              <Text className="type-body-sm px-space-1 text-danger" accessibilityRole="alert">
                {errorMessage(actionError)}
              </Text>
            )}

            {open && !r.isMember && (
              <View className="gap-space-3">
                {!full && (
                  <View className="gap-space-2">
                    <Text className="type-label px-space-1 text-ink-muted">Your tag for this ride</Text>
                    <SegmentedControl
                      label="Your tag for this ride"
                      options={['None', 'Networking', 'FlyPal']}
                      value={TAG_CHOICES.indexOf(chosenTag)}
                      onChange={(i) => setTag(TAG_CHOICES[i])}
                    />
                  </View>
                )}
                <Button
                  variant="sky"
                  size="lg"
                  block
                  icon={full ? 'lock' : 'plus'}
                  disabled={full}
                  loading={join.isPending}
                  onPress={() => join.mutate(chosenTag)}
                  accessibilityHint={full ? 'This ride has no seats left' : undefined}
                >
                  {full ? 'Ride full' : 'Join ride'}
                </Button>
              </View>
            )}

            {open && r.isMember && (
              <View className="gap-space-2">
                {r.isHost && (
                  <Button variant="secondary" block loading={cancel.isPending} onPress={confirmCancel}>
                    Cancel ride
                  </Button>
                )}
                <Button variant="ghost" block loading={leave.isPending} onPress={confirmLeave}>
                  Leave ride
                </Button>
              </View>
            )}

            <GlassView className="gap-space-2 rounded-lg p-space-5">
              <Text className="type-label text-ink-muted" accessibilityRole="header">
                Chat
              </Text>
              <Text className="type-body-sm text-ink-muted">
                {r.isMember ? 'Ride chat arrives in the next update.' : 'Join to chat with riders.'}
              </Text>
            </GlassView>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Backdrop>
  );
}
