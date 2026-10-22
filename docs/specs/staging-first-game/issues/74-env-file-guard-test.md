# Test the production environment file guard

Status: resolved on branch `staging/lane-envguard` (from `staging/integrate` `bb2f93b7`); not merged, not deployed.

## What

`tools/deploy-plugin-env.mjs` validates the private production environment file that `tools/deploy.sh --configure` reads. No test covered it. Ticket 66 said wrongly that it does not refuse the staging Supabase URL or origin.

## Why

The script accepts only the exact production values. So it refuses each staging value. A test keeps that true if someone edits the script.

## Scope

- `tools/deploy-plugin-env.test.ts` (new).
- Ticket 66, first open item: the text now matches the script.
- This ticket file.
- No change to `tools/deploy-plugin-env.mjs`: the test found no staging value that the script accepts.

## Acceptance

- The test runs the script as a child process with fake values only. It builds each staging value from `tools/staging-config.mjs`.
- A valid file passes for target plugin and target website. It writes one file for each key (mode 600) in a folder (mode 700). Stdout and stderr hold no value.
- The staging origin (both targets), the staging Supabase URL and each staging database URL are refused. A file mode other than 600, an unknown key, a duplicate key, a missing key and a mail key are refused.
- Each refusal exits 1, writes no output folder, and does not print the refused value.
- `KINGDOWN_TEST_FILE=tools/deploy-plugin-env.test.ts npm test`, `KINGDOWN_TEST_FILE=tools/deploy.test.ts npm test`, `npm run typecheck` and `npm run test:docs` pass.

## Result

- `KINGDOWN_TEST_FILE=tools/deploy-plugin-env.test.ts npm test`: `Test Files  1 passed (1)`, `Tests  10 passed (10)`.
- `KINGDOWN_TEST_FILE=tools/deploy.test.ts npm test`: `Test Files  1 passed (1)`, `Tests  132 passed (132)`.
- `npm run typecheck`: `tsc --noEmit` exits 0.
- `npm run test:docs`: `Test Files  13 passed (13)`, `Tests  166 passed (166)`.

Note: the script does not check the characters of the internal secret. A secret in quotes passes (it needs only 32 characters). This is not a staging risk, so the test does not cover it.
