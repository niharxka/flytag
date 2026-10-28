# FlyTag spec — Tables, enums, RLS, auth hook, RPCs, notifications pipeline, cron, Edge Functions

> Part of `docs/spec/`. Section numbers (§) are global across files; see `README.md` for the index.

## 6. Data model (Postgres)

**v1 is 10 small tables.** Every table answers one question; if you can't say the question, the table shouldn't exist yet. `docs/SCHEMA.md` has the diagram and a walkthrough of a ride's life.

All tables have RLS **enabled**. Timestamps are `timestamptz`, stored in UTC, displayed in `America/Los_Angeles`. The UCSD email domain is a single constant in v1 (multi-campus is a Phase 9 migration, not a v1 table).

### 6.1 Enums

```sql
create type ride_direction as enum ('to_airport', 'to_campus');
create type ride_status    as enum ('active', 'cancelled');      -- "past" is computed from depart_at
create type member_role    as enum ('host', 'rider');
create type rider_intent   as enum ('networking', 'flypal');
create type message_kind   as enum ('text', 'system');
create type notif_type     as enum ('rider_joined', 'rider_left', 'new_message',
                                    'ride_updated', 'ride_cancelled', 'ride_reminder');
create type report_reason  as enum ('harassment', 'no_show', 'unsafe', 'spam', 'other');
```

### 6.2 Tables

| # | Table | The question it answers | Who can read |
|---|---|---|---|
| 1 | `colleges` | Which UCSD colleges exist? | everyone signed in |
| 2 | `profiles` | Who is this rider, publicly? | signed-in users who haven't blocked each other |
| 3 | `profile_private` | What does only this user (or the app on their behalf) know? | the user only |
| 4 | `rides` | What trips are posted? | signed-in users (blocked hosts hidden) |
| 5 | `ride_members` | Who is in which ride? | anyone who can see the ride |
| 6 | `messages` | What was said in a ride's chat? | that ride's current members |
| 7 | `notifications` | What should this user be told? (Alerts tab + push) | the user only |
| 8 | `push_tokens` | Which phones belong to this user? | the user only |
| 9 | `blocks` | Who has this user blocked? | the blocker only |
| 10 | `reports` | What has been reported for review? | nobody in the app (Supabase dashboard) |

**colleges** — `id uuid pk · name text · sort smallint`. Seeded **[VERIFY current list]**.

**profiles** — 1:1 with `auth.users`.
| column | type | notes |
|---|---|---|
| id | uuid pk → auth.users, on delete cascade | |
| display_name | text | 1–30 chars, trimmed |
| college_id | uuid fk null | null until onboarding |
| intent | rider_intent null | tag shown on rider rows |
| avatar_path | text null | Storage path in `avatars/` |
| onboarded_at | timestamptz null | gate for `(app)` routes |
| created_at, updated_at | timestamptz | |

**profile_private** — private columns live in their own table because RLS protects *rows*, not *columns*.
| column | type | notes |
|---|---|---|
| user_id | uuid pk → profiles | |
| phone_e164 | text null | |
| share_phone | bool default false | |
| notify_rider_joined, notify_new_message, notify_ride_updated, notify_ride_reminder | bool default true | notification settings screen |
| theme_pref | text default 'system' | `system` / `mist` / `charcoal` |

**rides**
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| created_by | uuid → profiles | original poster |
| direction | ride_direction | |
| depart_at | timestamptz | to_airport: leave-campus time; to_campus: meet time at SAN |
| airport_code | text default 'SAN' | |
| seats_max | smallint, check 2–6 | includes host; default 4 |
| meet_spot | text null | pinned above chat **[DECIDE]** |
| est_total_cost_cents | int null | app shows per-person share |
| notes | text null | ≤ 280 chars |
| status | ride_status default 'active' | |
| created_at, updated_at | timestamptz | |

Index: `(direction, depart_at) where status = 'active'`.

**ride_members** — `ride_id · user_id · role member_role · intent rider_intent null · joined_at · left_at null`.
PK `(ride_id, user_id)`. Leaving sets `left_at` (history kept); one active `host` per ride (partial unique index).

**messages** — `id · ride_id · author_id null (null after account deletion → "Former rider") · kind · body (1–1000 chars) · created_at`. Index `(ride_id, created_at desc)`.

**notifications** — `id · user_id · type · ride_id null · title · body · read_at null · created_at`.

**push_tokens** — `id · user_id · expo_push_token unique · platform · updated_at`.

**blocks** — `blocker_id · blocked_id · created_at`, PK both.
**reports** — `id · reporter_id · reported_user_id · ride_id null · message_id null · reason · details null · status default 'open' · created_at`.

### 6.3 Derived data

- `list_rides()` returns each ride plus `seats_taken`, `rider_preview` (first 3 names + avatars), `is_member`, `is_host` — one request for the whole list.
- `my_chats()` returns rides I'm in + last message, sorted by last activity.
- "Past" rides = `depart_at < now() - 15 min`. No status column or cron job needed for that.

### 6.4 Migration file conventions (so the schema stays readable)

