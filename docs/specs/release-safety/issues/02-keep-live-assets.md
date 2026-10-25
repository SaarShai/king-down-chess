# Release safety: keep the live build's assets through a publish

Type: task
Status: in-progress

The release review of 2026-10-25 (`origin/main` `4c779072` against `staging/first-game` `a89a9381`) confirmed one P2. A publish through `tools/deploy.sh --publish` removes the content-named files of the live build. That release removed five: `index-CybTdZD_.js`, `entry-BblAJ16t.js`, `main-BD111CZQ.js`, `motion-CYGm_5rj.js` and `runtime-CUtY1z6d.js`. A page of the old build that is still starting at the switch, or that loads a lazy chunk later, gets a 404 for its runtime and shows "Try again". No offline list names the runtime, so the worker cache does not help. This ticket fixes the publish. It deploys nothing.

## Plan and scope

1. New `tools/deploy-keep-assets.mjs <static folder>`. It reads the live `/` and `/sw.js` with no cookie and no redirect. It follows each quoted content name under `/assets/` in each text file that it reads: `/assets/x`, `./assets/x` and `assets/x` everywhere, and `./x` in a file under `/assets/`. It needs HTTP 200 and the content type of the extension for each file. It checks every live file before the first write. It adds each file that the build does not have, and stops when a live file has other bytes than the build file of the same name. It changes no file of the build. It writes `assets/kept-files.json`, the list of the kept names.
2. Retention is one build back: the walk does not read the live list on a normal release. When the live page is the new page (a rerun of the same build, for example after a failed live check), the walk also reads the live list and keeps its files again.
3. `tools/deploy.sh --publish` runs it as step `keep live assets` on the publish copy, after `verify site project` and before `publish`. The tested tree stays as built. Check-only mode and the plugin target do not change.
4. `tools/deploy-live-check.mjs` also compares every file under `assets/` of the published folder: the new files (also the lazy chunks that no worker list names) and the kept files. The checks of the new files stay as they were.
5. `index.html`, `sw.js`, the CSP and the routes do not change.

## Verification

To do.

## Comments
