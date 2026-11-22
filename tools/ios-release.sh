#!/bin/bash
# Make the App Store archive of one origin/main commit: `bash tools/ios-release.sh [--dry-run] [<commit>]` (default
# origin/main). It builds in a new clean worktree, appends the build to ios/release-log.md and stops before the export:
# the upload stays the owner's step (docs/IOS.md). `--dry-run` prints each step and runs none.
set -euo pipefail
dry=no
[ "${1:-}" = --dry-run ] && { dry=yes; shift; }
cd "$(dirname "$0")/.."
commit=$(git rev-parse --verify "${1:-origin/main}^{commit}")
git merge-base --is-ancestor "$commit" origin/main || { echo "ios-release: $commit is not on origin/main" >&2; exit 2; }
main=$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")
tree=$main/.claude/worktrees/ios-release-build
log=$PWD/ios/release-log.md
archive=${TMPDIR:-/tmp}/KingDown-$commit.xcarchive
project=$(git show "$commit:ios/App/App.xcodeproj/project.pbxproj")
build="$(sed -n 's/.*MARKETING_VERSION = \(.*\);/\1/p' <<<"$project" | sort -u) ($(sed -n 's/.*CURRENT_PROJECT_VERSION = \(.*\);/\1/p' <<<"$project" | sort -u))"
step() { printf 'ios-release:'; printf ' %q' "$@"; printf '\n'; [ "$dry" = yes ] || "$@"; }

step git worktree add --detach "$tree" "$commit"
[ "$dry" = yes ] || cd "$tree"
step npm ci
step npm run ios:sync production
if git show "$commit:package.json" | grep -q '"ios:check"'; then step npm run ios:check
else step env KINGDOWN_TEST_FILE=ios/store.test.ts KINGDOWN_TEST_OUT="${TMPDIR:-/tmp}/ios-release-store" npm test; fi
step xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Release -destination generic/platform=iOS -archivePath "$archive" -allowProvisioningUpdates archive
line="- $(date -u +%FT%TZ) | build $build | commit $commit | archive $archive | upload: owner step"
if [ "$dry" = yes ]; then printf 'ios-release: dry run: append to %s\n%s\n' "$log" "$line"; else printf '%s\n' "$line" >> "$log"; fi
printf 'ios-release: owner step: xcodebuild -exportArchive -archivePath %q -exportOptionsPlist %q -exportPath %q -allowProvisioningUpdates\n' \
  "$archive" "$tree/ios/ExportOptions.plist" "${TMPDIR:-/tmp}/upload"
