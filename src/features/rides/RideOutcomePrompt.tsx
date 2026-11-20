import { useState } from 'react';
import { Text, View } from 'react-native';

import { errorMessage } from '@/lib/errors';
import { Button, GlassView, IconButton, TextField } from '@/ui';

import type { Ride } from './rides.api';
import { useRecordRideOutcome } from './rides.hooks';
import { rideFareSchema } from './rides.schemas';

type Props = {
  ride: Ride;
  /** Small line above the question, e.g. "Your ride on Tue 3/18 · 11:00 AM". */
  eyebrow?: string;
  /** Rides tab card only: hides it until next launch. */
  onDismiss?: () => void;
};

/**
 * "Did you ride together?" after a ride leaves (§14: completed rides and money saved).
 * No saves at once; Yes asks for the total fare (optional), then saves. One answer per rider;
 * the server lets a later answer replace an earlier one.
 */
export function RideOutcomePrompt({ ride, eyebrow, onDismiss }: Props) {
  const record = useRecordRideOutcome(ride.id);
  const [askFare, setAskFare] = useState(false);
  const [fare, setFare] = useState('');
  const [fareError, setFareError] = useState<string>();

  const saveYes = () => {
    const parsed = rideFareSchema.safeParse(fare);
    if (!parsed.success) {
      setFareError(parsed.error.issues[0]?.message);
      return;
    }
    setFareError(undefined);
    record.mutate({ rodeTogether: true, totalFareCents: parsed.data ?? null });
  };

  return (
    <GlassView className="gap-space-3 rounded-lg p-space-4">
      <View className="flex-row items-start gap-space-2">
        <View className="flex-1 gap-space-1">
          {eyebrow && <Text className="type-label text-ink-muted">{eyebrow}</Text>}
          <Text className="type-heading text-ink" accessibilityRole="header">
            {askFare ? 'What did the whole ride cost?' : 'Did you ride together?'}
          </Text>
        </View>
        {onDismiss && <IconButton icon="x" label="Not now" size="sm" variant="glass" onPress={onDismiss} />}
      </View>

      {askFare ? (
        <>
          <TextField
            label="Total fare (optional)"
            hint="The full Uber or Lyft price, before splitting. It adds up what riders save."
            placeholder={ride.estTotalCostCents != null ? String(Math.round(ride.estTotalCostCents / 100)) : '48'}
            keyboardType="decimal-pad"
            value={fare}
            onChangeText={setFare}
            error={fareError}
          />
          <Button variant="sky" block loading={record.isPending} onPress={saveYes}>
            Save answer
          </Button>
        </>
      ) : (
        <View className="flex-row gap-space-2">
          <Button variant="secondary" className="flex-1" onPress={() => setAskFare(true)}>
            Yes, we did
          </Button>
          <Button
            variant="secondary"
            className="flex-1"
            loading={record.isPending}
            onPress={() => record.mutate({ rodeTogether: false, totalFareCents: null })}
          >
            No
          </Button>
        </View>
      )}

      {record.error && (
        <Text className="type-body-sm text-danger" accessibilityRole="alert">
          {errorMessage(record.error)}
        </Text>
      )}
    </GlassView>
  );
}
