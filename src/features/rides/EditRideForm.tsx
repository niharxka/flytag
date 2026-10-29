import { ActivityIndicator, Text, View } from 'react-native';

import { errorMessage } from '@/lib/errors';
import { useThemeColors } from '@/theme/useThemeMode';

import { PostRideForm } from './PostRideForm';
import { useRide } from './rides.hooks';

/** Edit ride sheet (host): loads the ride, then shows the post form filled in. */
export function EditRideForm({ rideId }: { rideId: string }) {
  const c = useThemeColors();
  const ride = useRide(rideId);
  if (ride.data) return <PostRideForm ride={ride.data} />;
  return (
    <View className="flex-1 bg-surface p-space-5">
      {ride.isError ? (
        <Text className="type-body-sm text-danger">{errorMessage(ride.error)}</Text>
      ) : (
        <ActivityIndicator color={c.inkMuted} accessibilityLabel="Loading ride" />
      )}
    </View>
  );
}
