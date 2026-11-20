# FlyTag spec — Behaviour, states and acceptance criteria per screen

> Part of `docs/spec/`. Section numbers (§) are global across files; see `README.md` for the index.

## 9. Feature specs

Each feature lists behaviour, states, and acceptance criteria (AC). "Empty / loading / error" states are required for every data screen.

### 9.1 Welcome (01)
- Sky backdrop, plane glides in once (2.2 s), "FlyTag." display, lead copy, centred. Two glass buttons: "Get started" → Sign up, "Sign in" → Sign in.
- Shown only when signed out. The session persists on the device and refreshes itself, so riders stay signed in indefinitely (no inactivity sign-out); Welcome is for new users, sign-outs and reinstalls. Reduced motion: plane at rest.
- Secondary glass button "Look around first" opens the tabs as a guest (remembered on the device, cleared on sign-out). When Welcome was opened by a gated action inside the app, it reads "Keep browsing" and goes back.
- **AC:** first launch shows animation once; a signed-out user who hasn't chosen to look around sees Welcome; a guest goes straight to the tabs; signed-in users never see it.

### 9.2 Sign up / sign in + verify (02, 02b)
- Sign up: School email (hint "Use your @ucsd.edu email."), Display name (required). "Let's go" calls `signInWithOtp({ email, options: { shouldCreateUser: true, data: { display_name } } })`.
- Sign in: School email only. Calls `signInWithOtp({ email, options: { shouldCreateUser: false } })`; an unknown email returns `otp_disabled` → "No account for that email yet. Sign up instead."
- Each screen links to the other ("Already have an account? Sign in" / "New here? Sign up").
- Verify screen: 6 cells, auto-advance, paste support, iOS one-time-code autofill (`textContentType="oneTimeCode"`), resend after 60 s, "Use a different email".
- Errors: non-UCSD domain (client + hook), no account (sign in), wrong/expired code, rate-limited.
- **AC:** non-UCSD email can't create an account even by calling the API directly; returning user signs in with just their email; an existing user who uses Sign up still gets a code and keeps their name.

### 9.3 Onboarding (02c)
- Home college (required), intent tag (optional: Networking / FlyPal / none), phone + "Share with my co-riders" toggle (optional, off by default), "How did you hear about FlyTag?" (optional, tap again to clear; saved with the web link's `utm_source` to `profile_private`, §14). Sets `onboarded_at`.
- **AC:** a signed-in user can't reach `(app)` routes until onboarded (guests can, read-only); skipping phone leaves call buttons disabled for others with the accessible reason.

### 9.4 Rides list (03)
- Header: eyebrow "Rides from campus" / "Rides to campus", title "UCSD", avatar → Profile.
- SegmentedControl: "To airport" (plane-depart) / "To campus" (plane-land); selection persists across sessions.
- RideCard: `Tue 3/18 · 11:00 AM`, AvatarStack, `2 of 4 seats` or `Full` (go tag). Rides I'm in use `highlight`. Sorted soonest first; rides that departed > 15 min ago hidden.
- Sticky day separators **[DECIDE]** (helpful once there are many rides).
- FAB "Post a ride" → sheet. Pull to refresh, infinite scroll.
- Empty: ContentCard "No rides yet for this direction" + "Post a ride".
- Guest: cards without avatars (`list_rides_guest`: times and seats only); the header avatar is a "Sign in" button; the FAB and "Post a ride" open Welcome.
- **AC:** list is one network request per page; full rides remain visible; blocked hosts' rides never appear; a guest never receives a name.

### 9.5 Post a ride (04)
- Form sheet: Date, "Leave campus at" (to_airport) / "Meet at SAN at" (to_campus), Max riders stepper (2–6, default 4), optional estimated fare, meet spot and notes, all shown up front (no collapsed section).
- Primary "Post ride", ghost "Cancel". Loading state on submit; on success navigate to the new ride.
- **AC:** can't post a time in the past; poster is automatically the host and counted in seats; double-tap doesn't create two rides (disable while pending + idempotent client request id; **decided Phase 3:** both).

### 9.6 Ride detail (05)
- Header eyebrow `Tue 3/18 · Niharika, Sixth`, title `11:00 AM`, back button.
- Timeline (derived in `features/rides/rides.logic.ts`):
  - **Posted**: done always.
  - **Matching**: current while seats_taken < 2; done once ≥ 2.
  - **Meet**: current from 30 min before `depart_at` until `depart_at`.
  - **At SAN** (to_airport) / **At campus** (to_campus): current after `depart_at`, done after +3 h.
  - (The artifact shows 3 steps, its README lists 4 **[DECIDE]**; logic supports both.)
- Riders panel: section label `Riders · 2 of 4`, RiderRows (avatar, name, college, intent tag, call button live only if phone shared). Tap row → rider profile.
- Per-person fare: if `est_total_cost_cents` set, show "About $X each" based on current seats_taken (or seats_max — **[DECIDE]**).
- After departure, for members of a shared ride (≥ 2 riders): "Did you ride together?" → "Yes, we did" asks for the optional total fare, "No" saves at once (`record_ride_outcome`, §14). Once answered, one muted line repeats the answer. The Rides tab shows the same prompt as a card for the latest unanswered ride that left 1 h–14 days ago; "Not now" hides it until the app is next opened.
- Actions: not member → sky "Join ride" (disabled "Ride full" when full). Member → "Leave ride" (ghost, confirm sheet). Host → overflow menu: Edit ride, Cancel ride.
- Chat panel: visible to members only; non-members see "Join to chat with riders". Newest at bottom, grouped bubbles, system messages centered in `ink-muted`.
- Guest (`get_ride_guest`): eyebrow is the date only; the riders panel becomes `Riders · 2 of 4 seats` + "Sign in to see who's going."; meet spot, fare and notes are hidden; no tag picker; the button reads "Sign in to join" and opens Welcome. Chat panel: "Sign in and join to chat with riders."
- **AC:** two people tapping Join on the last seat → exactly one succeeds, the other sees "This ride just filled up."; new messages appear without refresh; call button opens the dialer via `Linking.openURL('tel:…')` only after `get_rider_contact` succeeds.

### 9.7 Chats tab
- Rides I'm in, sorted by last activity: date · time title, last message preview. Tap → ride detail scrolled to chat. (Unread dots are post-beta, §6.5.)
- Guest: empty state "Your ride chats show up here" + "Sign in".

### 9.8 Alerts tab
- Notification feed grouped Today / Earlier; tap marks read and opens ride. "Mark all read".
- Guest: empty state "Ride updates show up here" + "Sign in".

### 9.9 Profile (06) and settings
- Avatar (tap to change: `expo-image-picker` → resize with `expo-image-manipulator` to 512 px → upload to `avatars/{userId}/…`), name, college tag, intent tag.
- Menu: Display name, School email (Verified, read-only), Home college, Notifications, Safety & reporting, plus Theme (Light / Dark; follows the phone until the user picks one) and Sign out.
- Notification settings: per-type toggles; if OS permission denied, show a row linking to system settings.
- Guest: empty state "Your profile lives here" + "Sign in", and the Theme picker (it's a device setting).

### 9.10 Safety
- Report from rider profile or long-press on a message: reason + optional details → `reports`. Confirmation copy explains what happens next.
- Block from rider profile: hides each other's rides/messages/profiles; you're removed from shared future rides **[DECIDE]**.
- Delete account (Safety screen): confirm sheet → `delete-account` function → sign out.
- **AC:** these exist before App Store submission (user-generated content and account deletion are review requirements **[VERIFY current guidelines]**).
