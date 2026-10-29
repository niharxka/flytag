# FlyTag database map

> Keep this file updated in the same PR as every migration. Full column details: `docs/spec/05-database.md` §6.
>
> **Built so far (Phases 2–4):** `colleges`, `profiles`, `profile_private`, the signup hook, the new-user trigger, `rides`, `ride_members`, the `ride_cards` view, `create_ride` / `list_rides` / `nearby_rides`, and Phase 4's `join_ride` / `leave_ride` / `update_ride` / `cancel_ride` / `list_ride_members` / `get_rider_contact`. Everything else on this page is the plan.

| Migration | Adds |
|---|---|
| `20261029000001_colleges.sql` | `colleges` + the 9 rows (8 colleges + Graduate student) |
| `20261029000002_profiles.sql` | `rider_intent` enum, `profiles`, `profile_private`, `set_updated_at()`, `on_auth_user_created` trigger |
| `20261029000003_auth_hook.sql` | `hook_restrict_signup_to_ucsd` (enabled in `supabase/config.toml`) |
| `20261030000001_rides.sql` | `ride_direction`, `ride_status`, `member_role` enums, `rides`, `ride_members` (one active host per ride) |
| `20261030000002_ride_cards.sql` | `ride_cards` view: a ride plus `seats_taken`, `rider_names`, `is_member`, `is_host` (obeys RLS) |
| `20261030000003_create_ride.sql` | `create_ride()`: ride + host member in one transaction; idempotent per `client_request_id` |
| `20261030000004_list_rides.sql` | `list_rides()` (keyset pages, past hidden) and `nearby_rides()` (merge suggestion) |
| `20261031000001_home_label.sql` | `profiles.home_label` (custom home; a college OR a label, never both); `ride_cards.host_college` → `host_home` |
| `20261031000002_avatars.sql` | private `avatars` Storage bucket; each user writes only `avatars/<their id>/…`; signed-in users can view |
| `20261101000001_member_helpers.sql` | `is_active_member(ride, user)` |
| `20261101000002_join_ride.sql` | `join_ride(ride, intent)`: **locks the ride row** so the last seat goes to exactly one person (`npm run db:race`) |
| `20261101000003_leave_ride.sql` | `leave_ride()`: host leaving hands over to the earliest rider, or cancels an empty ride |
| `20261101000004_host_ride_edits.sql` | `update_ride()` (seats never below people in), `cancel_ride()`; host only |
| `20261101000005_list_ride_members.sql` | `list_ride_members()`: the riders panel, with a phone *shared?* flag, never the number |
| `20261101000006_get_rider_contact.sql` | `get_rider_contact()`: the only way to read someone's phone (both in the ride + they share) |

## 1. The diagram

```mermaid
erDiagram
    auth_users ||--|| profiles : "has one"
    profiles ||--|| profile_private : "has one (private)"
    colleges ||--o{ profiles : "home college of"
    profiles ||--o{ rides : "posts (created_by)"
    rides ||--o{ ride_members : "has"
    profiles ||--o{ ride_members : "joins as"
    rides ||--o{ messages : "has chat"
    profiles ||--o{ messages : "writes"
    profiles ||--o{ notifications : "receives"
    rides ||--o{ notifications : "about"
    profiles ||--o{ push_tokens : "owns phones"
    profiles ||--o{ blocks : "blocks"
    profiles ||--o{ reports : "files"

    profiles {
        uuid id PK
        text display_name
        uuid college_id FK
        rider_intent intent
        timestamptz onboarded_at
    }
    profile_private {
        uuid user_id PK
        text phone_e164
        bool share_phone
        bool notify_flags
    }
    rides {
        uuid id PK
        uuid created_by FK
        ride_direction direction
        timestamptz depart_at
        smallint seats_max
        ride_status status
    }
    ride_members {
        uuid ride_id PK
        uuid user_id PK
        member_role role
        timestamptz left_at
    }
    messages {
        uuid id PK
        uuid ride_id FK
        uuid author_id FK
        text body
    }
    notifications {
        uuid id PK
        uuid user_id FK
        notif_type type
        uuid ride_id FK
        timestamptz read_at
    }
```

