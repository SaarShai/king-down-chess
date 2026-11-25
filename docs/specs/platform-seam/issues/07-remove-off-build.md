# Remove the launch switch and the off build

Status: needs-triage. Waits for the owner's approval of [the spec](../spec.md) and for decision 1.

Class: C. Size: M. Blocked by: 06. Needs a two-account pass on staging and a publish.

## Problem

The switch `KINGDOWN_SOLO_LAUNCH` gives two builds. No form ships the off build. The switch keeps these fork points alive:

- the source rewrites by exact text in `tools/solo-launch.mjs` (two files, three anchors);
- the swap of `next.html` and of its entry (`vite.config.ts:194`), with `src/interface/launch-entry.ts` beside `src/interface/entry.ts`;
- the error-forms filter (`vite.config.ts:161`);
- two service workers, `public/sw.js` and `tools/solo-launch/sw.js`, with a constant `SOLO_LAUNCH = true` and dead branches in the second;
- four legal pages in two copies (`public/`, `tools/solo-launch/`);
- `tools/release/profile.sh` and each script that reads it; the export in `tools/ios-sync.sh`;
- the branches on the launch marker in `tools/vercel-check.mjs` and `tools/deploy-live-check.mjs`;
- the condition `inApp && __KINGDOWN_SOLO_LAUNCH__` in `src/account/account.ts:99`.

The rollback that the switch exists for does not work on the release path: `profile.sh` sets the switch to 1 with no condition.

## Change

- `src/online/entry.ts` gets the two calls that the rewrite adds now (`installLocalSolo` before `createBrowserRuntime`, `installAccountControls` after the sign-out controls), written in the source. `tools/solo-launch.mjs` goes.
- `vite.config.ts`: the switch, the filter and the rewrite plugin go. Each place that reads the switch keeps its launch value. The build still writes `solo-launch.json`: the app router of the installed build, the host routes and the checks read it.
- `next.html` becomes the launch page. `src/interface/entry.ts` starts the platform with no switch; `launch-entry.ts` goes.
- The service worker, in two commits: first move the launch worker to `public/sw.js` (the shipped bytes do not change), then remove the constant and its dead branches.
- The launch copies of the legal pages and `browser-support.js` move to `public/`.
- The server reads no switch: it gives the launch behaviour when it has a site. The exemption for the app in `src/api/http.ts` does not change: the installed build depends on it.
- `profile.sh` and the reads of it go. The export in `ios-sync.sh` and its test lines go.
- The run-by-hand workflow `pages.yml` builds the off page at a sub-path; it goes.
- [HOSTING.md](../../../HOSTING.md) and the launch platform spec say what the rollback is now: a revert and a release.

## Tests that fail first

- `src/online/entry.test.ts`: the entry calls `installLocalSolo` before `createBrowserRuntime`. Red today: the source has no such call.
- `tools/service-worker.test.ts`: the default worker answers an offline visit of `/play` with the offline page. Red today for `public/sw.js`.

## Checks

- The builder compares `dist/` of a launch build before and after. Expected differences only: the error-forms list, the build hash, the entry chunk, and `sw.js` after the second worker commit.
- The full suite and one full CI run.
- A two-account pass on staging: sign-in, an online game, an invite, a solo game with its hand-over, a reload offline.
- One pass of the dev server: the new page starts as it does on the site.

## Known limits

- After this change, no new commit can build the old home page. A rollback is a revert and a release, or an earlier deployment of the host.
- The second worker commit makes each client fill its cache again, one time.
- The old board stays: the site still sends account solo games to it (`src/online/launch.ts:52`).
- No iOS build is necessary. The installed build keeps its bundle, and the next build gets the same page.
