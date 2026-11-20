import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useIsGuest } from '@/features/auth';
import { AppHeader, Backdrop, Button, EmptyState } from '@/ui';

// Placeholder until its feature lands (see docs/spec/09-roadmap.md).
export default function AlertsTab() {
  const guest = useIsGuest();
  return (
    <Backdrop>
      <SafeAreaView className="flex-1" edges={['top']}>
        <AppHeader eyebrow="Updates" title="Alerts" trailing={null} inset />
        {guest ? (
          <EmptyState
            icon="bell"
            title="Ride updates show up here"
            body="Sign in to hear when someone joins your ride, messages you, or it’s time to leave."
            action={
              <Button variant="sky" onPress={() => router.push('/welcome')}>
                Sign in
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon="bell"
            title="You’re all caught up"
            body="Joins, messages and reminders will show up here."
          />
        )}
      </SafeAreaView>
    </Backdrop>
  );
}
