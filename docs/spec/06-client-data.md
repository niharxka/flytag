# FlyTag spec — Supabase client, query keys + hooks, realtime, Zustand, forms/validation

> Part of `docs/spec/`. Section numbers (§) are global across files; see `README.md` for the index.

## 8. Client data layer

### 8.1 Supabase client

- One instance in `src/lib/supabase.ts` using `EXPO_PUBLIC_SUPABASE_URL` and the publishable (anon) key. **Never** ship the service-role key in the app.
- Session persistence: follow Supabase's current Expo quickstart (AsyncStorage adapter, or an encrypted storage adapter if you want the session encrypted at rest) **[VERIFY]**. `autoRefreshToken: true`; start/stop refresh on `AppState` changes as the quickstart shows.
- Types: `supabase gen types typescript --local > src/lib/database.types.ts`, run after every migration (`npm run db:types`).

### 8.2 Query keys and hooks (per feature)

```ts
// features/rides/rides.api.ts (query keys live with the calls they key)
export const ridesKeys = {
  all: ['rides'] as const,
  list: (direction: Direction) => [...ridesKeys.all, 'list', direction] as const,
  detail: (id: string) => [...ridesKeys.all, 'detail', id] as const,
  members: (id: string) => [...ridesKeys.all, 'members', id] as const,
};
```

| Hook | Kind | Notes |
|---|---|---|
| `useRides(direction)` | `useInfiniteQuery` | `list_rides` with cursor; refetch on focus; pull-to-refresh |
| `useRide(id)` / `useRideMembers(id)` | `useQuery` | |
| `useCreateRide()` | `useMutation` | on success: invalidate list, navigate to detail |
| `useJoinRide()` / `useLeaveRide()` | `useMutation` | optimistic seat count, roll back on `RIDE_FULL` |
| `useMessages(rideId)` | `useInfiniteQuery` + realtime | newest 50, load older on scroll |
| `useSendMessage(rideId)` | `useMutation` | optimistic bubble with pending state |
| `useMyChats()` | `useQuery` | Chats tab |
| `useNotifications()` | `useInfiniteQuery` | Alerts tab; realtime insert on own rows |
| `useProfile()` / `useUpdateProfile()` | | |

### 8.3 Realtime

- Ride detail subscribes to channel `ride:{rideId}` for `postgres_changes` on `messages` (INSERT, filter `ride_id=eq.{id}`) and `ride_members` (all events, same filter). Handlers append to / invalidate the matching query cache.
- Alerts subscribes to `notifications` INSERT for `user_id=eq.{me}`.
- Unsubscribe on screen blur/unmount; resubscribe and refetch on app foreground (realtime can miss events while backgrounded).

### 8.4 Client state (Zustand)

Only UI state that isn't server data: selected direction on the Rides tab, post-ride draft, theme preference mirror. No server data in Zustand.

### 8.5 Forms and validation

zod schemas in `features/X/X.schemas.ts` shared by react-hook-form and API wrappers:
- Email: trimmed, lowercase, ends with `@ucsd.edu` (constant in `features/auth/auth.schemas.ts`).
- Display name: 1–30 chars.
- Post ride: date today…+90 days; time in the future (≥ 30 min from now); seats 2–6; cost 0–500 USD optional; notes ≤ 280.
- Message: 1–1000 chars after trim.
- Phone: E.164 via `libphonenumber-js`.

Date/time input: `@react-native-community/datetimepicker`, rendered inside a `TextField`-styled pressable.
