#!/bin/bash
# Build the web game for the iOS app and copy it into ios/App: `npm run ios:sync [staging|production]`.
# Staging (the default) uses the staging account project and kingdown-staging.vercel.app for /api; production uses
# kingdown.dev. The account settings are the same public values as the site build of that stage (tools/release/).
set -eu
cd "$(dirname "$0")/.."
stage=${1:-staging}
case "$stage" in
  staging) site=https://kingdown-staging.vercel.app; export VITE_KINGDOWN_STAGE=staging VITE_SUPABASE_URL=https://puhspsyjyzaghmgtkzqd.supabase.co ;;
  production) site=https://kingdown.dev; unset VITE_KINGDOWN_STAGE KINGDOWN_STAGE; export VITE_SUPABASE_URL=https://utqzovjmclfyojedmwok.supabase.co ;;
  *) echo 'usage: npm run ios:sync [staging|production]' >&2; exit 2 ;;
esac
VITE_SUPABASE_PUBLISHABLE_KEY=$(node tools/release/publishable-key.mjs "$site"); export VITE_SUPABASE_PUBLISHABLE_KEY
npm run build
# shortcut: the app carries all of dist/ (about 260 MB, mostly character frames); stream the frames before the App Store build.
npx cap sync ios
echo "ios-sync: $stage build copied to ios/App/App/public"
