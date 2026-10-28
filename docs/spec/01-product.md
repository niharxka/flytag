# FlyTag spec — Product scope, screens, glossary

> Part of `docs/spec/`. Section numbers (§) are global across files; see `README.md` for the index.

## 1. Product summary

FlyTag lets UC San Diego students coordinate shared rides to and from San Diego International Airport (SAN) with verified classmates.

**Core loop:** sign in with a UCSD email → browse rides by direction and time → join one or post your own → coordinate in the ride's group chat → get reminded and meet up.

### 1.1 MVP scope (v1)

| Area | In v1 | Not in v1 |
|---|---|---|
| Auth | UCSD-only email sign-in with a 6-digit code, display name, home college | UCSD SSO, phone auth, social login |
| Rides | List by direction, post a ride, ride detail, join / leave, seat limits, full rides stay visible | Recurring rides, flight-number lookup, maps |
| People | Rider rows with college + intent tag, optional phone sharing to co-riders only, rider profile view | Ratings, friends, verification badges beyond email |
| Chat | Per-ride group chat, realtime, text only | Images, reactions, DMs |
| Notifications | Push + in-app Alerts: someone joined, new message, ride changed/cancelled, 2-hour reminder | Email/SMS notifications |
| Safety | Report user/message, block user, delete account | Moderation dashboard (use Supabase dashboard) |
| Money | Optional estimated total fare → shown as per-person share | Payments, splitting via Venmo/Stripe |
| Platform | iOS + Android phones, light (Mist) + dark (Charcoal) themes | Tablet layouts, web app |

### 1.2 Screen inventory (from the Brand System's six screens + the PDF)

| # | Screen | Route | Key components |
|---|---|---|---|
| 01 | Welcome | `/(auth)/welcome` | `Backdrop tone="sky"`, `Plane animate="glide"`, display "FlyTag.", glass `Button` "Get started" |
| 02 | Sign in | `/(auth)/sign-in` | `AppHeader`, glass panel, `TextField` ×2 (School email, Display name), primary `Button` "Let's go" |
| 02b | Verify code | `/(auth)/verify` | 6-digit code field, resend timer *(new — needed for OTP)* |
| 02c | Onboarding | `/(auth)/onboarding` | Home college picker, intent tag (Networking / FlyPal), optional phone *(new)* |
| 03 | Rides | `/(app)/(tabs)/index` | `AppHeader` "UCSD", `SegmentedControl` (To airport / To campus), `RideCard` list, `Fab` "Post a ride", `TabBar` |
| 04 | Post a ride | `/(app)/rides/new` (form sheet) | `BottomSheet`, Date, "Leave campus at", `SeatStepper` "Max riders", Cancel / Post ride |
| 05 | Ride detail | `/(app)/rides/[rideId]` | `AppHeader` (date · host, title = time), `Timeline`, Riders panel (`RiderRow` ×n, `Button sky` "Join ride"), Chat panel (`ChatBubble`, `ChatComposer`) |
| 05b | Rider profile | `/(app)/riders/[userId]` | `Avatar`, name, college + intent `Tag`s *(PDF screen "Jake")* |
| 06 | Profile | `/(app)/(tabs)/profile` | `Avatar` 88, `Tag`s, `Menu` (Display name, School email, Home college, Notifications, Safety & reporting) |
| — | Chats tab | `/(app)/(tabs)/chats` | List of rides you're in, last message |
| — | Alerts tab | `/(app)/(tabs)/alerts` | Notification feed |
| — | Notification settings | `/(app)/settings/notifications` | Toggles per notification type |
| — | Safety & reporting | `/(app)/settings/safety` | Blocked users, how reporting works, delete account |

---

## 16. Glossary

- **Host:** the rider who posted the ride (counts as one seat).
- **Seat:** one person including the host; `seats_max` 2–6.
- **Intent tag:** what a rider is open to on the trip: **Networking** (sky tag) or **FlyPal** (deep atmos tag).
- **Direction:** `to_airport` (UI "To airport") or `to_campus` (UI "To campus").
- **RPC:** a Postgres function called from the app via `supabase.rpc()`.
- **RLS:** Row Level Security, Postgres rules deciding which rows a user can read or write.
