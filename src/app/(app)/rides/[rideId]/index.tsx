import { useLocalSearchParams } from 'expo-router';

import { ChatPreview } from '@/features/chat';
import { RideDetail } from '@/features/rides';

export default function RideRoute() {
  const { rideId } = useLocalSearchParams<{ rideId: string }>();
  // The route joins the two features: ride detail with the chat panel in its slot.
  return (
    <RideDetail
      rideId={rideId}
      renderChat={(ride) => <ChatPreview rideId={ride.id} isMember={ride.isMember} />}
    />
  );
}
