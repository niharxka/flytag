# 0004 · Local Supabase for development; how sign-in is wired

**Status:** accepted, Phase 2 (2026-10-29)

- **Dev backend is local.** `supabase start` runs everything in Docker on the Mac. The phone
  (Expo Go) reaches it at the Mac's Wi-Fi IP, set in `.env` (127.0.0.1 would be the phone
  itself). Phone and Mac must share a network. A hosted project comes before beta (§12.1);
  switching is two `.env` lines.
- **Codes, not links.** `supabase/templates/otp.html` replaces both the confirmation and magic-
  link emails with the 6-digit `{{ .Token }}`. Locally, emails land in Mailpit. Expiry 10 min.
  The local email rate limit is raised to 60/hour; the hosted project will need real SMTP.
- **UCSD gate on the server.** `before_user_created` hook → `hook_restrict_signup_to_ucsd`.
  The client check (`auth.schemas.ts`) only gives a friendlier error sooner.
- **Session** in AsyncStorage with `processLock`, refresh tied to AppState (Supabase's Expo
  guide). Not encrypted at rest; revisit if we ever store more than the session.
- **Onboarding without an RPC.** Two single-row, owner-only updates (`profile_private`, then
  `profiles`), not `complete_onboarding()`. No rule spans both rows, both are safe to retry, and
  `onboarded_at` is written last so a half-finished save leaves you on the onboarding screen.
- **Column grants** limit what the app can update on `profiles`/`profile_private`; RLS limits
  which rows. Both are tested in `supabase/tests/`.
