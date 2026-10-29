import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { Icon, type IconName } from './Icon';

type Props = { icon: IconName; title: string; body?: string; action?: ReactNode };

/** The "nothing here yet" block every data screen needs (§9): icon, one line, optional action. */
export function EmptyState({ icon, title, body, action }: Props) {
  return (
    <View className="items-center gap-space-3 px-space-6 py-space-8">
      <View className="h-[64px] w-[64px] items-center justify-center rounded-pill bg-sky-soft">
        <Icon name={icon} size={30} className="text-sky-deep" />
      </View>
      <Text className="type-heading text-center text-ink" accessibilityRole="header">
        {title}
      </Text>
      {body && <Text className="type-body-sm text-center text-ink-muted">{body}</Text>}
      {action}
    </View>
  );
}
