# Fix the web-game-staging and account browser checks

Status: resolved on branch `staging/lane-stagefix` (from `staging/integrate` `6c2920a9`); not merged, not deployed.

## What

`npm run check:browser` on `6c2920a9` fails two checks before the staging release:

1. `web-game-staging` stops at 1.5 s: `Error: Production refuses the staging project`, thrown by the built server (`kingdown-web-game-*/combined/.vercel/output/functions/mcp.func/server.mjs`).
2. `account` stops at 1.2 s: it expects the sign-in buttons `['Continue with Google', 'Continue with GitHub']` and gets `[]`.

## Why

Both checks block the staging release. A check is not weakened or removed to make it pass: each fix removes the cause.

## Scope

- `tools/web-game-check.mjs`: the local server and its signed test sessions.
- `tools/check.mjs`, `tools/lib/checks.mjs`, `tools/check.test.ts`: the build values of the shared check site.
- `src/account/account.ts`: the signed-out notes of the Account screen.
- `tools/verify-account.mjs`: the account check, matched to tickets 05 and 46.
- This ticket file.
- No change to `tools/staging-config.mjs`, `tools/plugin-server.mjs` or `src/account/public-config.ts`: every ticket 66 rule stays as it is.

## Acceptance

- `npm run check:browser web-game web-game-staging account plugin-ui-http-staging home` passes.
- `KINGDOWN_TEST_FILE='{tools/staging-config.test.ts,src/account/public-config.test.ts,tools/plugin-server-config.test.ts,tools/deploy.test.ts,tools/check.test.ts}' npm test` passes.
- `npm run typecheck` and `npm run test:docs` pass.

## Result

### Cause 1: web-game-staging (an interaction of tickets 66 and 67)

`tools/web-game-check.mjs` builds the site and the combined server, then calls `configurePlugin(runtimeSettings, { localDev: true, ... })` with `SUPABASE_URL` set to the account origin of the build. For a staging run (ticket 67, `VITE_KINGDOWN_STAGE=staging`) that origin is the staging project `https://puhspsyjyzaghmgtkzqd.supabase.co`. The check sets `KINGDOWN_STAGE=staging` only after the start, because a staging server cannot enable local personas. So `stagingConfig` runs with no stage. Ticket 67 was green on its base, where a server with no stage accepted any project but the production one. Ticket 66 (`33033fa7`, `d0edd585`) makes a server with no stage refuse each staging target first, also for `localDev`, and `tools/staging-config.test.ts` ("local development skips only the production targets") tests exactly that refusal. The same start path also stops the `staging-login` check (by name only, not in the release list).

A change to the rule would open the refusal that ticket 66 tests. So the fix is in the check: the local server and the signed test sessions use the local test issuer `https://web-proof.supabase.co`. Only the site build names the account project of its stage, because `publicAccountConfig` requires the staging project in a staging build. The website does not read the token issuer; only the server checks it.

### Cause 2: account (older than tickets 66 and 67)

The check fails at `c4f3d3c3`, at `65ddd91c` and at `b23de2b9`, so tickets 66 and 67 do not cause it. Three older changes add up:

- `dacb3c1d` (ticket 04, 2026-10-20) removes the built-in account URL from `src/account/client.ts`; the website reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from the build. `tools/check.mjs` runs `npm run build` without them, so `connect()` throws in the check site.
- `a623da08` (ticket 05) roots the privacy and terms links (`/privacy.html`); the check still expects `./privacy.html`. This is the first failure at `65ddd91c`.
- `b23de2b9` (ticket 46) reads the public auth settings when a signed-out player opens Account, and shows only the enabled providers. The check expects the buttons with no request, and its fake server has no settings answer.

With the build values in place, the check also finds a product fault from ticket 46: the provider check writes "Checking sign-in options…" and then an empty note, so the note of a refused sign-in ("Sign-in did not finish. Please try again.") and the deletion note ("We delete your account in seven days. …") go away when the player opens Account. Sign-out already wrote its note again after the check; the other two did not.

### Fix

