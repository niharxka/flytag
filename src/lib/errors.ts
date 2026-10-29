/**
 * Turn errors from Supabase into copy a rider can act on (CLAUDE.md: RPC error codes → user
 * copy live here). Auth errors carry a `code` (e.g. "otp_expired") and an HTTP `status`.
 * Unknown errors get a generic line; the original stays in the console for debugging.
 */
type MaybeAuthError = { code?: string; status?: number; message?: string; name?: string };

const AUTH_COPY: Record<string, string> = {
  otp_expired: 'That code is wrong or has expired. Check the latest email, or send a new code.',
  over_email_send_rate_limit: 'Too many codes sent. Wait a minute, then try again.',
  over_request_rate_limit: 'Too many tries. Wait a minute, then try again.',
  email_address_invalid: 'That doesn’t look like an email address.',
  validation_failed: 'That doesn’t look like an email address.',
};

export function errorMessage(error: unknown): string {
  const e = (error ?? {}) as MaybeAuthError;

  // The signup hook's own message ("Use your @ucsd.edu email.") is already user copy.
  if (e.message?.includes('@ucsd.edu')) return e.message;
  if (e.code && AUTH_COPY[e.code]) return AUTH_COPY[e.code];
  if (e.status === 429) return AUTH_COPY.over_request_rate_limit;
  // fetch throws a TypeError when the phone can't reach the server at all.
  if (e.name === 'TypeError' || e.message === 'Network request failed') {
    return 'Can’t reach FlyTag. Check your connection and try again.';
  }

  if (__DEV__) console.warn('Unmapped error', error);
  return 'Something went wrong. Try again.';
}
