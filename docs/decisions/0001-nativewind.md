# 0001 · NativeWind v4 for styling, themes as CSS variables

**Status:** accepted, Phase 0 (2026-10-28)

**Decision.** NativeWind 4.2 + Tailwind 3. Colour tokens become CSS variables in `global.css`
(Mist in `:root`, Charcoal under `@media (prefers-color-scheme: dark)`), and Tailwind classes
point at the variables (`bg-surface` → `var(--surface)`). Tailwind's default palette and spacing
are replaced, so only token classes exist.

**Why.** Spec §2.4. v5 is still a release candidate; v4's peer range covers Reanimated 4.7 and
it's pure JS, so it runs in Expo Go. The spec sketched a `.dark` class; on native, NativeWind's
`colorScheme.set()` works by calling `Appearance.setColorScheme`, which drives the media query,
so the media query gives us "follow the phone" and a manual toggle with one mechanism.

**Consequences.** Opacity modifiers like `bg-sky/50` don't work on these colours (they're full
values, some already rgba). Use the token that exists (`sky-soft`, `glass`) instead. Type styles
are generated CSS classes (`type-heading`), because each weight is a separate font family.

**Update (web build, 2026-10-29).** Charcoal now lives under `.dark:root` with
`darkMode: 'class'`, not the dark media query: in the browser NativeWind can only switch theme
by toggling a `dark` class on `<html>`. On phones nothing changed: the compiled iOS bundle has
the same 21 light/dark variable pairs before and after. On the web, "follow system" is resolved
by `useApplyThemePref` from the browser's `prefers-color-scheme`.
