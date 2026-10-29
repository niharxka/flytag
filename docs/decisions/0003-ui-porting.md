# 0003 · How the Brand System's web components became `src/ui/`

**Status:** accepted, Phase 1 (2026-10-28)

- **Icons:** `scripts/build-icons.ts` turns `assets/icons/*.svg` into a typed shape map
  (`src/ui/icons.generated.ts`) drawn by `Icon` with react-native-svg. No SVGR: our icons are
  only paths and circles, and a typed `IconName` catches typos at compile time.
- **Colour on SVG:** `cssInterop(Svg)` maps a `text-*` class to Svg's `color` prop, so icons use
  the same classes as text (`stroke="currentColor"`).
- **Glass:** one `GlassView`. iOS = expo-blur + glass fill + rim + shadow. Android = 92%
  `surface` fill, no blur (§5.3 fallback): Android blur needs a BlurTargetView ref to whatever
  is behind each panel, which floating glass can't guarantee. Revisit in Phase 8 on real devices.
- **Haze backdrops:** the artifact's CSS radial gradients redrawn as react-native-svg radial
  gradients (same centres, radii, opacities); no image files.
- **Press motion:** `PressableScale` (Reanimated, scale 0.98 / 160 ms, off under Reduce Motion).
  Shared values use `.get()`/`.set()` because the React Compiler is on.
- **Not ported:** NavBar, BrandBar, StatBubble (web/slides only); BottomSheet becomes Expo
  Router's native `formSheet` when Post a ride is built (Phase 3).
- **Tests:** a hand-written Reanimated mock in `jest.setup.ts` (the shipped mock fails under
  jest-expo with Reanimated 4.7 + Worklets 0.13). `Gallery.test.tsx` renders every component.
