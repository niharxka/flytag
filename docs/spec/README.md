# FlyTag spec — index

> Status: v1.1 · Owner: Niharika · Last updated: 2026-10-27
> Visual source of truth: the FlyTag Brand System artifact. The Canva PDF is the flow wireframe only.

The spec is split so Claude Code (and you) read only what a task needs. Section numbers (§) are global, so "§7.3" always means the same thing. **[DECIDE]** marks open product questions (§15); **[VERIFY]** marks version or policy details to confirm at setup.

## Files

| File | Sections | Read it when… |
|---|---|---|
| `01-product.md` | §1 scope + screens, §16 glossary | starting a new screen or unsure what's in v1 |
| `02-stack-decisions.md` | §2 stack, §3 architecture | adding a library or questioning a choice (rarely needed for coding) |
| `03-structure.md` | §4 folders, file roles, imports, naming | creating any new file |
| `04-design-system.md` | §5 tokens, brand rules, porting | touching `src/ui/`, `src/theme/`, or styling |
| `05-database.md` | §6 tables, §7 RLS, RPCs, triggers, notifications | writing a migration, RPC, policy, Edge Function |
| `06-client-data.md` | §8 Supabase client, hooks, realtime, forms | writing `*.api.ts`, `*.hooks.ts`, `*.schemas.ts` |
| `07-features.md` | §9 per-screen behaviour + acceptance criteria | building or changing a screen |
| `08-quality-and-release.md` | §10 NFRs, §11 testing, §12 CI + release | tests, CI, builds, store submission |
| `09-roadmap.md` | §13 phases, §14 metrics, §15 open questions, §17 understanding plan | planning a phase or checking what's next |
| `../SCHEMA.md` | ER diagram, life of a ride, automatic behaviour, RLS summary | any database question — read this before `05-database.md` |

## Typical tasks → what to read

| Task | Read |
|---|---|
| Port a design-system component | `04-design-system.md` |
| Add a table or RPC | `../SCHEMA.md`, `05-database.md` |
| Build a screen end to end | `07-features.md` (that screen), `06-client-data.md`, `03-structure.md` |
| Start a new phase | `09-roadmap.md` (that phase + its gate), then the files the phase touches |
