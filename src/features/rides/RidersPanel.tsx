import { router } from 'expo-router';
import { ActivityIndicator, Linking, Pressable, Text, View } from 'react-native';

import { useAvatarUrl } from '@/features/profile';
import { errorMessage } from '@/lib/errors';
import { useThemeColors } from '@/theme/useThemeMode';
import { GlassView, RiderRow, Tag } from '@/ui';

import type { Ride, RideMember } from './rides.api';
import { useRideMembers, useRiderContact } from './rides.hooks';
import { formatSeats } from './rides.logic';

const INTENT_TAG = {
  networking: { label: 'Networking', tone: 'sky' },
  flypal: { label: 'FlyPal', tone: 'deep' },
} as const;

function MemberRow({
  member,
  canCall,
  calling,
  onCall,
}: {
  member: RideMember;
  canCall: boolean;
  calling: boolean;
  onCall: () => void;
}) {
  const photo = useAvatarUrl(member.avatarPath);
  const name = member.isMe ? `${member.displayName} (you)` : member.displayName;
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/riders/[userId]', params: { userId: member.userId } })}
      accessibilityRole="button"
      accessibilityLabel={`${member.displayName}${member.isHost ? ', host' : ''}${member.home ? `, ${member.home}` : ''}`}
      accessibilityHint="Opens their profile"
    >
      <RiderRow
        name={name}
        college={[member.isHost ? 'Host' : null, member.home].filter(Boolean).join(' · ') || undefined}
        src={photo.data}
        tag={member.intent ? INTENT_TAG[member.intent] : undefined}
        phoneShared={member.phoneShared}
        // Only co-riders can call, and never yourself.
        showCall={canCall && !member.isMe}
        calling={calling}
        onCall={onCall}
      />
    </Pressable>
  );
}

/**
 * "Riders · 2 of 4" (§9.6). The call button asks the server for the number at tap time
 * (get_rider_contact) and opens the dialler only if it says yes.
 */
export function RidersPanel({ ride }: { ride: Ride }) {
  const c = useThemeColors();
  const members = useRideMembers(ride.id);
  const contact = useRiderContact(ride.id);
  const full = ride.seatsTaken >= ride.seatsMax;

  const call = (userId: string) =>
    contact.mutate(userId, { onSuccess: (phone) => Linking.openURL(`tel:${phone}`) });

  return (
    <GlassView className="gap-space-2 rounded-lg p-space-4">
      <View className="mb-space-1 flex-row items-center justify-between px-space-1">
        <Text className="type-label text-ink-muted" accessibilityRole="header">
          Riders · {formatSeats(ride.seatsTaken, ride.seatsMax)}
        </Text>
        {full && <Tag tone="go" icon="lock" label="Full" />}
      </View>
      {members.isPending ? (
        <ActivityIndicator color={c.inkMuted} accessibilityLabel="Loading riders" />
      ) : members.isError ? (
        <Text className="type-body-sm text-danger">{errorMessage(members.error)}</Text>
      ) : (
        members.data.map((m) => (
          <MemberRow
            key={m.userId}
            member={m}
            canCall={ride.isMember}
            calling={contact.isPending && contact.variables === m.userId}
            onCall={() => call(m.userId)}
          />
        ))
      )}
      {contact.error && (
        <Text className="type-body-sm px-space-1 text-danger" accessibilityRole="alert">
          {errorMessage(contact.error)}
        </Text>
      )}
    </GlassView>
  );
}
