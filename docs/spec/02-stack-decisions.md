# FlyTag spec — Why each technology was chosen + architecture overview (mostly for humans)

> Part of `docs/spec/`. Section numbers (§) are global across files; see `README.md` for the index.

## 2. Tech stack decisions

You've chosen React Native for the UI. Everything below is chosen to (a) keep a solo/small student team shipping, (b) keep the data model relational and private by default, and (c) be easy for Claude Code to work in.

### 2.1 Summary

| Layer | Choice | Runner-up |
|---|---|---|
| App framework | **Expo (managed workflow) + development builds**, TypeScript strict | Bare React Native CLI |
| Navigation | **Expo Router** (file-based) | React Navigation directly |
| Styling | **NativeWind v4** driven by tokens generated from `tokens.json` | Unistyles 3 |
| Glass / gradients / SVG | `expo-blur`, `expo-linear-gradient`, `react-native-svg` | — |
| Animation | `react-native-reanimated` | Animated API |
| Server state | **TanStack Query v5** | SWR |
| Client state | **Zustand** (tiny: UI prefs, drafts) | Context only |
| Forms + validation | **react-hook-form + zod** | Formik + yup |
| Dates | `date-fns` + `date-fns-tz` (all display in `America/Los_Angeles`) | Day.js |
| Backend | **Supabase** (Postgres, Auth, Realtime, Storage, Edge Functions, pg_cron) | Firebase; custom FastAPI |
| Push | **expo-notifications + Expo Push Service**, sent from a Supabase Edge Function | FCM/APNs direct, OneSignal |
| Builds & release | **EAS Build / Submit / Update** | Local Xcode / Gradle only |
| Testing | Jest (`jest-expo`) + React Native Testing Library, pgTAP for RLS, Maestro for E2E | Detox |
| Monitoring | Sentry (`@sentry/react-native`) — add in Phase 8 | Crashlytics |
| CI | GitHub Actions | — |

### 2.2 App framework: Expo vs bare React Native

**Choose Expo.** Expo is now the default way the React Native team recommends starting apps. It gives you file-based routing, over-the-air JS updates, cloud builds (no Mac required for iOS builds), and first-party modules for everything FlyTag needs (notifications, fonts, blur, secure storage, haptics).

- Use **development builds** (`expo-dev-client`), not Expo Go. Push notifications and some native modules need a real build, and new SDKs reach Expo Go later than they reach dev builds.
- **[VERIFY]** Start on the latest SDK (SDK 58 shipped 2026-10-21 with React Native 0.88). If NativeWind or another key library hasn't caught up yet, pin to SDK 57 and upgrade in a later phase with `npx expo install expo@^58 --fix && npx expo-doctor`.
- New Architecture is on by default; don't turn it off.

### 2.3 Backend: Supabase vs Firebase vs a custom Python API

