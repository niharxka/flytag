# 0006 · Sign in with Google (UCSD accounts) for the public app

**Status:** accepted (2026-10-29). Supersedes the email-code choice in spec §2.5 for production.

**Decision.** The public app signs in with "Continue with Google", limited to UCSD accounts
(UCSD student email is Google Workspace). Email codes stay for development builds only, against
the local stack and Mailpit, for the demo accounts.

**Why.** Codes need a real email service in production: Supabase's built-in sender is for
testing, and on the free plan won't use custom templates. Google needs no email at all, is
free, and students sign in with an account (and Duo) they already use. After the first sign-in
FlyTag keeps its own long-lived session, so Duo appears only on sign-in, not on every open.

**How it's enforced.** `hd=ucsd.edu` only filters Google's account picker. The real gate is
still the `before_user_created` hook (`hook_restrict_signup_to_ucsd`), which runs for Google
sign-ups too. Checked on the hosted project: a gmail.com sign-up is refused with "Use your
@ucsd.edu email."

**How it works.** PKCE flow. Web: browser goes to Google, returns to `/auth/callback`, and
supabase-js swaps the code for a session (`detectSessionInUrl` on web only). Phones: Google
opens in an in-app browser (`openAuthSessionAsync`); the app exchanges the returned code.
New accounts are named by their Google first name (migration 20261104000001).

**Set in the Supabase dashboard, not in config.toml** (free plan blocks `config push` while
the email templates are declared): Google provider (client ID + secret), Site URL and redirect
URLs, and the Before User Created hook. Google Cloud project `flytag-28900` holds the OAuth
client; its redirect URI is the project's `/auth/v1/callback`. When the site is hosted, add its
address to Site URL / Redirect URLs.

**Limits.** Google only redirects to https or localhost, so Google sign-in can't be tested on a
phone against the Mac's local stack; use the hosted project (or email codes in dev).
