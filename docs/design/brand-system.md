# FlyTag Brand System — porting reference

Source of truth: the **FlyTag Brand System** artifact
(https://claude.ai/artifact/Uvewg9QZa2E6CiF89k4rkS). This file captures what `tokens.json`
can't: component anatomy, the six reference screens, the plane drawing. When the artifact
changes, update this file and re-export `tokens.json` (currently identical to the artifact's,
sha256 `441c4d75…`).

Icons: one SVG per icon in `assets/icons/` (copied verbatim from the artifact's `Icon` paths:
24 grid, 1.75 stroke, round caps/joins, `currentColor`). Names: home, search, user, users, plus,
phone, send, plane-depart, plane-land, chat, clock, pin, bell, chevron-right, arrow-right, tag.

## Components (web class → what to port)

| Component | Anatomy and states |
|---|---|
| Button | pill, h `control-md` (sm 36 / lg 56), px space-5 (sm 4 / lg 6), 600 16/24 (sm 14, lg 18). Variants: primary `inverse`/`on-inverse`; sky `sky`/`on-sky`; secondary `surface` + 1.5 `line-strong` border; ghost transparent/`ink` (pressed `mist-deep`); glass `glass-on-sky` + white 35% border, `on-atmos`, weight 500. Icon 18 (lg 22) before/after label, gap space-2. `loading` spinner replaces leading icon. `block` = full width. Disabled 45%. |
| IconButton | circle 48 (sm 36), icon 22 (sm 18) stroke 2. Variants: white `surface`/`sky-deep`; charcoal `inverse`/`on-inverse`; sky; glass `glass` + `glass-edge`/`ink`; muted `mist-deep`/`ink-muted`. On the sky backdrop white = `on-atmos` bg, `atmos-deep` icon. Requires `label`. |
| Fab | `inverse` pill 56, icon plus 26 stroke 2, `shadow-lift`; round unless `extended` (then shows label). |
| TabBar | glass pill, padding space-2; tabs flex 1, icon 22 over label 600 12/16 `ink-muted`; active tab `inverse`/`on-inverse` pill. Tabs: Rides plane-depart, Chats chat, Alerts bell, Profile user. |
| AppHeader | row, align end, padding 24/16/16. Eyebrow = `label` style `ink-muted`; title = `title-xl` `ink`. Leading back IconButton (glass sm, icon home) when `onBack`. Trailing default = Avatar 48 (opens profile). |
| BrandBar | wordmark "FlyTag" 800 20/24 with `sky-deep` full stop; bottom `line` rule. |
| Menu | glass, radius-lg, padding space-2. Rows: pill, padding 12/16, number "01" (700 13 `ink-muted`), label body, meta right-aligned 14 at 80%. Active row `inverse`. |
| SegmentedControl | `mist-deep` pill track, padding 4, gap 4; options h40, 600 15/20 `ink-muted`, optional icon 18; selected `sky`/`on-sky` + soft shadow. radiogroup semantics. |
| RideCard | glass, radius-lg, padding 16/16/16/24, gap space-4. [direction icon 26] [date (label style, 80%) over time 700 22/28] [AvatarStack 28 max 3 over "2 of 4 seats" 13/16, or Tag go "Full" with users icon] [chevron 20 at 70%]. Highlight/selected = gradient `sky`→`sky-glow` 115°, `on-sky`. a11y label "Tue 3/18, 11:00 AM, 2 of 4 seats taken". |
| ContentCard | radius-lg, padding space-5. Tones glass / sky gradient / charcoal (flat). Head: optional index pill ("01") + icon 26 + `heading` title; body 14/20. |
| StatBubble | circle, numeral 56 (small: 34). Real numbers only. |
| Timeline | pills h32, 700 14/20, joined by 2 px dashed `line-strong`. done `sky`; current `inverse` (aria-current step); next `glass` + 1.5 `line-strong` border. Done steps get hidden "(done)". |
| Avatar | circle (or radius-md tile), default 40. Initials (max 2) at 38% of size, weight 700. Tone from name: sum of char codes % 3 → sky, deep (`atmos-deep`/`on-atmos`), charcoal. No name → `surface` + user icon. `ring` = 2 px `mist` outline. |
| AvatarStack | max 3, overlap -10, "+N" chip `mist-deep`. a11y "N riders". |
| Tag | pill h26, px space-3, 600 12/16, optional icon 14 stroke 2. Tones: sky; deep (FlyPal); glass; charcoal (`inverse`); go (`surface`, `go` text + border); outline (`line-strong` border). |
| RiderRow | `surface` pill, padding space-2, gap space-3: Avatar 40, name 600 16/20 over college 13/16 `ink-muted`, optional Tag, phone IconButton sm (charcoal if shared, muted + disabled otherwise, label "Jake hasn't shared a number"). |
| TextField | label 600 14/20 `ink`; pill input h48 px space-5, 1.5 `line-strong` border, `surface` (glass variant: `glass` + `glass-edge`); focus border `sky-deep` + ring; hint 13/16 `ink-muted` indented space-5; error → `danger` border + hint. |
| SeatStepper | `mist-deep` pill, padding 4; − and + as 40 `surface` circles; value 700 18/24 tabular. Default min 1 max 6; disabled ends 40%. |
| ChatBubble | max 78% width; `surface`, radius-lg with 8 px bottom-left corner; mine = `sky`/`on-sky`, right aligned, 8 px bottom-right. Byline caption `ink-muted` "Niharika · 8:23 AM" (mine shows "You"). |
| ChatComposer | glass pill, padding 6/6/6/24; text input + send IconButton (charcoal sm). Placeholder "Message the ride". |
| BottomSheet | `surface`, top radius-xl, `shadow-lift`, padding 12/24/32; grabber 40×5 `line`; title `title`; body gap space-4; actions row gap space-3, each flex 1. Native: Expo Router formSheet. |
| Backdrop | haze = layered radial gradients over a base. mist: sky 85% @78/22, sky-soft 95% @88/78, white 70% @30/55, sky 45% @8/95 over `mist`. charcoal: atmos-deep 80% @78/28, charcoal 90% @25/60 over `mist` dark. sky: white 16%/12% streaks, atmos 95% @5/0 and 80% @100/100 over `atmos-deep`. In Charcoal theme the mist backdrop uses the charcoal haze. |
| Plane | see below. Glide: translateX from off-screen right, 2.2 s cubic-bezier(.16,.84,.3,1), overshoots to -6 at 75%, rests at 0. Once. Reduced motion: no animation. |

Glass = `glass` fill + 1 px `glass-edge` + blur `glass-blur` (saturate 140%) + `shadow-glass`.
Never more than two glass layers deep; the inner one becomes `surface`.

## The six reference screens

1. **Welcome** (sky backdrop): plane (w 230, glides in) → display "FlyTag." 76/72 900 `on-atmos` → lead body-lg "Tag along with fellow classmates to and from the airport." → glass Button lg block "Get started" with arrow-right.
2. **Sign in** (mist): AppHeader eyebrow "Welcome to FlyTag", title "Sign in", no avatar → glass panel (radius-lg, padding 20, gap 16): TextField glass "School email" (placeholder you@ucsd.edu, hint), TextField "Display name" (placeholder "What riders call you"), primary lg block "Let's go".
3. **Rides** (mist): AppHeader eyebrow "Rides from campus", title "UCSD", avatar → SegmentedControl "To airport" (plane-depart) / "To campus" (plane-land) → list of RideCards (gap 12, padding 16, first highlighted) → round Fab "Post a ride" centred 104 above bottom → TabBar docked 16 from sides, 20 from bottom.
4. **Post a ride**: Rides screen + scrim + BottomSheet "Post a ride": TextField Date, TextField "Leave campus at", row "Max riders" + SeatStepper (default 4, min 2); actions ghost "Cancel" + primary "Post ride".
5. **Ride** (mist): AppHeader with back, eyebrow "Tue 3/18 · Niharika, Sixth", title "11:00 AM" → Timeline Posted (done) · Matching (current) · At SAN (next) → glass panel "RIDERS · 2 OF 4" with RiderRows (tags Networking sky / FlyPal deep) + sky block "Join ride" (plus icon) → glass panel "CHAT" with a ChatBubble + ChatComposer.
6. **Profile** (mist): AppHeader "Profile" with back, trailing glass IconButton bell "Notification settings" → centred Avatar 88, name 800 28/32, Tags (glass + pin "Sixth College", deep "FlyPal") → Menu: Display name · School email (Verified) · Home college · Notifications (On) · Safety & reporting → TabBar.

## Plane SVG (viewBox `30 14 340 146`, nose left)

```svg
<path d="M152 78L192 50H208L198 78Z" fill="{atmos}"/>
<path d="M324 78L342 64H352L344 78Z" fill="{flare-deep}"/>
<path d="M300 78L336 22C340 16 352 16 352 26L346 78Z" fill="{flare}"/>
<path d="M344 24C347 18 352 20 352 26L346 78H339Z" fill="{flare-deep}"/>
<path d="M40 100C40 86 56 78 80 78H332L362 72C368 71 369 79 364 84L340 110C334 116 326 118 318 118H80C56 118 40 112 40 100Z" fill="{on-charcoal}"/>
<path d="M41 105H346L340 110C334 116 326 118 318 118H80C60 118 46 114 41 105Z" fill="{plane-shade}"/>
<path d="M58 99H344L339 104H50C52 101 55 99 58 99Z" fill="{flare}"/>
<path d="M50 94C54 86 64 82 76 82L74 94Z" fill="{sky}"/>
<g fill="{atmos-deep}"><circle cx="112" cy="90" r="4"/><circle cx="138" cy="90" r="4"/><circle cx="164" cy="90" r="4"/><circle cx="190" cy="90" r="4"/><circle cx="216" cy="90" r="4"/><circle cx="242" cy="90" r="4"/></g>
<path d="M140 106L216 152H238L208 106Z" fill="{sky}"/>
<path d="M216 152H238L234 146H212Z" fill="{atmos}"/>
<path d="M316 106L348 128H362L346 104Z" fill="{flare}"/>
<path d="M348 128H362L360 124H343Z" fill="{flare-deep}"/>
```

Rendered height = width × 146 / 340. Default label "FlyTag airplane"; decorative when label is "".
