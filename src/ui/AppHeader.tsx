import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { Avatar } from './Avatar';
import { IconButton } from './IconButton';

type Props = {
  title: string;
  /** Uppercase label above the title, e.g. "Rides from campus". */
  eyebrow?: string;
  /** Shows the round back button on the left. */
  onBack?: () => void;
  /** Right-hand slot. Leave out for the user's avatar; pass null for nothing. */
  trailing?: ReactNode | null;
  userName?: string;
  userPhoto?: string;
  onProfile?: () => void;
  /** More room above and left of the title, for tab screens whose content doesn't need to line up with it. */
  inset?: boolean;
};

/** Screen header: eyebrow + title-xl on the left, the user's avatar (or a custom action) on the right. */
export function AppHeader({
  title,
  eyebrow,
  onBack,
  trailing,
  userName,
  userPhoto,
  onProfile,
  inset = false,
}: Props) {
  return (
    <View
      className={`flex-row items-end justify-between gap-space-4 pb-space-4 ${inset ? 'px-space-5 pt-space-6' : 'px-space-4 pt-space-5'}`}
    >
      <View className="min-w-0 flex-1 flex-row items-center gap-space-3">
        {onBack && (
          <IconButton icon="chevron-left" label="Go back" variant="glass" size="sm" onPress={onBack} />
        )}
        <View className="min-w-0 flex-1">
          {eyebrow && <Text className="type-label mb-space-1 text-ink-muted">{eyebrow}</Text>}
          <Text
            className="type-title-xl text-ink"
            accessibilityRole="header"
            maxFontSizeMultiplier={1.2}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {title}
          </Text>
        </View>
      </View>
      {trailing !== undefined ? (
        trailing
      ) : (
        <Avatar name={userName} src={userPhoto} size={48} onPress={onProfile} buttonLabel="Open profile" />
      )}
    </View>
  );
}
