import { zodResolver } from '@hookform/resolvers/zod';
import * as Crypto from 'expo-crypto';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Platform, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  defaultDepartAt,
  formatRideDate,
  formatRideTime,
  RIDE_TZ,
  withRideDay,
  withRideTime,
} from '@/lib/dates';
import { errorMessage } from '@/lib/errors';
import { spacing } from '@/theme/tokens';
import {
  Button,
  DateTimeField,
  KeyboardScrollView,
  RideCard,
  SeatStepper,
  SegmentedControl,
  TextField,
} from '@/ui';

import { useCreateRide, useNearbyRides } from './rides.hooks';
import { postRideSchema, type PostRide, type PostRideInput } from './rides.schemas';
import { useRidesUi } from './rides.store';

const DIRECTIONS = ['to_airport', 'to_campus'] as const;
const DAY_MS = 86_400_000;

/** Screen 04 (§9.5), shown as a native form sheet over the Rides tab. */
export function PostRideForm() {
  const insets = useSafeAreaInsets();
  const startDirection = useRidesUi((s) => s.direction);
  const create = useCreateRide();
  // One id per open sheet: if "Post ride" is sent twice (double tap, retry after a timeout),
  // create_ride sees the same id and returns the first ride instead of making another.
  const [requestId] = useState(() => Crypto.randomUUID());

  const { control, handleSubmit, formState } = useForm<PostRideInput, unknown, PostRide>({
    resolver: zodResolver(postRideSchema),
    defaultValues: {
      direction: startDirection,
      departAt: defaultDepartAt(),
      seatsMax: 4,
      meetSpot: '',
      notes: '',
      estTotalCostCents: '',
    },
  });
  const direction = useWatch({ control, name: 'direction' });
  const departAt = useWatch({ control, name: 'departAt' });
  const nearby = useNearbyRides(direction, departAt);

  const onSubmit = handleSubmit((input) =>
    create.mutate(
      { input, requestId },
      { onSuccess: (rideId) => router.replace({ pathname: '/rides/[rideId]', params: { rideId } }) },
    ),
  );
  const now = new Date();

  return (
    // The sheet's root must be the scroll view itself (a wrapper view breaks the sheet).
    <KeyboardScrollView
      className="flex-1 bg-surface"
      keyboardShouldPersistTaps="handled"
      // Drag the form down to put the keyboard away (the fare's number pad has no return key).
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      contentContainerClassName="gap-space-4 px-space-5 pt-space-6"
      contentContainerStyle={{ paddingBottom: insets.bottom + spacing.space5 }}
    >
      <Text className="type-title text-ink" accessibilityRole="header">
        Post a ride
      </Text>

      <Controller
        control={control}
        name="direction"
        render={({ field }) => (
          <SegmentedControl
            label="Direction"
            options={[
              { label: 'To airport', icon: 'plane-depart' },
              { label: 'To campus', icon: 'plane-land' },
            ]}
            value={DIRECTIONS.indexOf(field.value)}
            onChange={(i) => field.onChange(DIRECTIONS[i])}
          />
        )}
      />

      <Controller
        control={control}
        name="departAt"
        render={({ field }) => (
          <>
            <DateTimeField
              label="Date"
              mode="date"
              value={field.value}
              onChange={(day) => field.onChange(withRideDay(field.value, day))}
              format={formatRideDate}
              timeZoneName={RIDE_TZ}
              minimumDate={now}
              maximumDate={new Date(now.getTime() + 90 * DAY_MS)}
            />
            <DateTimeField
              label={direction === 'to_airport' ? 'Leave campus at' : 'Meet at SAN at'}
              mode="time"
              value={field.value}
              onChange={(time) => field.onChange(withRideTime(field.value, time))}
              format={formatRideTime}
              timeZoneName={RIDE_TZ}
              error={formState.errors.departAt?.message}
            />
          </>
        )}
      />

      <Controller
        control={control}
        name="seatsMax"
        render={({ field }) => (
          <View className="min-h-control-md flex-row items-center justify-between">
            <View>
              <Text className="type-body-sm font-600 text-ink">Max riders</Text>
              <Text className="type-body-sm text-ink-muted">Including you</Text>
            </View>
            <SeatStepper label="Max riders" value={field.value} onChange={field.onChange} min={2} max={6} />
          </View>
        )}
      />

      {nearby.data && nearby.data.length > 0 && (
        <View className="gap-space-2 rounded-lg bg-sky-soft p-space-4">
          <Text className="type-heading text-ink">Ride together instead?</Text>
          <Text className="type-body-sm text-ink-muted">
            {nearby.data.length === 1 ? 'A ride' : 'These rides'} near that time still{' '}
            {nearby.data.length === 1 ? 'has' : 'have'} seats. Joining saves everyone money.
          </Text>
          {nearby.data.map((ride) => (
            <RideCard
              key={ride.id}
              date={formatRideDate(ride.departAt)}
              time={formatRideTime(ride.departAt)}
              seatsTaken={ride.seatsTaken}
              seatsMax={ride.seatsMax}
              riders={ride.riderNames}
              direction={ride.direction === 'to_campus' ? 'to-campus' : 'to-airport'}
              onPress={() => router.replace({ pathname: '/rides/[rideId]', params: { rideId: ride.id } })}
            />
          ))}
        </View>
      )}

      <Controller
        control={control}
        name="estTotalCostCents"
        render={({ field }) => (
          <TextField
            label="Estimated total fare"
            placeholder="$48"
            hint="Riders see their share."
            error={formState.errors.estTotalCostCents?.message}
            value={field.value}
            onChangeText={field.onChange}
            keyboardType="decimal-pad"
          />
        )}
      />
      <Controller
        control={control}
        name="meetSpot"
        render={({ field }) => (
          <TextField
            label="Meet spot"
            placeholder={direction === 'to_airport' ? 'Sixth market' : 'Terminal 2 baggage claim'}
            error={formState.errors.meetSpot?.message}
            value={field.value}
            onChangeText={field.onChange}
            maxLength={80}
            returnKeyType="done"
          />
        )}
      />
      <Controller
        control={control}
        name="notes"
        render={({ field }) => (
          <TextField
            label="Notes"
            placeholder="Luggage, flight number, anything riders should know"
            error={formState.errors.notes?.message}
            value={field.value}
            onChangeText={field.onChange}
            maxLength={280}
            returnKeyType="done"
          />
        )}
      />

      {create.error && (
        <Text className="type-body-sm text-danger" accessibilityRole="alert">
          {errorMessage(create.error)}
        </Text>
      )}
      <View className="flex-row gap-space-3 pt-space-2">
        <View className="flex-1">
          <Button variant="ghost" block onPress={() => router.back()}>
            Cancel
          </Button>
        </View>
        <View className="flex-1">
          <Button variant="primary" block loading={create.isPending} onPress={() => onSubmit()}>
            Post ride
          </Button>
        </View>
      </View>
    </KeyboardScrollView>
  );
}
