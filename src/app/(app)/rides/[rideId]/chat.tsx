import { useLocalSearchParams } from 'expo-router';

import { ChatScreen } from '@/features/chat';

export default function RideChatRoute() {
  const { rideId } = useLocalSearchParams<{ rideId: string }>();
  return <ChatScreen rideId={rideId} />;
}
