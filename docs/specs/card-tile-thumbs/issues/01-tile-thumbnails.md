# 01 — Small paintings for the New game card tiles

Status: resolved
Type: task

## Problem

The New game Cards section (F-117) shows 21 card tiles. Twelve tiles show a painting. Each tile loads the full card
painting (491 to 800 px wide), 685 KB for the twelve. A tile shows only a 16:9 window of the painting. That
window is 236 CSS px wide in the 560 px sheet (two columns) and about 153 px on a 393 px phone.

## Design

- `tools/card-thumbs.ts` cuts the centre 16:9 window (the crop of `object-fit: cover`) of each released painting
  at 480 × 270, quality 80 webp, into `src/plugin/assets/card-thumbs/`. 480 px is two pixels for each CSS pixel at
  the 560 px sheet and three at a 393 px phone. The files are committed: CI and the Linux build make no image.
  The tool uses sharp, which the repo already has. Run it again after a card painting changes.
- The thumbnails are plugin assets, not `public/` files. The website precaches each `public/ui` file for offline
  play; the plugin build loads each asset of `src/account-game/art.ts` from `plugin-art/`.
- `cardArt(card, true)` (a tile) uses the thumbnail and loads it lazily. The full card sheet, the board and the
  Collection keep the full painting.
- No server, route or CDN change: the existing `plugin-art/` route serves the new hashed files.

## Result

- The twelve thumbnails are 207 KB in all, against 685 KB for the full paintings (70% less).
- A side by side of the full painting window and the thumbnail shows no visible difference at tile size.
- Known limit: a window from 600 to 899 px wide shows tiles up to 406 CSS px wide. There the thumbnail has about
  1.2 to 1.7 pixels for each CSS pixel. The 512 px full paintings also had less than 2 there.

## Checks

- `tools/card-thumbs.test.ts`: one thumbnail for each released painting and no other file; each is webp, 480 × 270,
  smaller than its painting, and within 6 levels (mean) of a fresh cut of its current painting. Another painting is
  more than 50 levels away. It also checks the 16:9 `.cf-art` window in `app.css` and that the plugin art finds
  each thumbnail.
- `src/plugin/card-face.test.ts`: a tile gets the lazy thumbnail; the full card gets the full painting.
- `tools/plugin-setup-owner.test.ts` (F-117): the tiles request only thumbnails; opening Haste requests the full
  painting.

## Verification

- Red on the old tile code: the new card-face test fails (the tile gets `ui/cards/freeze.webp`); the thumbnail test
  fails (no folder); the F-117 browser test fails (two tile requests are full paintings).
- Green: card-face and thumbnail tests pass 16 of 16. The five F-117 tests of `tools/plugin-setup-owner.test.ts`
  pass 7 of 7. `tools/account-game-build.test.ts` and `src/workshop/powers.test.ts` pass 12 of 12. Doc lints pass
  178 of 178. The type check passes.
- The plugin UI build emits 131 art files, and the page names the same 131. The resource payload is 903,343 bytes,
  under the 1,000,000 byte limit.
- `npm run check:browser plugin-ui` passes (329.9 s).
- Not run here: the full unit suite and the other browser checks. CI runs them on the PR. Independent review and CI
  remain before merge.
