import { router } from 'expo-router';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSession, useSignOut } from '@/features/auth';
import { errorMessage } from '@/lib/errors';
import { useThemeColors, useThemeMode } from '@/theme/useThemeMode';
import { AppHeader, Avatar, Backdrop, Button, IconButton, Menu, SegmentedControl, Tag } from '@/ui';

import { useAvatarUrl, useMyProfile } from './profile.hooks';

const INTENT_TAG = {
  networking: { label: 'Networking', tone: 'sky' },
  flypal: { label: 'FlyPal', tone: 'deep' },
} as const;

/** Screen 06 (§9.9). Tapping a detail, the avatar or the header pencil opens the edit screen. */
export function ProfileScreen() {
  const c = useThemeColors();
  const { session } = useSession();
  const profile = useMyProfile(session?.user.id);
  const signOut = useSignOut();
  const { theme, setTheme } = useThemeMode();
  const p = profile.data;
  const photo = useAvatarUrl(p?.avatarPath);
  const edit = () => router.push('/settings/edit-profile');

  return (
    <Backdrop>
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView contentContainerClassName="pb-[140px]">
          <AppHeader
            title="Profile"
            inset
            trailing={
              p ? <IconButton icon="pencil" label="Edit profile" variant="glass" onPress={edit} /> : null
            }
          />
          {!p ? (
            <ActivityIndicator color={c.inkMuted} accessibilityLabel="Loading profile" />
          ) : (
            <View className="gap-space-5 px-space-4">
              <View className="items-center gap-space-3">
                <Avatar
                  name={p.displayName}
                  src={photo.data}
                  size={88}
                  onPress={edit}
                  buttonLabel="Edit profile"
                />
                <Text className="font-800 text-[28px] leading-[32px] tracking-[-0.56px] text-ink">
                  {p.displayName}
                </Text>
                <View className="flex-row gap-space-2">
                  {p.homeName && <Tag tone="glass" icon="pin" label={p.homeName} />}
                  {p.intent && <Tag tone={INTENT_TAG[p.intent].tone} label={INTENT_TAG[p.intent].label} />}
                </View>
              </View>
              <Menu
                label="Profile"
                items={[
                  { label: 'Display name', meta: p.displayName, chevron: true },
                  { label: 'Home', meta: p.homeName ?? undefined, chevron: true },
                  { label: 'School email', meta: session?.user.email },
                ]}
                // Email is your sign-in, so it can't change here; the other rows open the editor.
                onSelect={(i) => i !== 2 && edit()}
              />
              <View className="gap-space-2">
                <Text className="type-label px-space-2 text-ink-muted">Theme</Text>
                <SegmentedControl
                  label="Theme"
                  options={[
                    { label: 'Light', icon: 'sun' },
                    { label: 'Dark', icon: 'moon' },
                  ]}
                  value={theme === 'dark' ? 1 : 0}
                  onChange={(i) => setTheme(i === 1 ? 'dark' : 'light')}
                />
              </View>
              {signOut.error && (
                <Text className="type-body-sm text-danger" accessibilityRole="alert">
                  {errorMessage(signOut.error)}
                </Text>
              )}
              {__DEV__ && (
                <Button variant="secondary" block icon="search" onPress={() => router.push('/dev/ui')}>
                  Open component gallery
                </Button>
              )}
              <Button variant="ghost" block loading={signOut.isPending} onPress={() => signOut.mutate()}>
                Sign out
              </Button>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Backdrop>
  );
}