- `7ab9cc11` `tools/web-game-check.mjs`: a new `issuerOrigin` (`https://web-proof.supabase.co`) is the server `SUPABASE_URL` and the `iss` of the signed test sessions.
- `784d6590` `tools/lib/checks.mjs` exports `CHECK_SITE_ENV`: no stage, `VITE_SUPABASE_URL=https://web-proof.supabase.co`, `VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_local_test`. `tools/check.mjs` gives these values to the shared site build, so a shell value cannot change the check site. This is a production build that ticket 66 accepts. The fake origin keeps each check away from a real project. A new runner test proves the build values.
- `da9e40be` `src/account/account.ts`: a kept note. A refused sign-in, sign-out and deletion keep their note; the next provider check shows it again after the buttons, once. Sign-out now uses the same rule instead of its own second write.
- `da9e40be` `tools/verify-account.mjs`: the fake server answers `/auth/v1/settings` (Google, GitHub and Facebook enabled). The check waits for the provider buttons, checks no request and no client code before Account opens, then only `GET /auth/v1/settings` with the build key, and the rooted links. Offline, it checks that only Try again shows (ticket 46 never guesses a provider). The six changed assertion lines each have a `Removed-check:` trailer.

### Red runs

- `npm run check:browser account` at `6c2920a9`: `FAIL account 1.4 s AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:`, at `tools/verify-account.mjs:101:12`, `+ []` against the two buttons.
- The same at `c4f3d3c3` (`FAIL account 1.4 s`, `verify-account.mjs:101:12`) and at `b23de2b9` (`FAIL account 1.2 s`). At `65ddd91c` (before ticket 46): `FAIL account 1.3 s`, at `verify-account.mjs:103:12`, `'/privacy.html'` against `'./privacy.html'`.
- `npm run check:browser web-game-staging staging-login` at `6c2920a9`, with the prepared lane database: `FAIL web-game-staging 1.5 s Error: Production refuses the staging project`, `FAIL staging-login 1.5 s Error: Production refuses the staging project`, `check: 2 of 2 failed`.
- The account check with the build values and the check updates, before the product fix: `AssertionError`, `+ 'Checking sign-in options…'` against `- 'Sign-in did not finish. Please try again.'`. With only the refused-sign-in note kept: `+ 'Checking sign-in options…'` against the deletion note.
- The new runner test with the `tools/check.mjs` change undone: `Tests  1 failed | 6 passed (7)`, `AssertionError: expected { Object (VITE_KINGDOWN_STAGE, VITE_SUPABASE_URL, ...) } to match object { VITE_KINGDOWN_STAGE: '', …(2) }`.

### Green runs

Each run sets `PLUGIN_TEST_DATABASE_URL=postgresql://kingdown_test@127.0.0.1:55432/kingdown_lane_stagefix_test`, prepared with `npm run plugin:db:init-test` (`Disposable PostgreSQL schema ready (migrations 0001-0018); every migration is repeatable`).

- `npm run check:browser web-game-staging staging-login web-game plugin-ui-http-staging`: `ok web-game-staging 47.7 s`, `ok staging-login 3.1 s`, `ok web-game 31.2 s`, `ok plugin-ui-http-staging 246.6 s`, `check: all 4 passed`.
- `npm run check:browser account`: `ok account 54.1 s`, with each of its 10 `ok` lines.
- `KINGDOWN_TEST_FILE='{tools/staging-config.test.ts,src/account/public-config.test.ts,tools/plugin-server-config.test.ts,tools/deploy.test.ts,tools/check.test.ts}' npm test`: `Test Files  5 passed (5)`, `Tests  204 passed (204)`.
- `KINGDOWN_TEST_FILE='{src/account/*.test.ts,src/online/*.test.ts}' npm test`: `Test Files  17 passed | 2 skipped (19)`, `Tests  393 passed | 23 skipped (416)`.
- `npm run check:browser web-game web-game-staging account plugin-ui-http-staging home` (at `175cea2b`, clean tree): `ok web-game 31.3 s`, `ok web-game-staging 46.6 s`, `ok account 53.9 s`, `ok plugin-ui-http-staging 247.6 s`, `ok home 8.0 s`, `check: all 5 passed`. An earlier run of the same line passed all checks, but the runner failed `account` with `changed in the checkout: docs/specs/staging-first-game/issues/70-stage-check-interaction.md`, because this ticket was written during that run.
- Full `npm test` (at `da9e40be`): `Test Files  255 passed (255)`, `Tests  4753 passed | 8 skipped (4761)`.
- `npm run typecheck`: `tsc --noEmit` exits 0.
- `npm run test:docs`: `Test Files  13 passed (13)`, `Tests  166 passed (166)`.
