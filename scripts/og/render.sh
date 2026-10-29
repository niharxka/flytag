#!/bin/sh
# Renders scripts/og/og-image.html to public/og-image.png (1200×630) with headless Chrome.
# Mac only (uses the installed Google Chrome). Run via `npm run og-image`.
set -e
cd "$(dirname "$0")/../.."
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
  --window-size=1200,630 --virtual-time-budget=3000 --allow-file-access-from-files \
  --screenshot="$PWD/public/og-image.png" "file://$PWD/scripts/og/og-image.html" 2>/dev/null
echo "public/og-image.png updated"
