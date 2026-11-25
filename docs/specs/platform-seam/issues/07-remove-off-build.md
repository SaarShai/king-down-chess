# Remove the launch switch and the off build

Status: ready-for-agent when ticket 06 is merged. The owner approved [the spec](../spec.md) and decision 1 on 2026-11-25. The staging pass and the publish need the owner's word.

Blocked by: 06

Class: C. Size: M. Needs a two-account pass on staging and a publish.

## Problem

The switch `KINGDOWN_SOLO_LAUNCH` gives two builds. No form ships the off build. The switch keeps these fork points alive:

- the source rewrites by exact text in `tools/solo-launch.mjs` (two files, three anchors);
- the swap of `next.html` and of its entry (`vite.config.ts:194`), with `src/interface/launch-entry.ts` beside `src/interface/entry.ts`;
- the error-forms filter (`vite.config.ts:161`);
- two service workers, `public/sw.js` and `tools/solo-launch/sw.js`, with a constant `SOLO_LAUNCH = true` and dead branches in the second;
- four legal pages in two copies (`public/`, `tools/solo-launch/`);
- `tools/release/profile.sh` and each script that reads it (`live.sh`, `release.sh`, `staging.py`, `tools/lib/release-browser.mjs`); the export in `tools/ios-sync.sh`;
- the branches on the launch marker in `tools/vercel-check.mjs` and `tools/deploy-live-check.mjs`;
- the condition `inApp && __KINGDOWN_SOLO_LAUNCH__` in `src/account/account.ts:99`.

The rollback that the switch exists for does not work on the release path: `profile.sh` sets the switch to 1 with no condition.

## Change

- `src/online/entry.ts` gets the two calls that the rewrite adds now (`installLocalSolo` before `createBrowserRuntime`, `installAccountControls` after the sign-out controls), written in the source. `tools/solo-launch.mjs` goes, with its import in `tools/plugin-server.mjs:28`.
- `vite.config.ts`: the switch, the filter and the rewrite plugin go. Each place that reads the switch keeps its launch value, with one exception. Line 150 gives the local online stack only when the switch is off (`&& !launch`). That term goes: the stack stays a dev-server mode that `KINGDOWN_LOCAL_ONLINE=1` turns on. The cache list at line 29 names `src/interface/entry.ts`, not `launch-entry.ts`.
- The build still writes `solo-launch.json`: the app router of the installed build, the host routes and the checks read it.
- `next.html` becomes the launch page. `src/interface/entry.ts` starts the platform with no switch; `launch-entry.ts` goes.
- The service worker, in two commits: first move the launch worker to `public/sw.js` (the shipped bytes do not change), then remove the constant and its dead branches.
- The launch copies of the legal pages and `browser-support.js` move to `public/`.
- The built server reads no switch: it gives the launch behaviour when it has a site. The server from source (`tools/plugin-server.mjs:188`, the local online stack) keeps the behaviour that it has today with no switch set. The exemption for the app in `src/api/http.ts` does not change: the installed build depends on it.
- `profile.sh` and the reads of it go. The export in `ios-sync.sh` and its test lines go.
- The run-by-hand workflow `pages.yml` builds the off page at a sub-path. It goes, with its section in `docs/perf/README.md` (decision 1).
- [HOSTING.md](../../../HOSTING.md) and the launch platform spec say what the rollback is now: a revert and a release.

## Tests and tools that read the fork

Each of these fails or goes stale when the fork goes. The change moves each one to the single tree.

- `tools/platform.test.ts`: tests `soloLaunch` and `launchSource`.
- `src/interface/play/merge.test.ts`: reads `tools/solo-launch/next.html` and `src/interface/launch-entry.ts`.
- `tools/privacy-policy.docs.test.ts`: checks `tools/solo-launch/privacy.html`.
- `src/account/account.test.ts:122`: asserts the switch text of `account.ts:99`.
- `tools/release/release.test.ts:280`: asserts the switch in the release run.
- `tools/offline-build.test.ts`: calls `offlineCacheFiles` with the off default and asserts that only the launch build adds `next.html`.
- `tools/cache-registration-check.mjs` and `tools/openai-challenge.test.ts`: read `public/sw.js`, which the first worker commit changes to the launch worker.
- `tools/online-local.test.ts:118`: expects the local online stack with no switch.
- `tools/ios-app.test.ts:34`: asserts the export in `ios-sync.sh`.

The list comes from a search. Before the first edit, the builder searches for each of `KINGDOWN_SOLO_LAUNCH`, `solo-launch`, `launch-entry` and `profile.sh` and adds what the list lacks.

## Tests that fail first

- `src/online/entry.test.ts`: the entry calls `installLocalSolo` before `createBrowserRuntime`. Red today: the source has no such call.
- `tools/service-worker.test.ts`: the default worker answers an offline visit of `/play` with the offline page. Red today for `public/sw.js`.

## Checks

- The builder compares `dist/` of a launch build before and after. Expected differences only: the build hash, the entry chunk, and `sw.js` after the second worker commit.
- The full suite and one full CI run.
- One pass of `npm run online:local`: sign-in and one online move.
- One pass of the dev server at `/next.html`: the new page starts. (The dev server has no route from `/` to `next.html`.)
- A two-account pass on staging: sign-in, an online game, an invite, a solo game with its hand-over, a reload offline.

## Known limits

- After this change, no new commit can build the old home page. A rollback is a revert and a release, or an earlier deployment of the host.
- The second worker commit makes each client fill its cache again, one time.
- The old board stays: the site still sends account solo games to it (`src/online/launch.ts:53`).
- No iOS build is necessary. The installed build keeps its bundle, and the next build gets the same page.
