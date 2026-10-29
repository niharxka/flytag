import { Switch, Text, View } from 'react-native';

import { useThemeColors } from '@/theme/useThemeMode';
import { SegmentedControl, TextField } from '@/ui';

import { INTENTS, type IntentChoice } from './profile.schemas';

// Fields shared by onboarding and Edit profile. Plain value/onChange props, so each form keeps
// its own react-hook-form setup and these stay simple.

const INTENT_LABELS = ['None', 'Networking', 'FlyPal'];

export function IntentField({
  value,
  onChange,
}: {
  value: IntentChoice;
  onChange: (v: IntentChoice) => void;
}) {
  return (
    <View className="gap-space-2">
      <Text className="type-label text-ink-muted">Your tag (optional)</Text>
      <SegmentedControl
        label="Your tag"
        options={INTENT_LABELS}
        value={INTENTS.indexOf(value)}
        onChange={(i) => onChange(INTENTS[i])}
      />
      <Text className="type-body-sm text-ink-muted">
        Shown next to your name. Networking: up for talking shop. FlyPal: happy to share the ride.
      </Text>
    </View>
  );
}

type PhoneProps = {
  phone: string;
  onPhoneChange: (v: string) => void;
  sharePhone: boolean;
  onShareChange: (v: boolean) => void;
  error?: string;
};

export function PhoneFields({ phone, onPhoneChange, sharePhone, onShareChange, error }: PhoneProps) {
  const c = useThemeColors();
  return (
    <View className="gap-space-3">
      <TextField
        label="Phone (optional)"
        placeholder="858 555 0100"
        hint="Only co-riders can see it, and only if you share it."
        error={error}
        value={phone}
        onChangeText={onPhoneChange}
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
      />
      <View className="min-h-control-md flex-row items-center justify-between gap-space-3">
        <Text className="type-body flex-1 text-ink">Share with my co-riders</Text>
        <Switch
          value={sharePhone}
          onValueChange={onShareChange}
          trackColor={{ true: c.sky, false: c.mistDeep }}
          thumbColor={c.surface}
          ios_backgroundColor={c.mistDeep}
          accessibilityLabel="Share my phone with my co-riders"
        />
      </View>
      {!sharePhone && (
        <Text className="type-body-sm text-ink-muted">Off: co-riders see “hasn’t shared a number”.</Text>
      )}
    </View>
  );
}
