import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch } from 'react-hook-form';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { errorMessage } from '@/lib/errors';
import { useThemeColors } from '@/theme/useThemeMode';
import { AppHeader, Backdrop, Button, Menu, SegmentedControl, TextField } from '@/ui';

import { useColleges, useCompleteOnboarding } from './profile.hooks';
import { INTENTS, onboardingSchema, type Onboarding, type OnboardingInput } from './profile.schemas';

const INTENT_LABELS = ['None', 'Networking', 'FlyPal'];

/** Screen 02c (§9.3): home college (required), intent tag and phone (optional). */
export function OnboardingForm({ userId }: { userId: string }) {
  const c = useThemeColors();
  const colleges = useColleges();
  const complete = useCompleteOnboarding(userId);
  const { control, handleSubmit, formState } = useForm<OnboardingInput, unknown, Onboarding>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { collegeId: '', intent: 'none', phone: '', sharePhone: false },
  });
  const onSubmit = handleSubmit((values) => complete.mutate(values));
  const sharePhone = useWatch({ control, name: 'sharePhone' });

  return (
    <Backdrop>
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerClassName="gap-space-5 px-space-4 pb-space-6"
          >
            <View className="-mx-space-4">
              <AppHeader eyebrow="One last step" title="About you" trailing={null} />
            </View>

            <View className="gap-space-2">
              <Text className="type-label text-ink-muted">Home college</Text>
              {colleges.isPending ? (
                <ActivityIndicator color={c.inkMuted} accessibilityLabel="Loading colleges" />
              ) : colleges.isError ? (
                <View className="gap-space-2">
                  <Text className="type-body-sm text-danger" accessibilityRole="alert">
                    {errorMessage(colleges.error)}
                  </Text>
                  <Button variant="secondary" onPress={() => colleges.refetch()}>
                    Try again
                  </Button>
                </View>
              ) : (
                <Controller
                  control={control}
                  name="collegeId"
                  render={({ field }) => (
                    <Menu
                      label="Home college"
                      items={colleges.data.map((col) => ({ label: col.name }))}
                      active={colleges.data.findIndex((col) => col.id === field.value)}
                      onSelect={(i) => field.onChange(colleges.data[i].id)}
                    />
                  )}
                />
              )}
              {formState.errors.collegeId && (
                <Text className="type-body-sm text-danger">{formState.errors.collegeId.message}</Text>
              )}
            </View>

            <View className="gap-space-2">
              <Text className="type-label text-ink-muted">Your tag (optional)</Text>
              <Controller
                control={control}
                name="intent"
                render={({ field }) => (
                  <SegmentedControl
                    label="Your tag"
                    options={INTENT_LABELS}
                    value={INTENTS.indexOf(field.value)}
                    onChange={(i) => field.onChange(INTENTS[i])}
                  />
                )}
              />
              <Text className="type-body-sm text-ink-muted">
                Shown next to your name. Networking: up for talking shop. FlyPal: happy to share the ride.
              </Text>
            </View>

            <View className="gap-space-3">
              <Controller
                control={control}
                name="phone"
                render={({ field }) => (
                  <TextField
                    label="Phone (optional)"
                    placeholder="858 555 0100"
                    hint="Only co-riders can see it, and only if you share it."
                    error={formState.errors.phone?.message}
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    textContentType="telephoneNumber"
                  />
                )}
              />
              <Controller
                control={control}
                name="sharePhone"
                render={({ field }) => (
                  <View className="min-h-control-md flex-row items-center justify-between gap-space-3">
                    <Text className="type-body flex-1 text-ink">Share with my co-riders</Text>
                    <Switch
                      value={field.value}
                      onValueChange={field.onChange}
                      trackColor={{ true: c.sky, false: c.mistDeep }}
                      thumbColor={c.surface}
                      ios_backgroundColor={c.mistDeep}
                      accessibilityLabel="Share my phone with my co-riders"
                    />
                  </View>
                )}
              />
              {!sharePhone && (
                <Text className="type-body-sm text-ink-muted">
                  Off: co-riders see “hasn’t shared a number”. You can change this later.
                </Text>
              )}
            </View>

            {complete.error && (
              <Text className="type-body-sm text-danger" accessibilityRole="alert">
                {errorMessage(complete.error)}
              </Text>
            )}
            <Button variant="primary" size="lg" block loading={complete.isPending} onPress={() => onSubmit()}>
              Finish setup
            </Button>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Backdrop>
  );
}
