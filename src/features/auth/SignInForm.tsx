import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { errorMessage } from '@/lib/errors';
import { AppHeader, Backdrop, Button, GlassView, TextField } from '@/ui';

import { useSendCode } from './auth.hooks';
import { signInSchema, type SignIn, type SignInInput } from './auth.schemas';

/** Screen 02 (§9.2): email + optional display name → we email a code → Verify. */
export function SignInForm() {
  const sendCode = useSendCode();
  const { control, handleSubmit, formState } = useForm<SignInInput, unknown, SignIn>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', displayName: '' },
  });

  const onSubmit = handleSubmit((values) =>
    sendCode.mutate(values, {
      onSuccess: () => router.push({ pathname: '/verify', params: { email: values.email } }),
    }),
  );

  // A rejected domain is about the email field; anything else (network, rate limit) is general.
  const serverError = sendCode.error ? errorMessage(sendCode.error) : undefined;
  const emailServerError = serverError?.includes('@ucsd.edu') ? serverError : undefined;
  const generalError = serverError && !emailServerError ? serverError : undefined;

  return (
    <Backdrop>
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="pb-space-6">
            <AppHeader
              eyebrow="Welcome to FlyTag"
              title="Sign in"
              onBack={router.canGoBack() ? () => router.back() : undefined}
              trailing={null}
            />
            <GlassView className="mx-space-4 gap-space-4 rounded-lg p-space-5">
              <Controller
                control={control}
                name="email"
                render={({ field }) => (
                  <TextField
                    label="School email"
                    placeholder="you@ucsd.edu"
                    hint="Use your @ucsd.edu email."
                    error={formState.errors.email?.message ?? emailServerError}
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    textContentType="emailAddress"
                    returnKeyType="next"
                    variant="glass"
                  />
                )}
              />
              <Controller
                control={control}
                name="displayName"
                render={({ field }) => (
                  <TextField
                    label="Display name"
                    placeholder="What riders call you"
                    hint="New here? This is the name riders see."
                    error={formState.errors.displayName?.message}
                    value={field.value ?? ''}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    autoComplete="given-name"
                    textContentType="givenName"
                    returnKeyType="go"
                    onSubmitEditing={() => onSubmit()}
                    variant="glass"
                  />
                )}
              />
              {generalError && (
                <Text className="type-body-sm text-danger" accessibilityRole="alert">
                  {generalError}
                </Text>
              )}
              <Button
                variant="primary"
                size="lg"
                block
                loading={sendCode.isPending}
                onPress={() => onSubmit()}
              >
                Let’s go
              </Button>
            </GlassView>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Backdrop>
  );
}
