import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader, Backdrop, EmptyState } from '@/ui';

// Placeholder until its feature lands (see docs/spec/09-roadmap.md).
export default function UCSDTab() {
  return (
    <Backdrop>
      <SafeAreaView className="flex-1" edges={['top']}>
        <AppHeader eyebrow="Rides from campus" title="UCSD" trailing={null} />
        <EmptyState
          icon="plane-depart"
          title="No rides yet"
          body="Posting and joining rides arrives in Phase 3."
        />
      </SafeAreaView>
    </Backdrop>
  );
}
