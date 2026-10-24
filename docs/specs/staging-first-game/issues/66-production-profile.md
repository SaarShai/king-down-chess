# Replace the six production blocks with a tested production profile

Status: resolved on branch `staging/lane-prodprofile`; not merged, not deployed. Parent: production release plan, section 4.1 (G1–G6).

## What

The new build blocks production on purpose in six places (plan section 4.1). Each block is right for staging, but the production release needs an explicit production profile. This ticket replaces each block with a tested rule. It deletes no guard without a replacement.

## Why

Without this change the production release cannot start. The server answers 503 on every path, website sign-in fails, the deploy script exits, and the live check fails on the new routes. The replacement must keep staging and production apart in both directions.

## Scope

- `tools/deploy.sh`, `tools/staging-config.mjs`, `src/account/public-config.ts`, `tools/plugin-server.mjs` (`WEB_OPERATIONS` only), `tools/deploy-live-check.mjs`, and their tests.
- `docs/HOSTING.md` and the release path in `docs/specs/chatgpt-mvp/release/RUNBOOK.md`.
- No change in `src/rules/` or `src/match/`. No publish, no push, no hosted database.

Lead decisions: D1, the release builds from GitHub main (remote `origin` = `SaarShai/king-down-chess`, added by the lead). Staging mode keeps today's behaviour.

## Acceptance

- Production refuses every staging value, and staging refuses every production value, in the server config, the website config and the deploy guard. Unit tests prove it.
- The production web API stays closed while the 0016 switch row is false: `/api/status` reports `closed`, and each web operation refuses.
- Each new test that tests a changed rule fails on the base code `c4f3d3c3` (red run recorded).
- The changed test files, `npm run typecheck`, `npm run test:docs`, the staging and production builds and `npm run plugin:build:runtime` pass.

## Result

### G1 and G6: `tools/deploy.sh`

