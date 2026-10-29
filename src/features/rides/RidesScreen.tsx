import { router } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSession } from '@/features/auth';
import { useAvatarUrl, useMyProfile } from '@/features/profile';
import { size, spacing } from '@/theme/tokens';
import { useThemeMode } from '@/theme/useThemeMode';
import { AppHeader, Avatar, Backdrop, Fab, IconButton, SegmentedControl, TAB_BAR_HEIGHT } from '@/ui';

import { RideList } from './RideList';
import { useRidesUi } from './rides.store';

const DIRECTIONS = ['to_airport', 'to_campus'] as const;

/** Screen 03 (§9.4). */
export function RidesScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useSession();
  const profile = useMyProfile(session?.user.id);
  const photo = useAvatarUrl(profile.data?.avatarPath);
  const { direction, setDirection } = useRidesUi();
  const { theme, toggleTheme } = useThemeMode();
  const postRide = () => router.push('/rides/new');

  // The tab bar floats space-4 above the bottom inset; the FAB sits space-4 above the tab bar.
  const fabBottom = insets.bottom + spacing.space4 + TAB_BAR_HEIGHT + spacing.space4;

  return (
    <Backdrop>
      <SafeAreaView className="flex-1" edges={['top']}>
        <AppHeader
          eyebrow={direction === 'to_airport' ? 'Rides from campus' : 'Rides to campus'}
          title="UCSD"
          trailing={
            <View className="flex-row items-center gap-space-2">
              {/* The icon shows where the tap takes you: moon → dark, sun → light. */}
              <IconButton
                icon={theme === 'dark' ? 'sun' : 'moon'}
                label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                variant="glass"
                onPress={toggleTheme}
              />
              <Avatar
                name={profile.data?.displayName}
                src={photo.data}
                size={48}
                onPress={() => router.push('/profile')}
                buttonLabel="Open profile"
              />
            </View>
          }
        />
        <View className="px-space-4">
          <SegmentedControl
            label="Direction"
            options={[
              { label: 'To airport', icon: 'plane-depart' },
              { label: 'To campus', icon: 'plane-land' },
            ]}
            value={DIRECTIONS.indexOf(direction)}
            onChange={(i) => setDirection(DIRECTIONS[i])}
          />
        </View>
        <RideList
          direction={direction}
          onPostRide={postRide}
          bottomInset={fabBottom + size.controlLg + spacing.space4}
        />
      </SafeAreaView>
      <View
        className="absolute left-0 right-0 items-center"
        style={{ bottom: fabBottom }}
        pointerEvents="box-none"
      >
        <Fab label="Post a ride" onPress={postRide} />
      </View>
    </Backdrop>
  );
}
