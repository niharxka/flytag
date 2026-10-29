import { useLocalSearchParams } from 'expo-router';

import { RideDetail } from '@/features/rides';

export default function RideRoute() {
  const { rideId } = useLocalSearchParams<{ rideId: string }>();
  return <RideDetail rideId={rideId} />;
}
