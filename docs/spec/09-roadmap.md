# FlyTag spec — Build phases, metrics, open questions, understanding plan

> Part of `docs/spec/`. Section numbers (§) are global across files; see `README.md` for the index.

## 13. Roadmap (build order)

Sizes: S ≈ a few sessions, M ≈ a week of part-time work, L ≈ two-plus weeks. Each phase ends with its exit criteria met and merged to `main`.

| Phase | Goal | Key tasks | Exit criteria | Size |
|---|---|---|---|---|
| **0. Foundations** | Repo that builds on both platforms | Create accounts; `create-expo-app` (TypeScript); folder skeleton (§4); ESLint/Prettier, path aliases, import boundaries; NativeWind; `build-tokens` script; fonts; `.env` + `env.ts`; CI skeleton; `CLAUDE.md` | Dev build runs on an iPhone and an Android device showing a token-styled screen in both themes; CI green | M |
| **1. Design system** | All `ui/` primitives | Port components in this order: GlassView, Backdrop, Icon (+codegen), Button, IconButton, TextField, Tag, Avatar/AvatarStack, SegmentedControl, RideCard, RiderRow, SeatStepper, Timeline, ChatBubble, ChatComposer, AppHeader, TabBar, Fab, Menu, ContentCard, Plane; `/dev/ui` gallery | Every component passes §5.4; screenshots of the gallery match the artifact | L |
| **2. Backend core + auth** | Users can sign in | Supabase local; migrations for colleges, profiles, profile_private; domain hook; user-created trigger; seed; type gen; Welcome, Sign in, Verify, Onboarding; AuthProvider + `Stack.Protected` gating | Non-UCSD email rejected server-side; new user lands in tabs after onboarding; pgTAP tests for profile RLS | M |
| **3. Rides** | Browse and post | rides + ride_members migrations; `list_rides`, `create_ride`; Rides tab with segmented control, infinite list, empty states; Post-ride sheet | Two accounts see each other's rides; past rides hidden; tests for create validation | M |
| **4. Ride detail + membership** | Join/leave safely | `join_ride`, `leave_ride`, `update_ride`, `cancel_ride`, `get_rider_contact`; detail screen, timeline logic, riders panel, rider profile, fare share | Last-seat race test passes; host handoff works; call button rules enforced | M |
| **5. Chat** | Coordinate in-app | messages + `my_chats`; realtime subscription; optimistic send; Chats tab; system messages; rate limit | Messages appear live on a second device; non-members can't read via API | M |
| **6. Notifications** | Bring people back | push_tokens, notifications; triggers; pg_cron reminders; `push` Edge Function + webhook; permission prompt after first join/post (not at launch); deep links; Alerts tab; settings screen | Real-device push for join, message (collapsed), change, cancel, reminder; disabled types don't send | M |
| **7. Profile + safety** | Store-ready trust features | Profile edit, avatar upload, theme switch, sign out; report, block, delete account | Blocked users invisible both ways; account deletion removes auth user and avatar | M |
| **8. Hardening + beta** | Ship to testers | Sentry; offline banner; accessibility pass; Maestro flows; staging project; app icon/splash; privacy policy + store listings; TestFlight + Play internal testing; reviewer account | 10–20 UCSD testers complete the core loop; crash-free sessions tracked | M |
| **9. Post-v1** | Smarter matching | Flight number/time input; "rides near your flight" suggestions (SQL time-window first, then an AI ranking service if needed); fare splitting via payment links; UCSD SSO; multi-campus | — | — |

**Suggested Claude Code workflow per phase:** start a fresh session, use plan mode, point it at the phase row and the relevant spec sections, have it write migrations + tests before UI, then run `typecheck`, `lint`, `test`, and `supabase test db` before committing. A phase isn't done until its comprehension gate (§17.3) is passed.

---

## 14. Success metrics (instrument in Phase 8)