- Removed: the exit "production deploy is disabled in this staging repository" when `docs/specs/staging-first-game/plan.md` exists.
- Added, the production deploy guard, before any work in every mode (check, publish, configure, setup, legacy plugin):
  - a non-empty `KINGDOWN_STAGE` or `VITE_KINGDOWN_STAGE` stops the script (exit 2, "production refuses staging settings");
  - a website check or publish needs `VITE_SUPABASE_URL=https://utqzovjmclfyojedmwok.supabase.co` and a key of the form `sb_publishable_[A-Za-z0-9_-]+`. The staging URL, an empty value or a private key stops the script. The message never prints the key;
  - after the build, the step `production artifact` stops when the build holds the staging manifest `staging.json` (the build's staging config, written by `tools/plugin-server-build.mjs` only with `KINGDOWN_STAGE=staging`).
- Only the site build gets the two public `VITE_SUPABASE_*` values. `npm test` and the checks run without them, as on a clean shell.
- D1 and old-repo assumptions: the script keeps a fresh `origin/main`. Today this repo's only remote is `source` (the old local repo), so the script now stops with "add the GitHub remote origin (github.com/SaarShai/king-down-chess)" before it makes a worktree. No other path, remote or branch of the old repo is in the script; the Vercel team, project IDs, CLI version and artifact paths are the same for both repos.

### Release launcher: covered by `tools/deploy.sh`

`tools/deploy.sh --publish` now covers each item of `evidence/staging-release-checks/release-integrated.py`, so this ticket adds no separate launcher file:

| Item | How `deploy.sh` covers it |
|---|---|
| Clean tree | A new detached worktree of fresh `origin/main`; nothing local can enter. |
| Its own `node_modules` | New: when `wt add` links the shared installation, the script removes the link and runs `npm ci`. |
| Byte record of `static/index.html`, `static/sw.js` and the engine archives | New: the step `production artifact` prints the sha256 of each. |
| Unchanged engine archives (11 today) | New: the built archive set must equal the committed `engines/*.mjs` set, and each file must equal the committed file byte for byte. (An archive name is the engine's source hash, not the sha256 of the file, so the step does not compare them.) The existing `engine archive` step refuses a new engine. The count is not fixed in code, because a future engine adds a twelfth. |
| Deploy guard | New: the production guard above, plus the existing team and project check before publication. |
| Publish | Existing: pinned `vercel@62.2.0 deploy --prebuilt --prod` of the tested tree. |
| Live byte check with a 180 s retry | `tools/deploy-live-check.mjs`: default limit now 180000 ms (was 120000), a retry each 5 s. It compares `/`, `/sw.js`, the bundle, each allowlist and precache file and the legal pages byte for byte. |
| `/api/status` | New in the live check (G5). |
| Record | `set -o pipefail; tools/deploy.sh --publish 2>&1 \| tee <evidence>/deploy.log` (documented in `docs/HOSTING.md`). |

### G2: `tools/staging-config.mjs`

- Production mode (`KINGDOWN_STAGE` unset or empty) accepts the production Supabase URL, the production runtime user and the origins `https://kingdown.dev`, `https://kingdown.vercel.app` and `https://kingdown-plugin.vercel.app`. It throws "Production refuses the staging project" for the staging Supabase URL, the staging database host or user, or the staging origin.
- Staging mode keeps each earlier check in the same order. It throws "Staging refuses the production project" for each production target (same match as before).

### G3: `src/account/public-config.ts`

- Production build (`VITE_KINGDOWN_STAGE` unset or empty) accepts the production account project and refuses the staging one.
- Staging build refuses the production project and every project but staging, as before.
- A value of `VITE_KINGDOWN_STAGE` other than `staging` or empty now throws, the same rule as the server's `KINGDOWN_STAGE`.
- The check runs in the browser (`src/account/client.ts`), so a production build without the values builds, and sign-in fails at run time. The deploy guard (G1) therefore requires both values before the build.

### G4: `tools/plugin-server.mjs`

- Every deployed server (staging or production) serves `ENABLED_WEB_OPERATIONS`. A local run without website test keys keeps the empty set. Staging behaviour does not change: staging cannot be local.
- The 0016 `web_account_access` switch keeps each operation closed. The test starts the real production configuration with a mocked pool whose switch row is `enabled=false`. `/api/status` answers `{"account_access":"closed","valid_for_ms":0}`, and each of the 29 other operations answers 503 `UNAVAILABLE`. With the row on, `/api/status` is `open` and an unsigned `GET /api/me/games` answers 401.
- `tools/vercel-check.mjs` still checks a local server (`localDev: true`), so its closed-API checks stay valid.

### G5: `tools/deploy-live-check.mjs`

- `/play`, `/play/`, `/play/profile`, `/play/settings`, `/g/<uuid>`, `/j`, `/j/` must answer 200 with the bytes of the built `index.html` (the routes of `tools/plugin-server-build.mjs`).
- `/play.html`, `/j/deploy-check-inert-token` and `/deploy-check-unknown` must still answer 404 without a redirect.
- `GET /api/status` must answer JSON with `no-store` and `account_access` `closed` or `open`. `GET`/`POST /api` must answer 404 `NOT_FOUND`; `POST /api/status` 405 `NOT_ALLOWED`. An unsigned `GET /api/me/games` and `POST /api/games` must answer 503 `UNAVAILABLE` while closed and 401 `UNAUTHENTICATED` while open. The pass line names the state.
- `tools/deploy-plugin-live-check.mjs` has no 404 rule; it does not change.

### Checks

Each command ran in this worktree, with `PLUGIN_TEST_DATABASE_URL=postgresql://kingdown_test@127.0.0.1:55432/kingdown_lane_prodprofile_test`.

- Changed test files, green: `KINGDOWN_TEST_FILE='{tools/staging-config.test.ts,src/account/public-config.test.ts,tools/plugin-server-config.test.ts,tools/deploy.test.ts}' npm test`: `Test Files  4 passed (4)`, `Tests  166 passed (166)`. Run again after the fix of the engine-archive rule (see "Review fix"): the same two lines.
- Red run: the same command with the base `c4f3d3c3` versions of the five changed source files (only change: `ENABLED_WEB_OPERATIONS` exported, so that the test file loads): `Test Files  4 failed (4)`, `Tests  46 failed | 120 passed (166)`. Every new or changed rule test fails: 8 website config cases, 5 server config cases, 4 production web API cases, 10 deploy.sh cases (staging plan, staging settings, staging manifest, byte record, own `node_modules`, missing remote, and the two engines-setting cases that now forbid any Git call before the check), and 19 live-check cases (app pages, `/api/status`, the switch states, and the passing cases that need the new probes). The unchanged rules pass.
- `npm run typecheck`: exit 0.
- `npm run test:docs`: `Test Files  13 passed (13)`, `Tests  161 passed (161)`. The first run found a secret-like 53-character run in `docs/HOSTING.md` (a ticket link path); the line now names the ticket without the path.
- Staging build, `KINGDOWN_STAGE=staging VITE_KINGDOWN_STAGE=staging VITE_SUPABASE_URL=<staging> VITE_SUPABASE_PUBLISHABLE_KEY=<staging public key> npm run build:vercel`, at the base and at this branch (same worktree, same linked `node_modules`): both exit 0.
  - The 11 engine archives: byte-identical (same sha256 for each).
  - `static/index.html` (`e002f5a0…` → `4c69a2b2…`) and `static/sw.js` (`483d8dae…` → `af1726a8…`): **not identical**. The cause is G3. `public-config` is the only chunk with changed code. `account`, `client`, `entry`, `index` and `main` differ only in the hashed chunk names that they import (byte-equal after the names are normalised). `index.html` and `sw.js` name those chunks. A change of `src/account/public-config.ts` cannot keep these bytes, and G3 requires that change. For a valid staging build the behaviour is the same: the staging project passes, and every other project is refused, as before.
- Production build, stage unset, `VITE_SUPABASE_URL=https://utqzovjmclfyojedmwok.supabase.co`:
  - without `VITE_SUPABASE_PUBLISHABLE_KEY`: exit 0. The build does not refuse; the website refuses at run time in the browser. The deploy guard refuses this shell before the build (test `refuses every staging setting in every mode before any work`).
  - with `VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_test`: exit 0, no `staging.json`, 11 engine archives (the same sha256 as the staging builds). The `production artifact` step of `deploy.sh`, run on this output, prints the byte record and `deploy: 11 engine archives unchanged; no staging manifest` (exit 0).
- `npm run plugin:build:runtime`: exit 0; `plugin-dist/worker.mjs` sha256 `677b4eeaa35113f0cf2b677f1e3650ae512de72485f0ce2c6617383c3af83f0b` (expected value).
- `tools/deploy.sh` with no flag: not run. The tool gate refused the command, and the lane rules forbid any run of `tools/deploy.sh`. It also needs `git fetch origin`, and this repo has no `origin` remote yet, so it would stop at the new remote message (covered by the test `names the missing GitHub remote before it makes a worktree`).
- Full `npm test`: not run; the lead's check list names the changed test files only.

### Open items

- `tools/deploy-plugin-env.mjs` validates the private production environment file for `--configure`. It accepts only the exact production values (origin, Supabase URL, runtime role on the production pooler), so it already refuses the staging Supabase URL, origin and database at `--configure`, before the production server start check (G2). `tools/deploy-plugin-env.test.ts` covers this (ticket 74).
- The lead adds the GitHub remote `origin` and merges `staging/integrate` into main by PR before the release (D1).

### Review fix

The first version of the `production artifact` step also required each archive name to equal the sha256 of the file. The real production build showed that this is false: the name is the engine's source hash. That rule would have stopped every real release. The step now compares the archive set and the bytes with the committed `engines/` files only, and the test uses an archive whose name is not its sha256.

### Review fix 2

Step 0: `git merge staging/integrate` (merge commit `59466817`). `docs/HOSTING.md` conflicted in two lines. The merge keeps both sides' facts: a `--publish` run stops when `KINGDOWN_ENGINES_DATABASE_URL` is absent (integrate), and the site check waits 180000 ms by default, the plugin check 120000 ms (this lane; `tools/deploy.sh` and `tools/deploy-live-check.mjs` hold these values). `npm run test:docs` after the merge: `Test Files  13 passed (13)`, `Tests  166 passed (166)`.

Fixes:

1. `tools/staging-config.mjs` (should-fix). Production now requires its own targets positively, as staging does: `SUPABASE_URL` is `https://utqzovjmclfyojedmwok.supabase.co` (path `/` only, no user, query or fragment); the public origin is in `PRODUCTION_ORIGINS`; the database host is `db.utqzovjmclfyojedmwok.supabase.co`, or a `*.pooler.supabase.com` host with the user `<name>.utqzovjmclfyojedmwok`. Before each comparison, in both modes, the check decodes the host and the user as pg does (`decodeURIComponent`), folds case and removes one trailing dot. A local development server (`localDev`, which `tools/plugin-server.mjs` now passes) skips only the production targets; the server then requires a loopback origin and database, as before. The check of the other stage's targets still runs first. `tools/plugin-server-check.mjs` line 177 now uses production targets, so that its call still reaches the OAuth-ready guard (one direct call: `rejects: Enable Supabase OAuth, …`).
2. `tools/deploy.sh` (nit). Before the fetch, the configured `remote.origin.url` (before any `insteadOf` rewrite) must be `SaarShai/king-down-chess` on GitHub, in https, `git@github.com:` or `ssh://git@github.com/` form, with or without `.git`. Otherwise the script stops with exit 2. The test repository sets the GitHub URL and a local `url.<bare>.insteadOf` rewrite. New tests: four wrong origins stop before `fetch origin` with no call; three GitHub forms pass.
3. `docs/specs/chatgpt-mvp/release/RUNBOOK.md` (should-fix). The line now says that `/api` and every `/api/*` path go to the plugin function (`/mcp`), and that the website API stays closed until the 0016 `web_account_access` switch opens. `tools/vercel-check.mjs` and `tools/plugin-server-build.test.ts` check this route.
4. `tools/deploy-live-check.mjs` (nit). `GET /api/status` must answer `valid_for_ms` 0 when closed and an integer above 0 when open (`src/api/http.ts`). New tests: closed with 5000, open with 0, open with -1. The failure message names the rule, so the existing "unknown state" case now matches the new message.

Checks, with `PLUGIN_TEST_DATABASE_URL=postgresql://kingdown_test@127.0.0.1:55432/kingdown_lane_prodprofile_test`:

- Red run: `KINGDOWN_TEST_FILE='{tools/staging-config.test.ts,tools/deploy.test.ts}' npm test` with the `25bba603` versions of `tools/staging-config.mjs`, `tools/deploy.sh` and `tools/deploy-live-check.mjs` (merge `59466817` does not change these three files): `Test Files  2 failed (2)`, `Tests  20 failed | 144 passed (164)`. Failures: 10 case, trailing-dot and percent-encoded targets (5 per direction), the production accept and production require cases, 4 wrong origins, and 4 status cases (3 new lease cases and the unknown-state case, by its new message). Three new variants already failed closed at `25bba603` and stay as guards: an upper-case `SUPABASE_URL` (WHATWG URL folds https hosts), a percent-encoded pooler user (the old code decoded the user), and an upper-case pooler host with a trailing dot.
- Green: `KINGDOWN_TEST_FILE='{tools/staging-config.test.ts,src/account/public-config.test.ts,tools/plugin-server-config.test.ts,tools/deploy.test.ts}' npm test`: `Test Files  4 passed (4)`, `Tests  195 passed (195)`. `tools/deploy-live-check.test.ts` does not exist; `tools/deploy.test.ts` holds the live-check tests.
- `npm run typecheck`: exit 0.
- `npm run test:docs`: `Test Files  13 passed (13)`, `Tests  166 passed (166)`.
- Full `npm test` and `npm run plugin:server:check`: not run; the review check list names the files above.

### Review fix 3

Commit `99e42a7b`, `tools/deploy.sh` and `tools/deploy.test.ts`:

1. Origin check (should-fix). `git fetch` applies `url.<base>.insteadOf`, so the check of the configured URL alone let a rewrite fetch another repository. The script now also requires the effective URL, `git ls-remote --get-url origin` (after `insteadOf`), to be on the same GitHub list. If either URL differs, it stops with exit 2 before the fetch. No setting turns the check off. The test repository no longer has an `insteadOf` rule: test pushes use the push URL (`remote.origin.pushurl` = the bare remote), and a `git` shim first on PATH forwards each call to the real git. Only for a `fetch` inside the test's temp folder does the shim add a command-line rewrite from the configured origin URL to the bare remote. The script's config and `ls-remote` checks do not see it. New test: an `insteadOf` rule from the GitHub URL to another bare repository stops the script before `fetch origin`, with no stub call.
2. Fetch refspec (nit). The fetch is now `git fetch --quiet origin +refs/heads/main:refs/remotes/origin/main`, so a custom `remote.origin.fetch` cannot put another branch into `origin/main`. New test: with `remote.origin.fetch` = `+refs/heads/other:refs/remotes/origin/main`, `npm test` runs at the commit of `main`, not `other`.

Checks, with `PLUGIN_TEST_DATABASE_URL=postgresql://kingdown_test@127.0.0.1:55432/kingdown_lane_prodprofile_test`:

- Red run: `KINGDOWN_TEST_FILE=tools/deploy.test.ts npm test` with the `79fe625f` version of `tools/deploy.sh` and the new test file: `Test Files  1 failed (1)`, `Tests  2 failed | 130 passed (132)`. The two failures are the two new cases: the `insteadOf` case exits 0 (expected 2), and the refspec case tests the `other` commit.
- Green: `KINGDOWN_TEST_FILE='{tools/staging-config.test.ts,src/account/public-config.test.ts,tools/plugin-server-config.test.ts,tools/deploy.test.ts}' npm test`: `Test Files  4 passed (4)`, `Tests  197 passed (197)`.
- `npm run typecheck`: exit 0.
- `npm run test:docs`: `Test Files  13 passed (13)`, `Tests  166 passed (166)`.
- Full `npm test`: not run; the review check list names the files above.
