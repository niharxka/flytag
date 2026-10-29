import { useLocalSearchParams } from 'expo-router';

import { RiderProfile } from '@/features/profile';

export default function RiderRoute() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  return <RiderProfile userId={userId} />;
}
