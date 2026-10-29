import { useLocalSearchParams } from 'expo-router';

import { RideSummary } from '@/features/rides';

export default function RideRoute() {
  const { rideId } = useLocalSearchParams<{ rideId: string }>();
  return <RideSummary rideId={rideId} />;
}
