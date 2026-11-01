# Precache the runtime manifest

Status: claimed

## Plan and checks

- Add only the public character manifest to the install cache and its version hash.
- Prove that a fresh install serves the manifest offline without a network request.
- Run focused tests, the Vercel build and check, and repeated browser checks on base and head.
- Open a PR to staging/first-game and check CI. Do not merge.

## Evidence

- The new offline test fails on the base worker because it does not handle the manifest request.
- The focused worker, offline build and web check tests pass: 225 tests.
- `npm run build:vercel` and `npm run check:vercel` pass. The worker has 189 offline URLs.
- The browser comparison and PR checks are in progress. See the run report for counts.