| | Supabase | Firebase | Custom (FastAPI + Postgres + SQLAlchemy + Redis + Docker) |
|---|---|---|---|
| Data model | Postgres: relational, joins, transactions, constraints | Firestore documents; joins done in client | Postgres, full control |
| Seat-count race conditions | One SQL function with a row lock | Firestore transactions (workable) | You write it |
| Privacy rules | Row Level Security in SQL, testable with pgTAP | Security Rules language | You write middleware |
| Auth | Email OTP built in; `before-user-created` hook can restrict to `@ucsd.edu` | Email link / custom; domain check in Cloud Function | You build or bring Auth0/Clerk |
| Realtime chat | Realtime (Postgres changes, respects RLS) | Best-in-class listeners + offline cache | Websockets + Redis pub/sub you run |
| Push | Not built in → Edge Function calls Expo Push | FCM built in | You run it |
| Ops burden | Low (hosted; local stack via CLI + Docker) | Low | High: hosting, scaling, auth, sockets, migrations |
| Lock-in | Low (it's Postgres; self-hostable) | High | None |

**Choose Supabase.** FlyTag's data is relational (profiles → rides → members → messages), it needs a hard guarantee that a 4-seat ride never gets a 5th rider, and privacy matters (phone numbers, blocks, signed-in-only visibility). Postgres + RLS handles all of that in one place. Firebase's main edge — offline-first chat — matters less for short-lived ride chats.

**About the custom Python backend (Postgres + SQLAlchemy + Redis + Docker):** keep Postgres (Supabase *is* Postgres, so the schema carries over). Defer the rest. A separate API server adds hosting, auth, and websocket work without adding user value in v1. Docker still shows up: the Supabase CLI runs the local stack in Docker. Revisit a Python service in Phase 9 if AI flight-time matching outgrows Edge Functions (§13).

### 2.4 Styling: NativeWind vs Unistyles vs StyleSheet

- **NativeWind v4 (chosen):** Tailwind classes compiled to native styles; supports CSS variables, so the Mist/Charcoal themes become two sets of variables and components write `bg-surface text-ink`. Largest community, which also means Claude Code produces it reliably.
- **Unistyles 3:** excellent performance and typed themes, needs the New Architecture. Good choice if NativeWind lags the SDK. Swap cost is moderate because tokens are generated in one place either way.
- **Plain StyleSheet:** zero deps, but you'd hand-roll theming.

**Rule regardless of library:** components never use raw hex values or pixel numbers that exist as tokens. Tokens are generated from `docs/design/tokens.json` by `scripts/build-tokens.ts` (§5).

### 2.5 Auth method

- **Update (2026-10-29): production uses Sign in with Google, UCSD accounts only; email codes are dev-only.** See `docs/decisions/0006-google-sign-in.md`.
- **Email OTP (6-digit code), originally chosen.** Codes are typed into the app, so there are no deep-link edge cases (opening the link on a laptop, mail apps' in-app browsers).
- Magic links: avoid in v1 for those reasons.
- UCSD SSO (SAML via the university): best trust signal, but needs university IT approval and a paid Supabase plan **[VERIFY]**. Post-v1.
- Domain restriction is enforced **server-side** with Supabase's `before-user-created` auth hook (a Postgres function checking `@ucsd.edu`), plus a client-side check for a friendly error.

---

## 3. Architecture overview

```
┌──────────────────────── Expo app (iOS / Android) ────────────────────────┐
│  Expo Router screens (src/app)                                            │
│     └─ feature modules (src/features/*): hooks, components, api           │
│          └─ TanStack Query cache ── supabase-js client (src/lib/supabase) │
│  ui/ design system (ported from Brand System) · theme/ generated tokens   │
└───────────────┬─────────────────────────────┬────────────────────────────┘
                │ HTTPS (PostgREST, RPC)       │ WebSocket (Realtime)
┌───────────────▼─────────────────────────────▼────────────────────────────┐
│ Supabase                                                                  │
│  Auth (email OTP, before-user-created hook)                               │
│  Postgres: tables + RLS + RPC functions + triggers + pg_cron              │
│  Realtime: messages, ride_members                                         │
│  Storage: avatars bucket                                                  │
│  Edge Functions: push (Expo Push API), delete-account                     │
└───────────────┬──────────────────────────────────────────────────────────┘
                │ DB webhook on notifications INSERT
                ▼
        Expo Push Service → APNs / FCM → device
```

**Principles**

1. **The database enforces the rules.** Seat limits, membership, who can read what, and rate limits live in Postgres (constraints, RLS, RPCs). The app is a convenient view, not the gatekeeper.
2. **Writes that touch more than one row go through an RPC** (`create_ride`, `join_ride`, `leave_ride`). Plain table writes are only for single-row, owner-only changes (e.g., editing your profile).
3. **Reads go through TanStack Query** with stable query keys; realtime events update or invalidate those caches rather than keeping separate state.
4. **Features are isolated** (§4). Routes are thin.