**The one-sentence version:** a *profile* posts or joins *rides* through *ride_members*; each ride has *messages*; things that happen create *notifications*, which get pushed to *push_tokens*. Everything private sits in *profile_private*; safety lives in *blocks* and *reports*.

## 2. Life of a ride (follow the rows)

| Step | User does | App calls | Rows that change |
|---|---|---|---|
| 1 | Niharika signs up | Supabase Auth OTP | hook checks `@ucsd.edu` → `auth.users` + trigger creates `profiles`, `profile_private` |
| 2 | Finishes onboarding | `update profiles` | `profiles.college_id`, `intent`, `onboarded_at` |
| 3 | Posts Tue 3/18 · 11:00 AM, 4 seats | `create_ride` | `rides` +1, `ride_members` +1 (host), `messages` +1 (system, from Phase 5) |
| 4 | Jake joins | `join_ride` | locks ride row → `ride_members` +1 (`messages` +1 system and the `notifications` trigger arrive in Phases 5–6) |
| 5 | Notification is sent | (automatic) | webhook → `push` function reads `push_tokens` → Expo → Niharika's phone |
| 6 | Jake: "Meet at Sixth market?" | `insert messages` | `messages` +1 → realtime to Niharika's open chat → trigger: `notifications` (collapsed) |
| 7 | 2 hours before | (pg_cron) | `notifications` +1 per member (`ride_reminder`) |
| 8 | Ride time passes | nothing | no row changes: the app treats `depart_at < now() − 15 min` as past |

## 3. Automatic behaviour (things the database does without the app asking)

Each item lives in the migration named next to it. If something "magically" happens, it's on this list.

| Trigger | What happens | Migration |
|---|---|---|
| New `auth.users` row | create `profiles` + `profile_private` (name from sign-in, else email prefix) | `20261029000002_profiles.sql` |
| Signup attempt | `before-user-created` hook rejects non-UCSD emails | `20261029000003_auth_hook.sql` |
| Any `profiles` update | `updated_at` stamped | `20261029000002_profiles.sql` |
| `ride_members` insert | notify other members (`rider_joined`) | `*_notifications.sql` |
| `messages` insert | notify other members (`new_message`, max 1 unread per 10 min) | `*_notifications.sql` |
| `update_ride` / `cancel_ride` | notify members | `*_notifications.sql` |
| `notifications` insert | DB webhook → `push` Edge Function | dashboard + `functions/push` |
| Every 5 min (pg_cron) | create `ride_reminder` notifications | `*_reminders.sql` |
| `messages` insert | rate limit: reject if > 20 in the last minute from that user | `*_messages.sql` |

## 4. Who can see what (RLS in one table)

| You can read… | …if |
|---|---|
| any profile | you're signed in and neither of you blocked the other (block check arrives with `blocks` in Phase 7) |
| rides, ride_members, ride_cards | you're signed in (blocked hosts hidden from Phase 7) |
| your own `profile_private` | always (nobody else, ever) |
| colleges | you're signed in |
| profile photos (`avatars` bucket) | you're signed in, via a signed link (no public URLs) |

**Who can write what (so far):** your own `profiles` row, only `display_name`, `college_id`, `home_label`, `intent`, `avatar_path`, `onboarded_at` (column grants); files in your own `avatars/<id>/` folder; your own `profile_private` settings. Rows themselves are only created by the trigger. `colleges` changes only via migrations. `rides` / `ride_members`: no direct writes at all; only `create_ride`, `join_ride`, `leave_ride`, `update_ride`, `cancel_ride`.
| a ride and its members | you're signed in and haven't blocked the host |
| a ride's messages | you're a current member of that ride |
| someone's phone number | you're both current members of the same ride **and** they turned on sharing (via `get_rider_contact` only) |
| notifications, push tokens, blocks | they're yours |
| reports | never (reviewed in the Supabase dashboard) |
