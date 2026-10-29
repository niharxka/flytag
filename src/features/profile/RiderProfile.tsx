import { router } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { errorMessage } from '@/lib/errors';
import { useThemeColors } from '@/theme/useThemeMode';
import { AppHeader, Avatar, Backdrop, EmptyState, Tag } from '@/ui';

import { useAvatarUrl, useProfile } from './profile.hooks';

const INTENT_TAG = {
  networking: { label: 'Networking', tone: 'sky' },
  flypal: { label: 'FlyPal', tone: 'deep' },
} as const;

/** Someone else's profile, opened from a ride's riders panel (§9.6). Public fields only. */
export function RiderProfile({ userId }: { userId: string }) {
  const c = useThemeColors();
  const profile = useProfile(userId);
  const photo = useAvatarUrl(profile.data?.avatarPath);
  const p = profile.data;

  return (
    <Backdrop>
      <SafeAreaView className="flex-1">
        <AppHeader
          eyebrow="Rider"
          title={p?.displayName ?? ''}
          onBack={() => router.back()}
          trailing={null}
        />
        {profile.isPending ? (
          <ActivityIndicator color={c.inkMuted} accessibilityLabel="Loading profile" />
        ) : !p ? (
          <EmptyState icon="user" title="Couldn’t load this rider" body={errorMessage(profile.error)} />
        ) : (
          <View className="items-center gap-space-3 px-space-4 pt-space-5">
            <Avatar name={p.displayName} src={photo.data} size={120} />
            <Text className="font-800 text-[28px] leading-[32px] tracking-[-0.56px] text-ink">
              {p.displayName}
            </Text>
            <View className="flex-row flex-wrap justify-center gap-space-2">
              {p.homeName && <Tag tone="glass" icon="pin" label={p.homeName} />}
              {p.intent && <Tag tone={INTENT_TAG[p.intent].tone} label={INTENT_TAG[p.intent].label} />}
            </View>
          </View>
        )}
      </SafeAreaView>
    </Backdrop>
  );
}
