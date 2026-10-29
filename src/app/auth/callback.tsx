import { useLocalSearchParams } from 'expo-router';

import { AuthCallback } from '@/features/auth';

export default function AuthCallbackRoute() {
  // Supabase reports a refused sign-in (e.g. a non-UCSD account) in the return address.
  const { error_description, error } = useLocalSearchParams<{ error_description?: string; error?: string }>();
  return <AuthCallback error={error_description ?? error} />;
}
