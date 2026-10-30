# Ship the character animation package

Status: claimed
Type: task

## Plan and checks

- Locate the pinned source. Keep the main checkout read-only.
- Convert the retained package to content-named WebP with alpha. Check every frame and compare it with the PNG at board sizes.
- Select a delivery route after checking host limits. Keep the first board independent of animation loads.
- Run the focused runtime and package tests, the character runtime browser check, and the built-output check. Record bytes and limits.
- Commit the checked work and open a pull request to staging. Do not deploy or merge.

## Inputs and delivery

The frozen catalog is in the main checkout at `docs/specs/character-animation-samples/preview/consolidated-animations/`. Its `manifest.json` has SHA-256 `54abc4ff79287f536d2678ec110f86cdad8213a671d4bbaa7f0196869bb0c4fd`. Its frame files are under `assets/`, and its banks are under `banks/`. Git reports the catalog directory as untracked. The retained `public/character-runtime/` package is also untracked there. The branch selection hash matches that package. The main checkout was not changed.

A frozen-source build of 468 banks and 5,225 WebP files matches the retained package conversion in every asset hash and in the full manifest. The final package uses lossless WebP with exact transparent RGB. A quality-90 sample has a low mean error but a high isolated maximum. A near-lossless sample changed alpha values. The lossless setting preserves the source pixels.

The package goes in Git. This adds about 308 MB of file bytes and 5,256 files. The current packed repository is about 837 MiB before this change. [GitHub](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github) blocks files over 100 MiB and recommends repositories below 5 GB. [Vercel](https://vercel.com/docs/limits) states CLI limits of 1 GB for Pro source uploads and 15,000 source files; its output-file rule does not set a count cap. The team hosting record states Pro. The package needs no new bucket, token or build setting. Prebuilt upload behavior is not proved without a deploy.

The service worker does not precache this package. `check:vercel` checks the worker and routes, not every character frame. `deploy-keep-assets.mjs` keeps old Vite files under `/assets/`; it does not retain older `/character-runtime/` frames. A later release that removes a frame may leave an old page without that frame. The runtime falls back to the existing figure. The production byte record covers the shell and engine archives, not this package.

## Checks

- The frozen exporter passes for 468 banks and 5,225 assets. The manifest hash is `b8dd19cb5996b27ff5c31c50c160c7df0b197a5f174bec978cdaa76606da46f8`.
- All 5,225 files decode and have alpha. All RGBA pixels match the PNG source. All corners are transparent. Forty-four source frames have up to 12 nontransparent edge pixels; the output keeps those pixels. A sample of 53 frames at 160 and 360 pixels on black and white has mean and maximum channel error zero with full decoding.
- `npm run build:vercel` and `npm run check:vercel` pass with a disposable local database. The static output has 5,551 files and 326,361,200 bytes. The worker does not precache the package.
- `npm run check:browser character-runtime` passes 24 cases in 74.4 seconds. On a standard position, the first board requests 657,382 frame bytes and 1,983,292 manifest bytes: 2,640,674 bytes in 13 requests. These start after the first board frame. Eight sampled move downloads range from 701,546 to 9,939,762 bytes. The largest includes the selected Rook idle cycle.
- `npm run test:docs` passes 187 checks. The first focused test run found seven cases that assumed early frame loading. Their setup now waits for the first frame and the new deferred load.

The browser check and full frame audit do not prove a deployed preview. The pull request needs an independent review before a merge. No deploy or merge is part of this task.
- `KINGDOWN_TEST_FILE='**/{character-runtime,character-runtime-package,scene-load}.test.ts' npm test` passes 79 selected tests and 67 existing checks. This is not a full suite run. The selected checks cover the deferred first frame, runtime behavior, the frozen exporter and exact WebP conversion.
