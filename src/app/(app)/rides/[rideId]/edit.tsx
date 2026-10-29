import { useLocalSearchParams } from 'expo-router';

import { EditRideForm } from '@/features/rides';

export default function EditRideRoute() {
  const { rideId } = useLocalSearchParams<{ rideId: string }>();
  return <EditRideForm rideId={rideId} />;
}
