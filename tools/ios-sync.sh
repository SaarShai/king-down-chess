#!/bin/bash
# Build the web game for the iOS app and copy it into ios/App: `npm run ios:sync [staging|production]`.
# Staging (the default) uses the staging account project and kingdown-staging.vercel.app for /api; production uses
# kingdown.dev. The account settings are the same public values as the site build of that stage (tools/release/).
set -eu
cd "$(dirname "$0")/.."
stage=${1:-staging}
case "$stage" in
  staging) site=https://kingdown-staging.vercel.app; export VITE_KINGDOWN_STAGE=staging VITE_SUPABASE_URL=https://puhspsyjyzaghmgtkzqd.supabase.co ;;
  production) site=https://kingdown.dev; unset VITE_KINGDOWN_STAGE KINGDOWN_STAGE; export VITE_SUPABASE_URL=https://utqzovjmclfyojedmwok.supabase.co VITE_KINGDOWN_APPLE_SIGN_IN=0 ;;
  *) echo 'usage: npm run ios:sync [staging|production]' >&2; exit 2 ;;
esac
# A store archive takes no test page from the caller's shell, and a production one no Apple sign-in: the value 0 also
# overrides a .env file (decision 3 of docs/specs/platform-seam/spec.md). A staging build takes the Apple switch from the shell.
unset KINGDOWN_TEST_PAGES
VITE_SUPABASE_PUBLISHABLE_KEY=$(node tools/release/publishable-key.mjs "$site"); export VITE_SUPABASE_PUBLISHABLE_KEY
# The app always opens the new page, whatever the website's cutover switch is (decision 83): the build writes the
# launch marker solo-launch.json, and AppRouter sends / to next.html.
export KINGDOWN_SOLO_LAUNCH=1
npm run build
# The app uses its bundled H.264 films. Keep the browser-only AV1 and HEVC files out of the app.
rm -f dist/interface/reveal/*-av1.mp4 dist/interface/reveal/*-hevc.mp4
# The app carries all of dist/ (about 257 MB, mostly character frames): docs/specs/ios-app/issues/09-frames.md.
npx cap sync ios
echo "ios-sync: $stage build copied to ios/App/App/public"
