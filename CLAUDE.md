@AGENTS.md

## Current constraints
- Until Phase 6, the app runs in Expo Go (SDK 58) on a physical phone. No Xcode, no Android Studio.
  Do not add libraries that need a custom native build. If a task needs one, stop and tell me.
- Never run `npx expo run:ios`, `npx expo run:android`, `npm run ios`, `npm run android`,
  or `npm audit fix --force`. Native builds happen in the cloud with `eas build` starting in Phase 6.
- These constraints override anything in AGENTS.md.

# FlyTag

UCSD students share rides to and from SAN airport. React Native (Expo) app for iOS + Android, Supabase backend.
Spec lives in `docs/spec/` split by topic. Start at `docs/spec/README.md` and read only the files the task needs (never all of them). Database map: `docs/SCHEMA.md`. Brand tokens: `docs/design/tokens.json`. Component anatomy, the six reference screens and the plane: `docs/design/brand-system.md` (from the Brand System artifact). Icons: `assets/icons/*.svg`.



## Stack
- Expo (dev builds from Phase 6 on; Expo Go until then — see Current constraints), Expo Router, TypeScript strict, NativeWind, Reanimated
- TanStack Query (server state), Zustand (UI state only), react-hook-form + zod, date-fns-tz
- Supabase: Postgres + RLS, Auth (email OTP, @ucsd.edu only), Realtime, Storage, Edge Functions (Deno), pg_cron
- Push: expo-notifications → Expo Push API from the `push` Edge Function

## Commands
- `npx expo start --dev-client` — run app against a dev build
- `npm run typecheck` · `npm run lint` · `npm test`
- `npm run db:start` (supabase start) · `npm run db:reset` (reapply migrations + seed) · `npm run db:test` (pgTAP)
- `npm run db:types` — regenerate `src/lib/database.types.ts` after ANY migration
- `npm run tokens` — regenerate `src/theme/tokens.ts` + `global.css` from tokens.json
- Today `package.json` has `start`, `lint`, `typecheck`, `test`, `tokens`, `icons` (assets/icons → `src/ui/icons.generated.ts`), `format`. `db:start`/`db:stop`/`db:reset`/`db:test`/`db:types` run the local Supabase stack (Docker). OTP emails land in Mailpit at http://127.0.0.1:54324. The phone reaches the stack via the Mac's Wi-Fi IP in `.env`. Until Phase 6 use `npx expo start` (Expo Go), not `--dev-client`.

## Architecture rules
- `src/app/` is routes only: compose feature components, read params, nothing else. Keep files short.
- Each feature is a flat folder `src/features/<feature>/` with fixed files: `<feature>.api.ts` (all Supabase calls + query keys), `<feature>.hooks.ts`, `<feature>.schemas.ts`, `<feature>.logic.ts` (+ `.test.ts`), components, `index.ts`. Don't add subfolders until a feature has ~12 files.
- Other code imports a feature only through its `index.ts`. Data flows screen → hook → api → Supabase.
- `src/ui/` is presentational: no Supabase, no TanStack Query, no feature imports.
- Supabase calls only in `*.api.ts`. One client: `src/lib/supabase.ts`. snake_case rows become camelCase in the api file.
- Multi-row writes go through RPCs (`create_ride`, `join_ride`, `leave_ride`, …), never chained client inserts.
- Map RPC error codes to user copy in `src/lib/errors.ts`.

## Database rules
- Schema changes only via new files in `supabase/migrations/` — never edit an applied migration.
- One concept per migration: table + indexes + RLS policies + `comment on` statements in one file, with a header comment (what, why, spec §).
- Policies get plain-English names; RPC bodies get numbered step comments.
- Every new table: pgTAP tests (one allowed, one denied case) in `supabase/tests/`, and update `docs/SCHEMA.md` in the same change.
- Private fields (phone) stay in `profile_private`; expose only through `get_rider_contact`.
- Never put the service-role key in app code or `EXPO_PUBLIC_*` vars.
- Store `timestamptz` (UTC); display in `America/Los_Angeles` via `src/lib/dates.ts`.

## Design system rules
- Tokens only: no hex literals or magic numbers that exist as tokens. Don't edit generated files.
- Palette is cool (mist, sky, atmos, charcoal). `flare` red is for the Plane component only. No pink or warm accents.
- Pill is the default shape. Primary button at most once per screen. Touch targets ≥ 48.
- Copy: sentence case, verb-first buttons ("Join ride"), dates `Tue 3/18 · 11:00 AM`, seats `2 of 4 seats`. No emoji in UI.
- Every interactive element gets `accessibilityLabel`/`accessibilityRole`; respect reduced motion.
- New `ui/` components go in the `/dev/ui` gallery with all variants, in Mist and Charcoal.

## Workflow
- Use plan mode for migrations, RLS, auth, and anything touching more than one feature.
- Order: migration → pgTAP tests → `db:types` → api/hooks → UI.
- Before saying a task is done: `npm run typecheck && npm run lint && npm test` (+ `npm run db:test` if SQL changed).
- Small commits, conventional messages (`feat(rides): add join_ride rpc`).
- If the spec is ambiguous or marked [DECIDE], ask instead of guessing.

## Learning mode (the owner must understand every line)
- Explain the approach in plain language before writing any migration, RPC, new library, or new pattern; wait for approval.
- Comments explain why, not what. No clever abstractions: no generic repository layers, hook factories or HOCs. Duplicate twice before abstracting.
- When the Learning output style is on, leave `TODO(human)` for the load-bearing piece (the lock in an RPC, the first api→hook chain, a timeline rule) rather than writing it.
- After finishing a task, give a short "how this works" summary: files touched, data flow, and one thing worth remembering.
