import { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { errorMessage } from '@/lib/errors';
import { useThemeColors } from '@/theme/useThemeMode';
import { Button, Menu, TextField } from '@/ui';

import { useColleges } from './profile.hooks';
import { homeRows } from './profile.logic';
import { CUSTOM_HOME, MAX_SAVED_AREAS, sameArea } from './profile.schemas';

type Props = {
  /** A college id, CUSTOM_HOME, or '' for not chosen yet. */
  choice: string;
  /** The chosen custom area, or what's being typed while the field is open. */
  label: string;
  /** Custom areas the rider has added, oldest first. */
  areas: string[];
  onChoiceChange: (choice: string) => void;
  onLabelChange: (label: string) => void;
  onAreasChange: (areas: string[]) => void;
  choiceError?: string;
  labelError?: string;
};

/**
 * Where a rider lives: one of the UCSD colleges, or a custom area for off-campus riders.
 * Used by onboarding and Edit profile. Areas are visible to every signed-in student once
 * chosen, so the hint steers people to a neighbourhood, never an address.
 *
 * Each area added through "Somewhere else" becomes its own numbered row (with a × to remove
 * it) above "Somewhere else", up to MAX_SAVED_AREAS. Typing writes the form label directly,
 * so Save works even if Add was never pressed (the schema adds it to the list then).
 */
export function HomeLocationField({
  choice,
  label,
  areas,
  onChoiceChange,
  onLabelChange,
  onAreasChange,
  choiceError,
  labelError,
}: Props) {
  const c = useThemeColors();
  const colleges = useColleges();
  // True from tapping "Somewhere else" until Add (or picking a row).
  const [editing, setEditing] = useState(false);
  const [addError, setAddError] = useState<string>();

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

  const { rows, active, showEditor } = homeRows({
    colleges: colleges.data,
    areas,
    choice,
    label,
    editing,
  });

  const select = (i: number) => {
    const row = rows[i];
    setAddError(undefined);
    if (row.kind === 'new') {
      if (editing) return;
      onLabelChange('');
      onChoiceChange(CUSTOM_HOME);
      setEditing(true);
      return;
    }
    setEditing(false);
    if (row.kind === 'college') {
      onChoiceChange(row.id);
    } else {
      onLabelChange(row.label);
      onChoiceChange(CUSTOM_HOME);
    }
  };

  const remove = (area: string) => {
    onAreasChange(areas.filter((a) => a !== area));
    // Removing the area you'd picked leaves no home; Save then asks you to pick one.
    if (choice === CUSTOM_HOME && !showEditor && sameArea(label, area)) {
      onLabelChange('');
      onChoiceChange('');
    }
  };

  const add = () => {
    const area = label.trim();
    if (!area) return setAddError('Add a neighbourhood or area.');
    const existing = areas.find((a) => sameArea(a, area));
    if (existing) {
      // Already saved: just pick it, no duplicate row.
      onLabelChange(existing);
    } else {
      if (areas.length >= MAX_SAVED_AREAS)
        return setAddError(`You can keep up to ${MAX_SAVED_AREAS} areas. Remove one first.`);
      onAreasChange([...areas, area]);
      onLabelChange(area);
    }
    setAddError(undefined);
    setEditing(false);
  };

  return (
    <View className="gap-space-3">
      <Menu
        label="Home"
        items={rows.map((r) =>
          r.kind === 'area' ? { label: r.label, onRemove: () => remove(r.label) } : { label: r.label },
        )}
        active={active}
        onSelect={select}
      />
      {choiceError && <Text className="type-body-sm text-danger">{choiceError}</Text>}
      {showEditor && (
        <View className="gap-space-3">
          <TextField
            label="Where you live"
            placeholder="Pacific Beach, La Jolla Village…"
            hint="A neighbourhood, not your address. Riders can see it."
            error={addError ?? labelError}
            value={label}
            onChangeText={(t) => {
              setAddError(undefined);
              onLabelChange(t);
            }}
            maxLength={40}
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={add}
            autoFocus
          />
          <Button variant="secondary" icon="plus" onPress={add}>
            Add
          </Button>
        </View>
      )}
    </View>
  );
}
