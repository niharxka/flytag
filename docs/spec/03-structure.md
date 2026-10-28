# FlyTag spec — Folder layout, file roles inside a feature, import rules, naming

> Part of `docs/spec/`. Section numbers (§) are global across files; see `README.md` for the index.

## 4. Repository and folder structure

Design goals, in priority order: **(1) you can find any piece of logic by guessing its file name, (2) every concept lives in exactly one place, (3) no folder exists until it has something in it.** Feature-first, flat inside each feature, routes kept thin. One repo, app and Supabase together.

```
flytag/
├─ CLAUDE.md                     # short always-loaded rules for Claude Code
├─ README.md                     # human setup guide
├─ app.config.ts · eas.json · package.json · tsconfig.json
├─ babel.config.js · metro.config.js · tailwind.config.js · global.css
├─ .env.example                  # EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
├─ .github/workflows/ci.yml
├─ docs/
│  ├─ spec/                      # this spec, split by topic (README.md is the index)
│  ├─ SCHEMA.md                  # ER diagram + "life of a ride" — the map of the database
│  ├─ LEARNING_LOG.md            # your own notes after each phase (§17)
│  ├─ decisions/                 # short ADRs: 0001-supabase.md, 0002-nativewind.md …
│  └─ design/                    # tokens.json, flytag-icon-set.svg from the Brand System
├─ assets/                       # fonts/, images/, icons/ (one SVG per icon)
├─ scripts/
│  ├─ build-tokens.ts            # tokens.json → src/theme/tokens.ts + global.css vars
│  └─ build-icons.ts             # assets/icons/*.svg → src/ui/icons/*.tsx
├─ src/
│  ├─ app/                       # ROUTES ONLY (Expo Router). Each file ≈ 20–60 lines.
│  │  ├─ _layout.tsx             # fonts, providers, splash, auth gate
│  │  ├─ (auth)/  welcome · sign-in · verify · onboarding
│  │  ├─ (app)/
│  │  │  ├─ (tabs)/  _layout · index (Rides) · chats · alerts · profile
│  │  │  ├─ rides/   new (form sheet) · [rideId]
│  │  │  ├─ riders/  [userId]
│  │  │  └─ settings/  notifications · safety · edit-profile
│  │  └─ dev/ui.tsx              # component gallery, __DEV__ only
│  ├─ features/                  # one folder per product area, FLAT inside
│  │  ├─ auth/
│  │  ├─ profile/
│  │  ├─ rides/
│  │  ├─ chat/
│  │  ├─ notifications/
│  │  └─ safety/
│  ├─ ui/                        # design system primitives (ported from the artifact) + icons/
│  ├─ theme/                     # tokens.ts (GENERATED), typography.ts, useThemeMode.ts
│  └─ lib/                       # supabase.ts, queryClient.ts, env.ts, dates.ts, errors.ts,
│                                #   AppProviders.tsx, database.types.ts (GENERATED)
└─ supabase/
   ├─ config.toml
   ├─ migrations/                # one concept per file, commented (see §6.4)
   ├─ functions/                 # push/, delete-account/, _shared/
   ├─ seed.sql                   # colleges + demo users and rides for local dev
   └─ tests/                     # pgTAP: one file per table/RPC, reads like a spec
```

### 4.1 Inside a feature: one predictable set of files

Every feature uses the same file names, so once you've learned `rides/` you know where everything is in `chat/`.

```
src/features/rides/
├─ index.ts              # public surface: what screens may import. Starts with a 3-line comment
│                        #   explaining what this feature does.
├─ rides.api.ts          # EVERY Supabase call for this feature + query keys. No React.
├─ rides.hooks.ts        # TanStack Query hooks wrapping rides.api.ts (useRides, useJoinRide …)
├─ rides.schemas.ts      # zod schemas + inferred TS types (PostRideInput …)
├─ rides.logic.ts        # pure functions: rideTimeline, fareShare, formatSeats
├─ rides.logic.test.ts   # tests sit next to what they test
├─ RideList.tsx          # feature components (compose ui/ primitives)
├─ PostRideForm.tsx
├─ RideDetail.tsx
└─ RidersPanel.tsx
```

| Question you'll ask | Where the answer is |
|---|---|
| "What does the app send to the database for X?" | `features/X/X.api.ts` |
| "When does this screen refetch / update?" | `features/X/X.hooks.ts` |
| "What's valid input for X?" | `features/X/X.schemas.ts` |
| "How is the timeline / fare / label computed?" | `features/X/X.logic.ts` |
| "What does the database do on its own?" | `docs/SCHEMA.md` → "Automatic behaviour" |
| "Who can read this table?" | the table's migration file + `supabase/tests/<table>.test.sql` |
| "What does this button look like?" | `ui/Button.tsx`, gallery at `/dev/ui` |

**Growth rule:** only when a feature passes ~12 files, split components into `features/X/components/`. Don't pre-create folders.

### 4.2 Import rules (enforce with `eslint-plugin-boundaries` or `import/no-restricted-paths`)

| From → To | `app/` | `features/X` | `ui/` | `theme/` | `lib/` |
|---|---|---|---|---|---|
| `app/` (routes) | ✓ | ✓ via `index.ts` only | ✓ | ✓ | ✓ |
| `features/X` | ✗ | own files; other features via their `index.ts` | ✓ | ✓ | ✓ |
| `ui/` | ✗ | ✗ | ✓ | ✓ | `dates.ts` only |
| `lib/`, `theme/` | ✗ | ✗ | ✗ | ✓ | ✓ |

- `ui/` components are presentational: props in, callbacks out. No Supabase, no Query.
- Route files read params and render one feature component. No data logic.
- Data flows one way: **screen → hook → api → Supabase**. If you're debugging, walk that chain.

### 4.3 Naming

- Components `PascalCase.tsx`; feature modules `<feature>.<role>.ts`; route files `kebab-case.tsx`.
- Query keys exported from `X.api.ts`, e.g. `ridesKeys.list(direction)`, `ridesKeys.detail(id)`.
- DB is `snake_case`. `X.api.ts` converts rows to camelCase view models, so `snake_case` never leaks past the api file.

### 4.4 Why not something else

- **Layer-first** (`components/`, `hooks/`, `services/` at the top): fine for tiny apps, but a single change ("add meet spot to rides") touches five distant folders.
- **My first draft** (`api/ hooks/ components/ lib/` subfolders in every feature): correct but too deep for a team of one; you'd open four folders to read one feature. Flat files with role suffixes give the same separation with less navigation.
- **Monorepo** (Turborepo with `apps/mobile`, `packages/db`): only pays off with a second app (web or admin). Revisit then.
