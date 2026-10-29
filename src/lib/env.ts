/**
 * The only place that reads process.env. Expo inlines EXPO_PUBLIC_* at bundle time, so these
 * values ship inside the app: never put a secret here (the service-role key stays server-side).
 * Values come from .env (see .env.example).
 */
function required(name: string, value: string | undefined): string {
  if (!value)
    throw new Error(`${name} is missing. Copy .env.example to .env and fill it in, then restart Expo.`);
  return value;
}

export const env = {
  supabaseUrl: required('EXPO_PUBLIC_SUPABASE_URL', process.env.EXPO_PUBLIC_SUPABASE_URL),
  supabasePublishableKey: required(
    'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  ),
} as const;
