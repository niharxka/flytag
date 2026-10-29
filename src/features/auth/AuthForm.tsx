import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { errorMessage } from '@/lib/errors';
import { Backdrop, Button, GlassView, IconButton, TextField } from '@/ui';

import { useSendCode } from './auth.hooks';
import { signInSchema, signUpSchema, type AuthFormInput, type AuthFormValues } from './auth.schemas';

type Mode = 'sign-up' | 'sign-in';

// The two screens differ only in wording, the name field and where "switch" goes.
const COPY = {
  'sign-up': {
    eyebrow: 'Welcome to FlyTag',
    title: 'Sign up',
    switchPrompt: 'Already have an account?',
    switchLabel: 'Sign in',
    switchTo: '/sign-in',
  },
  'sign-in': {
    eyebrow: 'Welcome back',
    title: 'Sign in',
    switchPrompt: 'New here?',
    switchLabel: 'Sign up',
    switchTo: '/sign-up',
  },
} as const;

/**
 * Screen 02 (§9.2): Sign up (email + display name, creates the account) or Sign in (email
 * only, existing accounts). Both email a code and go to Verify.
 */
export function AuthForm({ mode }: { mode: Mode }) {
  const copy = COPY[mode];
  const signUp = mode === 'sign-up';
  const sendCode = useSendCode();
  const { control, handleSubmit, formState } = useForm<AuthFormInput, unknown, AuthFormValues>({
    resolver: zodResolver(signUp ? signUpSchema : signInSchema),
    defaultValues: { email: '', displayName: '' },
  });

  // Both screens sit under Welcome; with no history (redirect, reload) go there instead of nowhere.
  const back = () => (router.canGoBack() ? router.back() : router.replace('/welcome'));

  const onSubmit = handleSubmit((values) =>
    sendCode.mutate(
      // Sign in never sends a name, so it can never create an account by accident.
      { email: values.email, displayName: signUp ? values.displayName : undefined },
      { onSuccess: () => router.push({ pathname: '/verify', params: { email: values.email } }) },
    ),
  );

  // Errors about the address (wrong domain, no account) belong under the email field;
  // anything else (network, rate limit) is general.
  const serverError = sendCode.error ? errorMessage(sendCode.error) : undefined;
  const isEmailError = serverError?.includes('@ucsd.edu') || serverError?.includes('No account');
  const emailServerError = isEmailError ? serverError : undefined;
  const generalError = serverError && !isEmailError ? serverError : undefined;

  return (
    <Backdrop>
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
          {/* grow lets the content fill the screen so justify-center can centre it; it still
              scrolls when the keyboard leaves less room than the form needs. */}
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="grow pb-space-6">
            {/* Always shown: canGoBack() is false after a redirect or reload, which used to hide it. */}
            <View className="items-start px-space-4 pt-space-5">
              <IconButton icon="chevron-left" label="Go back" variant="glass" size="sm" onPress={back} />
            </View>
            <View className="flex-1 justify-center gap-space-5 py-space-5">
              <View className="items-center px-space-4">
                <Text className="type-label mb-space-1 text-center text-ink-muted">{copy.eyebrow}</Text>
                <Text
                  className="type-title-xl text-center text-ink"
                  accessibilityRole="header"
                  maxFontSizeMultiplier={1.2}
                >
                  {copy.title}
                </Text>
              </View>
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
                      returnKeyType={signUp ? 'next' : 'go'}
                      onSubmitEditing={signUp ? undefined : () => onSubmit()}
                      variant="glass"
                    />
                  )}
                />
                {signUp && (
                  <Controller
                    control={control}
                    name="displayName"
                    render={({ field }) => (
                      <TextField
                        label="Display name"
                        placeholder="What riders call you"
                        hint="This is the name riders see."
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
                )}
                {generalError && (
                  <Text className="type-body-sm text-center text-danger" accessibilityRole="alert">
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
              <View className="flex-row items-center justify-center gap-space-1">
                <Text className="type-body-sm text-ink-muted">{copy.switchPrompt}</Text>
                {/* replace, not push: flipping between the two shouldn't pile up screens. */}
                <Button variant="ghost" onPress={() => router.replace(copy.switchTo)}>
                  {copy.switchLabel}
                </Button>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Backdrop>
  );
}
