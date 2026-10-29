/**
 * The only place that reads process.env. Expo inlines EXPO_PUBLIC_* at bundle time, so these
 * values ship inside the app: never put a secret here (the service-role key stays server-side).
 * Values come from .env (copy .env.example). Supabase isn't wired up until Phase 2, so missing
 * values are allowed for now and checked where they're used.
 */
export const env = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabasePublishableKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '',
} as const;