- One concept per migration: `20261101_profiles.sql`, `20261102_rides.sql`, `20261103_join_ride.sql`. The table, its indexes, its RLS policies, and its comments go in the **same** file.
- Each file opens with a header comment: what it adds, why, and which spec section it implements.
- Every table and column gets `comment on …` statements, so the meaning shows up in the Supabase dashboard.
- Every policy has a plain-English name: `"members can read their ride's messages"`.
- Each RPC body has a numbered comment per step (`-- 1. lock the ride row so two joins can't race`).

### 6.5 What was cut from the first draft, and why

| Cut | Why | When it comes back |
|---|---|---|
| `campuses` table | Only one campus; a constant is easier to read | Phase 9 multi-campus |
| `chat_reads` (unread dots) | Nice-to-have; adds a table, an RPC and sync logic | After beta, if testers miss it |
| `notification_prefs` table | Four booleans fit in `profile_private` | — |
| `completed` status + hourly cron | "Past" can be computed from `depart_at` | — |
| `block_user` / `mark_chat_read` RPCs | Single-row, owner-only writes don't need RPCs | — |

---

## 7. Server logic

### 7.1 Row Level Security (summary)

Helper SQL functions: `is_ride_member(ride_id)`, `is_blocked_pair(a, b)`.

| Table | select | insert | update | delete |
|---|---|---|---|---|
| colleges | signed in | — | — | — |
| profiles | signed in, not blocked either way | auth trigger only | own row | — (cascade) |
| profile_private | own | auth trigger only | own | — |
| rides | signed in, host not blocked | `create_ride` RPC | `update_ride` / `cancel_ride` RPCs | — (use status) |
| ride_members | members of rides you can see | RPC only | RPC only | RPC only |
| messages | active members, excluding authors you blocked | active member as self, rate-limited | — | — |
| notifications | own | triggers only | own (`read_at`) | own |
| push_tokens | own | own | own | own |
| blocks | own (as blocker) | own | — | own |
| reports | nobody | own | — | — |

Every policy has a pgTAP test in `supabase/tests/` (§11): one "allowed" case and one "denied" case.

### 7.2 Auth hooks and triggers

- **`before-user-created` hook** (`hook_restrict_signup_to_ucsd`): reject unless the email ends with `@ucsd.edu`. Message: "Use your @ucsd.edu email."
- **`on_auth_user_created` trigger**: insert `profiles` (`display_name` from `raw_user_meta_data.display_name`) and `profile_private`.

### 7.3 RPC functions

Only for writes that touch more than one row or need a lock. All raise errors with stable codes.

| Function | Does | Errors |
|---|---|---|
| `list_rides(direction, after default now() - 15 min, page_size default 20)` | Active rides, soonest first, full rides included, blocked hosts excluded | — |
| `my_chats()` | Rides I'm in + last message | — |
| `create_ride(direction, depart_at, seats_max, meet_spot?, est_total_cost_cents?, notes?)` | Validates (future, ≤ 90 days, seats 2–6); inserts ride + host member + system message, one transaction | `INVALID_TIME`, `INVALID_SEATS`, `NOT_ONBOARDED` |
| `join_ride(ride_id, intent?)` | Locks the ride row, counts members, inserts member + system message | `RIDE_FULL`, `RIDE_NOT_ACTIVE`, `RIDE_DEPARTED`, `ALREADY_MEMBER`, `BLOCKED` |
| `leave_ride(ride_id)` | Sets `left_at`; host leaving promotes the earliest rider, or cancels if alone | `NOT_MEMBER` |
| `update_ride(ride_id, …)` | Host only; `seats_max` can't go below current count | `NOT_HOST`, `INVALID_SEATS` |
| `cancel_ride(ride_id)` | Host only; status `cancelled` | `NOT_HOST` |
| `get_rider_contact(ride_id, user_id)` (`security definer`) | Phone only if both are active members and target shares it | `NOT_ALLOWED` |

App-side, `src/lib/errors.ts` maps codes to copy, e.g. `RIDE_FULL` → "This ride just filled up."

### 7.4 Notifications pipeline

1. **Triggers** insert into `notifications`:
   - `ride_members` insert → `rider_joined` to other active members.
   - `messages` insert (kind `text`) → `new_message` to other members, **collapsed**: skip if that user has an unread `new_message` for this ride from the last 10 minutes.
   - `update_ride` time change → `ride_updated`; `cancel_ride` → `ride_cancelled`.
   - **pg_cron** every 5 min → `ride_reminder` for rides departing in 2 hours (once per member).
2. **Database webhook** on `notifications` INSERT → Edge Function `push`.
3. `push` reads the user's `push_tokens` and `notify_*` flags, skips disabled types, calls the Expo Push API with `data: { rideId, type }`, and deletes tokens Expo reports as `DeviceNotRegistered`.
4. Tapping a notification deep-links to `/rides/[rideId]`. A foreground `new_message` for the ride on screen is suppressed.

### 7.5 Scheduled jobs (pg_cron)

- Every 5 min: ride reminders. (That's the only cron job in v1.)

### 7.6 Edge Functions

- `push` (above).
- `delete-account`: verifies the caller's JWT, deletes the `auth.users` row with the service role (cascades the profile; messages keep `author_id = null`), removes avatar files. Required in-app by App Store rules.