- **North star:** matched rides per week (rides that reach ≥ 2 riders before departure).
- Activation: % of new users who post or join a ride within 7 days.
- Match rate: % of posted rides that reach ≥ 2 riders; median time-to-match.
- Chat engagement: % of matched rides with ≥ 1 message from a non-host.
- Safety: reports per 100 rides (watch, don't optimise blindly).

Use a privacy-light analytics tool (e.g., PostHog) or simple Postgres counts at first; don't add tracking SDKs before beta.

---

## 15. Open questions **[DECIDE]**

1. ~~Ride timeline: 3 steps or 4?~~ **Decided (Phase 4):** 4 steps, Posted → Matched → Meet → At SAN / At campus (`rideTimeline`).
2. The PDF chat had "Location / Other" tabs; the artifact dropped them. Replace with a pinned `meet_spot` on the ride (current spec) or keep tabs?
3. ~~Fare share: divide by current riders or by max seats?~~ **Decided (Phase 4):** current riders, rounded up to whole dollars (`fareShareDollars`).
4. ~~Should a user be allowed in two overlapping rides (same direction, within ~2 h)?~~ **Decided (Phase 3):** allowed, but Post a ride suggests joinable rides within ±60 min ("Ride together instead?", `nearby_rides`).
5. ~~Day separators in the rides list?~~ **Decided (Phase 3):** yes, sticky San Diego day headers (Today / Tomorrow / Tue 3/18).
6. When someone blocks a co-rider, remove either from the shared upcoming ride, or only hide chat?
7. ~~Intent tag per profile only, or choosable per ride when joining?~~ **Decided (Phase 4):** chosen per ride when joining, defaulting to the profile tag (`join_ride(p_intent)`).
8. App Review login approach (§12.3).
9. Should "To campus" rides capture a flight number from day one to set up Phase 9 matching?

---

## 17. Understanding plan (you own the code, not just the app)

Goal: at the end of v1 you can **draw the schema from memory, trace any button tap to the database and back, and explain every RLS policy and RPC in plain English.** That doesn't happen automatically when an AI writes most of the code, so it's built into the process.

### 17.1 Three rules for every Claude Code session

1. **Explain before writing.** For any new migration, RPC, hook pattern, or library, Claude explains the approach in plain language and you approve it (plan mode) before code is written.
2. **You write the load-bearing pieces.** Use Claude Code's **Learning** output style (set `outputStyle` in `.claude/settings.local.json` or via `/config`) for the phases below; it leaves `TODO(human)` markers for you to implement. Switch to **Explanatory** or Default for repetitive UI work.
3. **Nothing merges that you can't explain.** End each phase with the comprehension gate (§17.3) and a few lines in `docs/LEARNING_LOG.md`.

### 17.2 What you write yourself vs. what Claude writes

| You write (with Claude reviewing) | Claude writes (you review) |
|---|---|
| First migration (`profiles`) incl. its RLS policies and one pgTAP test | Later tables that follow the same pattern |
| `join_ride` RPC (the lock + seat count) | `leave_ride`, `update_ride`, `cancel_ride` |
| `rides.api.ts` + `useRides` / `useJoinRide` (the first api→hook chain) | The same chain for chat, profile, notifications |
| `rides.logic.ts` timeline function + its tests | Other pure helpers |
| The realtime subscription in `chat.hooks.ts` | Notification trigger SQL (you trace it in 17.3) |
| `Button` and `RideCard` in `ui/` | The rest of the design-system port |

### 17.3 Comprehension gates (answer without looking, then check)

| Phase | You can… |
|---|---|
| 0 | Explain what Expo, a dev build, EAS, and Metro each do; run the app on both platforms from a clean clone |
| 1 | Explain how a token in `tokens.json` becomes a colour on screen; add a new Button variant yourself |
| 2 | Draw the sign-in sequence (app → Supabase Auth → hook → trigger → profiles); say why phone lives in `profile_private` |
| 3 | Trace "tap Post ride" through route → component → hook → api → RPC → tables → cache invalidation |
| 4 | Explain why `join_ride` locks the row, and what would break without it; write a pgTAP test for a new rule |
| 5 | Explain how a message reaches another phone live, and what happens if the app was backgrounded |
| 6 | Trace a notification from a row insert to a lock-screen banner, naming every hop |
| 7 | Explain what blocking hides, which policies enforce it, and what account deletion removes |
| 8 | Redraw `docs/SCHEMA.md`'s diagram from memory; read any file in `src/` and say where its data comes from |

A quick way to run a gate: ask Claude (in chat or Claude Code) to quiz you on that phase's files, without showing answers until you've tried.

### 17.4 Code-level habits that keep it readable

- Comments explain **why**, not what. Every RPC step is numbered; every policy has an English name.
- No clever abstractions in v1: no generic "repository" layer, no custom hook factories, no HOCs. Duplicate twice before abstracting.
- Each `index.ts` starts with a 3-line summary of the feature.
- Keep `docs/SCHEMA.md` updated in the same PR as any migration (CI can check that a migration PR also touches it).
