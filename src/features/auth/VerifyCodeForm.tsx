import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { errorMessage } from '@/lib/errors';
import { AppHeader, Backdrop, Button, CodeField } from '@/ui';

import { useSendCode, useVerifyCode } from './auth.hooks';
import { CODE_LENGTH } from './auth.schemas';

// Supabase also limits how often a code can be sent; waiting 60 s keeps us under it (§9.2).
const RESEND_AFTER_S = 60;

/** Screen 02b (§9.2): type or paste the emailed code. A full code submits by itself. */
export function VerifyCodeForm({ email }: { email: string }) {
  const verify = useVerifyCode();
  const resend = useSendCode();
  const [code, setCode] = useState('');
  const [wait, setWait] = useState(RESEND_AFTER_S);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const onChange = (digits: string) => {
    setCode(digits);
    if (verify.isError) verify.reset();
    // On success there's nothing to do here: the new session flips the route guards.
    if (digits.length === CODE_LENGTH) verify.mutate({ email, code: digits }, { onError: () => setCode('') });
  };

  const onResend = () => resend.mutate({ email }, { onSuccess: () => setWait(RESEND_AFTER_S) });

  return (
    <Backdrop>
      <SafeAreaView className="flex-1">
        <AppHeader
          eyebrow="Check your email"
          title="Enter code"
          onBack={() => router.back()}
          trailing={null}
        />
        <View className="gap-space-5 px-space-4">
          <Text className="type-body text-ink">
            We sent a 6-digit code to <Text className="font-600">{email}</Text>.
          </Text>
          <CodeField
            value={code}
            onChangeText={onChange}
            autoFocus
            editable={!verify.isPending}
            error={verify.error ? errorMessage(verify.error) : undefined}
          />
          {resend.error && (
            <Text className="type-body-sm text-danger" accessibilityRole="alert">
              {errorMessage(resend.error)}
            </Text>
          )}
          <View className="gap-space-2">
            <Button
              variant="secondary"
              block
              disabled={wait > 0}
              loading={resend.isPending}
              onPress={onResend}
            >
              {wait > 0 ? `Send a new code in ${wait} s` : 'Send a new code'}
            </Button>
            <Button variant="ghost" block onPress={() => router.back()}>
              Use a different email
            </Button>
          </View>
          {__DEV__ && (
            <Text className="type-caption text-center text-ink-muted">
              Local dev: codes arrive in Mailpit, http://127.0.0.1:54324 on your Mac.
            </Text>
          )}
        </View>
      </SafeAreaView>
    </Backdrop>
  );
}
