# 0005 · FlyTag also runs as a web app

**Status:** accepted (2026-10-29)

**Decision.** Ship a web build alongside the native app, so UCSD students can use FlyTag from a
link before paying for the Apple Developer Program. Same codebase; Expo builds the web version
with react-native-web.

**What's different on the web**
- `app.json` web output is `"single"` (one page that runs in the browser). `"server"`
  pre-renders on a server, where there's no storage for the saved session, so it crashed.
- `DateTimeField.web.tsx`: the browser's `<input type="date|time">` (the native picker has no
  web version). Metro picks `*.web.tsx` automatically; phones keep the native picker.
- `src/lib/confirm.ts`: React Native's `Alert` does nothing on the web, so Leave / Cancel ride
  use the browser's `confirm` there.
- `WebFrame`: a centred, phone-width column on wide screens.
- Glass uses real `backdrop-filter` blur in browsers; theming uses the dark class (see 0001).
- `Backdrop`'s SVG has an explicit 100% size (unsized SVGs are 300×150 on the web).

**Checked** with headless Chrome: Welcome (plane glides in), Rides, Ride detail, Chat, Post a
ride, Profile all render with real data and no console errors.

**Not yet.** Hosting it publicly needs a hosted Supabase project and real email for sign-in
codes (the local Mac stack only works on your Wi-Fi). Web push is separate from app push and is
not built.
