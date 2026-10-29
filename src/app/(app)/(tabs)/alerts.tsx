import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader, Backdrop, EmptyState } from '@/ui';

// Placeholder until its feature lands (see docs/spec/09-roadmap.md).
export default function AlertsTab() {
  return (
    <Backdrop>
      <SafeAreaView className="flex-1" edges={['top']}>
        <AppHeader eyebrow="Updates" title="Alerts" trailing={null} />
        <EmptyState
          icon="bell"
          title="You’re all caught up"
          body="Joins, messages and reminders will show up here."
        />
      </SafeAreaView>
    </Backdrop>
  );
}
