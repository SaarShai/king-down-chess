# Ship the character animation package

Status: claimed
Type: task

## Plan and checks

- Wait for the attack-bank pull request (213) to merge. Then build from the pinned catalog.
- Build the ready frames as PNG. Convert them to WebP quality 90 with exact alpha.
- Check every frame against its PNG source.
- Run the runtime tests and the browser checks. Do not deploy or merge.

## Review repair plan

- Restore the small offline cache and stop queued art requests offline.
- Keep source records and private metadata out of the published tree.
- Check the runtime, build, timing, both browser engines and CI.

## Second review repair plan

- Start art after page load. Keep the first board frame unchanged.
- Wait for the art queue before the offline switch. Count every refusal.
- Publish only runtime files. Reject unknown effect data and private fields.
- Run focused tests, both browser engines, the Vercel checks, load measurements and CI.

## Third review repair plan

- Wait for worker activation and page load before starting art.
- Prove the online retry, offline gate, public-data guards and deploy checks.
- Strip image metadata, compare pixels, measure both phone profiles and run CI.

## Inputs and delivery

The frozen catalog is in the main checkout at `docs/specs/character-animation-samples/preview/consolidated-animations/`. Its `manifest.json` has SHA-256 `6279af2ef76ba46d75ba10ad5ddc822c67c5d5d78897457a1d13cc6893aed241`. `docs/specs/character-animation-samples/runtime-selection.json` pins that catalog with 478 ready entries. The main checkout was not changed.

`tools/build-character-runtime.mjs` writes a PNG package: 478 banks, 5,421 frames, half scale, 551,274,445 bytes. `tools/convert-character-runtime-webp.mjs` writes `public/character-runtime` as WebP with `quality: 90, alphaQuality: 100, exact: true, effort: 6`. Each asset records `encoding: 'webp-q90-alpha-lossless'`.

The alpha channel stays lossless. The colour channel is lossy at quality 90. `exact: true` keeps the colour of fully transparent pixels. The transparent exterior stays empty, because the encoder keeps the source alpha bytes.

The package has 5,452 files and 124,535,614 bytes. The `manifest.json` SHA-256 is `8e825bee5d52d3a647b56edc8b524ffdbb5c9012f27f019fba320fc18a01063b`. The largest file is `manifest.json` at 2,039,064 bytes, far below the 100 MiB GitHub limit.

This change replaces pull request 212. That pull request used lossless WebP: 5,256 files and 304 MB in Git. Those files never enter staging history.

## Checks

- Every frame, not a sample: alpha matches the PNG source bit for bit. All 5,421 frames and 174,673,535 visible pixels pass.
- Colour error uses the source alpha as weight and skips alpha 0. The error of a pixel is the mean of the three channel differences. Results of 255: mean 3.05, p95 8.5, p99 17.25, p99.9 29.75, max 70.44. The limits are p99 20 and p99.9 40. The stricter largest-channel error gives p99 29.75 and p99.9 52.
- `npm run check:browser character-runtime` passes 25 cases in 76.5 s; it runs `tools/verify-character-runtime.mjs`. The package reports 478 banks and 9,047 frame references, and every frame URL is content-named WebP. On the standard position, the first board requests 13 files and 2,286,068 bytes: 247,004 frame bytes and 2,039,064 manifest bytes.
- `npm run check:browser web-online` passes in 105.3 s. This is the check that failed on pull request 212.
- `npm run build:vercel` and `npm run check:vercel` pass on the built tree with a disposable local database.
- `KINGDOWN_TEST_FILE='**/{character-runtime,character-runtime-package,scene-load}.test.ts' npm test` passes 109 tests in 3 files. `npm run test:docs` passes 187 checks.
- Six contact sheets at game size (90 px body) for pawn, knight, bishop, rook, queen and beast show no visible difference between the PNG and the WebP frame.

## Offline play

Pull request 212 failed the `web-online` check in job `browser-web`. The offline journey counted a frame request from the online page that reached the server after the network switched off; the resting piece prefetches frames in the last moment before the switch.

The runtime asks for no new art while `navigator.onLine` is false. It drops queued frame jobs when the connection goes down and retries after the `online` event. The browser gate waits for the first art warm-up and the frame queue to drain. It counts refusals from the start of the offline switch. The worker keeps optional runtime art out of both lists, as it does for the other optional clips. The offline board uses plain figures.

## Review

The first review found the browser and test faults. The second review used code and product/size lenses. It found the oversized offline install, the queue fault, published source records, and weak tests. This branch repairs those findings. No deploy or merge is part of this task.

## Second review repair evidence

Two independent checks of the prior head say merge after fixes. They confirm the small offline cache and find the late worker, the offline gate order, the extra public file, and gaps in the resume and metadata tests.

- The round 5 runtime starts after page load. On slow 4G, the worker registers at 37.4 s, against 37.2 s on base and 41.3–42.1 s on the prior head. The board is ready at 18.5–18.8 s in three load checks. All three offline reloads pass.
- The browser gate waits for the art warm-up and frame queue. It records the start index before the switch and counts refusals after it. Chromium passes in 143.1 s and WebKit in 136.6 s.
- The build publishes 5,435 runtime files, 119,723,497 bytes. Every file passes the public-file rule. The build rejects unknown effect data and private metadata. Content-named frame files have immutable cache headers.
- The focused runtime, scene, offline build, route and web tests pass 180 cases and 68 board checks. The Vercel build and output check pass with a disposable local database. CI is the full-suite gate.

## Third review

Two independent reviewers checked round 5. The product review said merge. The code review said merge after fixes. They found the weak retry test, late worker activation, offline gate race, private-data gaps, image metadata, missing deploy checks and document differences.

The cold phone check uses 200,000 B/s and 150 ms. The base has no runtime art.

- Without compression: worker registration is 26.7 s on base, 31.5 s on round 5 and 26.6 s on round 6. Activation is 83.1–83.3 s on base, 95.6 s on round 5 and 83.2 s on round 6. First art is at 75.8 s on round 5 and 94.0 s on round 6.
- With compression: worker registration is 53.7 s on base, 53.7 s on round 5 and 53.7 s on round 6. Activation is 82.2–82.3 s on base, 84.0 s on round 5 and 82.3 s on round 6. First art is at 57.8 s on round 5 and 85.5 s on round 6.

Players see plain figures until the art starts. The worker keeps its base timing.

- The focused runtime, scene and build checks pass 154 tests and 68 board checks. The package tests pass seven cases. The live-cache fixture passes and rejects both wrong cache policies.
- The retry test fails with no online listener, a no-op reconnect, and no failure reset. The test worktree is restored after each mutation.
- With a 1 MB/s server, the offline gate waits for 12 frame requests. No runtime request starts in the next three seconds.
- The WebKit offline journey passes in 136.2 s. The Chromium journey passes in 124.0 s.
- Six effect PNGs lose 136,677 bytes of non-rendering chunks. Their decoded RGBA pixels match before and after.
