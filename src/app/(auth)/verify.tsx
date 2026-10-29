import { Redirect, useLocalSearchParams } from 'expo-router';

import { VerifyCodeForm } from '@/features/auth';

export default function VerifyRoute() {
  const { email } = useLocalSearchParams<{ email?: string }>();
  // Opened without an email (e.g. a stale deep link): start over.
  if (!email) return <Redirect href="/sign-in" />;
  return <VerifyCodeForm email={email} />;
}
