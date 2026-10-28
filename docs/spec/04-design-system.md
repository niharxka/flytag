# FlyTag spec — Tokens pipeline, brand rules, web→native porting, component checklist

> Part of `docs/spec/`. Section numbers (§) are global across files; see `README.md` for the index.

## 5. Design system implementation

### 5.1 Tokens pipeline

1. Export `tokens.json` from the Brand System artifact into `docs/design/tokens.json`.
2. `scripts/build-tokens.ts` generates:
   - `src/theme/tokens.ts`: typed objects for color (light + dark), spacing (`space-1…8` = 4–64), radius (`sm 10, md 16, lg 24, xl 36, pill 999`), shadow, blur, size (`control-sm 36, md 48, lg 56`, `avatar-md 40`), and type styles.
   - CSS variables in `global.css` under `:root` (Mist) and `.dark` (Charcoal) for NativeWind; `tailwind.config.js` maps names (`bg-mist`, `text-ink`, `bg-sky`, `text-on-sky`, `rounded-pill`, `p-space-4`…).
3. Run with `npm run tokens`. Generated files carry a "do not edit" header.

### 5.2 Brand rules engineers must keep (from the Brand System README)

- Palette is cool: mist, sky, atmos, charcoal. `flare` / `flare-deep` (cherry red) are **plane-only**: never UI, text, or status. No pink, no warm accents.
- `sky` is spent on the one thing to notice: selected ride, Join button, active segment, done timeline steps. Text on sky is `on-sky`.
- `inverse` / `on-inverse`: primary button, FAB, active tab, current timeline step. Primary button at most once per screen.
- `go` and `danger` always come with a word or icon, never colour alone.
- Pill is the default shape; `radius-lg` cards, `radius-xl` sheets.
- One typeface: Open Sauce One, 300–900. `body` is 16 px minimum; `caption` 12 px only for bylines/tags; `fine` (300) never in the app.
- Sentence case everywhere except uppercase `label` eyebrows. Buttons verb-first, 2–3 words ("Join ride", "Post a ride", "Let's go").
- Formats: dates `Tue 3/18`, times `11:00 AM`, together `Tue 3/18 · 11:00 AM`, seats `2 of 4 seats`.
- No emoji in product UI. Icons come from the FlyTag set via `Icon`; standalone icons live in `IconButton` with a label.
- Motion: press scales to 0.98, 150–200 ms ease; reduced motion removes movement.

### 5.3 Porting notes (web artifact → React Native)

| Web concept | React Native implementation |
|---|---|
| `backdrop-filter: blur()` glass | `GlassView` = `expo-blur` `BlurView` + translucent fill + 1 px `glass-edge` border + shadow. **Android fallback:** blur support on Android has historically been weaker; if it looks muddy, render a near-opaque `surface` fill instead. Keep this decision inside `GlassView` only. |
| CSS gradients (`sky → sky-glow`) | `expo-linear-gradient` |
| Haze `Backdrop` | Bundle the three haze images (mist, charcoal, sky) as `ImageBackground`, or draw with `react-native-svg` radial gradients |
| woff2 fonts | React Native needs TTF/OTF. Get the TTF/OTF builds of Open Sauce One (open-source family **[VERIFY license]**) and load with the `expo-font` config plugin so they're embedded at build time |
| SVG icon sheet | Split into one SVG per icon in `assets/icons/`, generate components with SVGR `--native` into `src/ui/icons/`, render via `Icon name="plane-depart"` with `currentColor` → `color` prop |
| Hover lift | Not applicable on touch; use pressed state (scale 0.98) via `Pressable` + Reanimated |
| Focus ring | Applies to keyboard/switch control; implement with `onFocus`/`onBlur` on TextField (2 px `focus` ring) |
| `aria-*` | `accessibilityLabel`, `accessibilityRole`, `accessibilityState`, `accessibilityHint`; live announcements via `AccessibilityInfo.announceForAccessibility` |
| BottomSheet | Expo Router `presentation: 'formSheet'` with detents (native sheet, no extra library). Fall back to `@gorhom/bottom-sheet` only if custom behaviour is needed |
| Plane glide | Reanimated `withTiming` translateX from off-screen right, 2200 ms ease-out with slight settle, once; `useReducedMotion()` → render at rest |
| Safe areas | `react-native-safe-area-context`; TabBar floats 16 px above the bottom inset; FAB 16 px clear of TabBar |

### 5.4 Component acceptance checklist (every `ui/` component)

- Uses tokens only (lint rule: no hex literals in `src/ui` and `src/features`).
- Renders correctly in Mist and Charcoal.
- Touch target ≥ 48 dp (`control-md`); `control-sm` only inside a ≥48 dp row.
- Has accessibility label/role; disabled state at 45% opacity and still visible, with a reason when not obvious (e.g., "Jake hasn't shared a number").
- Respects Dynamic Type / font scaling (cap `maxFontSizeMultiplier` on display and title-xl only).
- Appears in `/dev/ui` gallery with all variants and states.
