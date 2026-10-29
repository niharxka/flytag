/**
 * Turn errors from Supabase into copy a rider can act on (CLAUDE.md: RPC error codes → user
 * copy live here). Auth errors carry a `code` (e.g. "otp_expired") and an HTTP `status`;
 * RPC errors carry our code (e.g. "INVALID_TIME") as the message.
 * Unknown errors get a generic line; the original stays in the console for debugging.
 */
type MaybeAuthError = { code?: string; status?: number; message?: string; name?: string };

const AUTH_COPY: Record<string, string> = {
  otp_expired: 'That code is wrong or has expired. Check the latest email, or send a new code.',
  over_email_send_rate_limit: 'Too many codes sent. Wait a minute, then try again.',
  over_request_rate_limit: 'Too many tries. Wait a minute, then try again.',
  email_address_invalid: 'That doesn’t look like an email address.',
  validation_failed: 'That doesn’t look like an email address.',
  // Sign in sends shouldCreateUser: false, so an unknown email comes back as this.
  otp_disabled: 'No account for that email yet. Sign up instead.',
};

// RPC errors: our SQL functions raise the code as the message (see each migration's header).
const RPC_COPY: Record<string, string> = {
  NOT_ONBOARDED: 'Finish setting up your profile first.',
  INVALID_TIME: 'Pick a time in the future, up to 90 days out.',
  INVALID_SEATS: 'A ride has 2 to 6 seats (including the host), and never fewer than the people in it.',
  INVALID_DETAILS: 'Check the fare, meet spot and notes, then try again.',
  RIDE_FULL: 'This ride just filled up.',
  RIDE_NOT_ACTIVE: 'This ride was cancelled.',
  RIDE_DEPARTED: 'This ride has already left.',
  RIDE_NOT_FOUND: 'This ride isn’t available any more.',
  ALREADY_MEMBER: 'You’re already in this ride.',
  NOT_MEMBER: 'You’re not in this ride any more.',
  NOT_HOST: 'Only the host can do that.',
  NOT_ALLOWED: 'Their number isn’t available.',
  RATE_LIMITED: 'You’re sending messages too fast. Wait a moment.',
};

export function errorMessage(error: unknown): string {
  const e = (error ?? {}) as MaybeAuthError;

  if (e.message && RPC_COPY[e.message]) return RPC_COPY[e.message];

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
