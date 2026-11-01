# Precache the runtime manifest

Status: ready-for-review

## Plan and checks

- Add the public character manifest and the small startup effect modules to the install cache and its version hash.
- Serve the manifest and the effect modules from the network first, with the install copy as the offline fallback. Frame images stay cache first.
- Prove that a fresh install serves the manifest and the effect modules offline.
- Prove that the first online reload after a package deploy gets the new manifest and no art 404s.
- Prove that a change to a frame or effect art file alone keeps the cache version the same.
- Run focused tests, the Vercel build and check, and repeated browser checks on base and head.
- Open a PR to staging/first-game and check CI. Do not merge.

## Evidence

- The two-build test fails on the old worker with a 404 for the renamed frame.
- The focused offline build tests pass: 50 of 50.
- `npm run build:vercel` and `npm run check:vercel` pass. The worker has 193 offline URLs and version 532871b3cfac.
- The manifest is 1,869,531 bytes (460,418 bytes gzipped). Each worker install downloads it again. The 4 startup effect modules add 9,742 bytes.
- Browser checks: base 5 of 5 Chromium and 3 of 3 WebKit pass. Fix head 5 of 5 Chromium and 3 of 3 WebKit pass.
- The browser comparison and PR checks are in the run report.
