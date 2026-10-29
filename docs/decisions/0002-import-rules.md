# 0002 · Folder import rules with `no-restricted-imports`

**Status:** accepted, Phase 0 (2026-10-28)

**Decision.** Enforce spec §4.2 with ESLint's built-in `no-restricted-imports`, one block per
folder in `eslint.config.js`, instead of `eslint-plugin-boundaries`.

**Why.** Every cross-folder import uses the `@/` alias, so path patterns are enough. Each block
reads like a row of the §4.2 table, with no plugin-specific selector language to learn. Also bans
hex literals in `src/ui` and `src/features`, and `@supabase/*` outside `*.api.ts` and
`src/lib/supabase.ts`.

**Revisit if** relative imports start crossing folders (`../../features/...`); then a resolver-
based plugin earns its keep.
