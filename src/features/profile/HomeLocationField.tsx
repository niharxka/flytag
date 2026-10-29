import { ActivityIndicator, Text, View } from 'react-native';

import { errorMessage } from '@/lib/errors';
import { useThemeColors } from '@/theme/useThemeMode';
import { Button, Menu, TextField } from '@/ui';

import { useColleges } from './profile.hooks';
import { CUSTOM_HOME } from './profile.schemas';

type Props = {
  /** A college id, CUSTOM_HOME, or '' for not chosen yet. */
  choice: string;
  label: string;
  onChoiceChange: (choice: string) => void;
  onLabelChange: (label: string) => void;
  choiceError?: string;
  labelError?: string;
};

/**
 * Where a rider lives: one of the UCSD colleges, or "Somewhere else" with a short label for
 * off-campus riders. Used by onboarding and Edit profile. The label is visible to every
 * signed-in student, so the hint steers people to a neighbourhood, never an address.
 */
export function HomeLocationField({
  choice,
  label,
  onChoiceChange,
  onLabelChange,
  choiceError,
  labelError,
}: Props) {
  const c = useThemeColors();
  const colleges = useColleges();

  if (colleges.isPending)
    return <ActivityIndicator color={c.inkMuted} accessibilityLabel="Loading colleges" />;
  if (colleges.isError) {
    return (
      <View className="gap-space-2">
        <Text className="type-body-sm text-danger" accessibilityRole="alert">
          {errorMessage(colleges.error)}
        </Text>
        <Button variant="secondary" onPress={() => colleges.refetch()}>
          Try again
        </Button>
      </View>
    );
  }

  const options = [
    ...colleges.data.map((col) => ({ id: col.id, label: col.name })),
    { id: CUSTOM_HOME, label: 'Somewhere else' },
  ];

  return (
    <View className="gap-space-3">
      <Menu
        label="Home"
        items={options.map((o) => ({ label: o.label }))}
        active={options.findIndex((o) => o.id === choice)}
        onSelect={(i) => onChoiceChange(options[i].id)}
      />
      {choiceError && <Text className="type-body-sm text-danger">{choiceError}</Text>}
      {choice === CUSTOM_HOME && (
        <TextField
          label="Where you live"
          placeholder="Pacific Beach, La Jolla Village…"
          hint="A neighbourhood, not your address. Riders can see it."
          error={labelError}
          value={label}
          onChangeText={onLabelChange}
          maxLength={40}
          autoCapitalize="words"
          returnKeyType="done"
          autoFocus
        />
      )}
    </View>
  );
}
