# FlyTag spec — Non-functional requirements, testing, environments, CI/CD, store release

> Part of `docs/spec/`. Section numbers (§) are global across files; see `README.md` for the index.

## 10. Non-functional requirements

| Area | Requirement |
|---|---|
| Performance | Rides list first paint < 1 s on warm start; lists use `FlatList` (or FlashList) with stable keys; images via `expo-image` with caching |
| Offline | Show cached data with a "You're offline" banner; disable mutations offline; no offline write queue in v1 |
| Accessibility | WCAG 2.1 AA contrast (tokens already meet it), 48 dp targets, screen-reader labels, colour never the only signal, reduced motion |
| Privacy | Phone numbers only to co-riders who opted in; campus-scoped visibility; no location tracking; minimal analytics |
| Security | RLS on every table; service-role key only in Edge Functions; message rate limit (e.g. 20/min per user via trigger); input length checks in SQL |
| Time | Store UTC, display LA time; all "today/tomorrow" logic uses LA timezone even if the phone is elsewhere |
| Theming | Follows system by default; manual override persists |
| Localization | English only; keep copy in components for v1, but avoid string concatenation for dates (use `dates.ts`) |

---

## 11. Testing strategy

| Level | Tool | What |
|---|---|---|
| Unit | Jest (`jest-expo` preset) | `*.logic.ts` and `lib/` pure functions: `rideTimeline`, `dates`, fare split, zod schemas, error mapping |
| Component | React Native Testing Library | `ui/` variants & accessibility props; RideCard/RiderRow states; PostRideForm validation |
| Database | pgTAP via `supabase test db` | Every RLS policy (allowed + denied), every RPC error code, seat race (`join_ride` on last seat) |
| E2E | Maestro | Flows: sign in with test account → post ride → second account joins → send message |
| Manual | Device checklist | iOS + Android, light + dark, large text, VoiceOver/TalkBack spot check, push on a real device |

Coverage target: `*.logic.ts`, `lib/` and RPCs near-complete; UI by key states rather than a percentage.

---

## 12. Environments, CI/CD, release

### 12.1 Environments
| Env | Supabase | App build |
|---|---|---|
| Local | `supabase start` (Docker) with `seed.sql` | dev client, `.env.local` |
| Staging *(add before public beta)* | separate Supabase project | EAS `preview` profile, internal distribution |
| Production | Supabase prod project | EAS `production`, App Store / Play |

Schema changes: write a migration locally (`supabase migration new …`), test with `supabase db reset`, push with `supabase db push`. Never edit prod schema in the dashboard.

### 12.2 CI (GitHub Actions, on PR)
1. `npm ci`
2. `npm run typecheck` (`tsc --noEmit`)
3. `npm run lint` (`expo lint` + Prettier check)
4. `npm test`
5. Supabase job: `supabase start` → `supabase db reset` → `supabase test db`

On tag `v*`: `eas build --profile production --platform all` and optionally `eas submit`. JS-only fixes during beta: `eas update --channel preview`.

### 12.3 Accounts and costs to set up
- Apple Developer Program ($99/yr), Google Play Console ($25 one-time) **[VERIFY]**.
- Expo account (EAS free tier has limited monthly builds **[VERIFY]**).
- Supabase project (free tier fine for beta; free projects can pause when inactive **[VERIFY current policy]**).
- Expo push: add the Expo access token as a Supabase secret; enable "Enhanced Security for Push Notifications".
- App Review needs a working login: plan a reviewer account that doesn't depend on a UCSD inbox (e.g., an allow-listed reviewer email with a password sign-in enabled only for that account) **[DECIDE before submission]**.
