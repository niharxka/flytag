import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { errorMessage } from '@/lib/errors';
import { AppHeader, Backdrop, Button, KeyboardScrollView } from '@/ui';

import { HomeLocationField } from './HomeLocationField';
import { useCompleteOnboarding } from './profile.hooks';
import { onboardingSchema, type Onboarding, type OnboardingInput } from './profile.schemas';
import { IntentField, PhoneFields } from './ProfileFields';

/** Screen 02c (§9.3): home (required: a college or somewhere else), tag and phone (optional). */
export function OnboardingForm({ userId }: { userId: string }) {
  const complete = useCompleteOnboarding(userId);
  const { control, handleSubmit, formState } = useForm<OnboardingInput, unknown, Onboarding>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { homeChoice: '', homeLabel: '', intent: 'none', phone: '', sharePhone: false },
  });
  const onSubmit = handleSubmit((values) => complete.mutate(values));

  return (
    <Backdrop>
      <SafeAreaView className="flex-1">
        <KeyboardScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          contentContainerClassName="gap-space-5 px-space-4 pb-space-6"
        >
          <View className="-mx-space-4">
            <AppHeader eyebrow="One last step" title="About you" trailing={null} />
          </View>

          <View className="gap-space-2">
            <Text className="type-label text-ink-muted">Home</Text>
            <Controller
              control={control}
              name="homeChoice"
              render={({ field: choice }) => (
                <Controller
                  control={control}
                  name="homeLabel"
                  render={({ field: label }) => (
                    <HomeLocationField
                      choice={choice.value}
                      onChoiceChange={choice.onChange}
                      label={label.value}
                      onLabelChange={label.onChange}
                      choiceError={formState.errors.homeChoice?.message}
                      labelError={formState.errors.homeLabel?.message}
                    />
                  )}
                />
              )}
            />
          </View>

          <Controller
            control={control}
            name="intent"
            render={({ field }) => <IntentField value={field.value} onChange={field.onChange} />}
          />

          <Controller
            control={control}
            name="phone"
            render={({ field: phone }) => (
              <Controller
                control={control}
                name="sharePhone"
                render={({ field: share }) => (
                  <PhoneFields
                    phone={phone.value}
                    onPhoneChange={phone.onChange}
                    sharePhone={share.value}
                    onShareChange={share.onChange}
                    error={formState.errors.phone?.message}
                  />
                )}
              />
            )}
          />

          {complete.error && (
            <Text className="type-body-sm text-danger" accessibilityRole="alert">
              {errorMessage(complete.error)}
            </Text>
          )}
          <Button variant="primary" size="lg" block loading={complete.isPending} onPress={() => onSubmit()}>
            Finish setup
          </Button>
        </KeyboardScrollView>
      </SafeAreaView>
    </Backdrop>
  );
}
