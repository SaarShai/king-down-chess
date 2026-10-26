# 01 — Small paintings for the New game card tiles

Status: resolved
Type: task

## Problem

The New game Cards section (F-117) shows 21 card tiles. Twelve tiles show a painting. Each tile loads the full card
painting (491 to 800 px wide), 685 KB for the twelve. A tile shows only a 16:9 window of the painting, in two
columns. The widest window is 264 CSS px, in a 640 to 899 px frame (ChatGPT inline is 760 px), where the New game
box is 560 px. It is 223 px in the 560 px sheet and 139 px on a 390 px phone.

## Design

- `tools/card-thumbs.ts` cuts the centre 16:9 window (the crop of `object-fit: cover`) of each released painting
  at 528 × 297, quality 80 webp, into `src/plugin/assets/card-thumbs/`. 528 px is two pixels for each CSS pixel at
  the widest tile (264 CSS px). A 491 or 512 px painting gets up to 8% larger; that is no less detail than the full
  painting gave. The files are committed: CI and the Linux build make no image. The tool also writes the sha256 of
  each painting to `sources.json` in that folder.
  The tool uses sharp, which the repo already has. Run it again after a card painting changes.
- The thumbnails are plugin assets, not `public/` files. The website precaches each `public/ui` file for offline
  play; the plugin build loads each asset of `src/account-game/art.ts` from `plugin-art/`.
- `cardArt(card, true)` (a tile) uses the thumbnail and loads it lazily. The full card sheet, the board and the
  Collection keep the full painting.
- No server, route or CDN change: the existing `plugin-art/` route serves the new hashed files.

## Result

- The twelve thumbnails are 246 KB in all, against 685 KB for the full paintings (64% less).
- A side by side of the full painting window and the thumbnail shows no visible difference at tile size.
- Each tile has at least two thumbnail pixels for each CSS pixel: 2.0 at the widest tile (264 CSS px), 2.4 in the
  560 px sheet and 3.8 on a 390 px phone.

## Checks

- `tools/card-thumbs.test.ts`: one thumbnail for each released painting and `sources.json`, no other file. The
  sha256 in `sources.json` is that of the current painting, so each repaint needs a new run of the tool. Each
  thumbnail is webp, 528 × 297, smaller than its painting, and within 6 levels (mean) of a fresh cut of its
  painting. Another painting is more than 50 levels away. It also checks the 16:9 `.cf-art` window in `app.css` and that the plugin art finds
  each thumbnail.
- `src/plugin/card-face.test.ts`: a tile gets the lazy thumbnail; the full card gets the full painting.
- `tools/plugin-setup-owner.test.ts` (F-117): the tiles request only thumbnails; opening Haste requests the full
  painting. At a 760 px frame (the widest tile), the loaded thumbnail has at least two pixels for each CSS pixel.

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

## Review fixes

- P2, tile size: the reviewer measured the widest tile at 264 CSS px (frames from 640 to 899 px, ChatGPT inline
  760 px included). There 480 px gave 1.82 pixels for each CSS pixel. The old Known limit (406 CSS px) was wrong.
  The fix cuts 528 × 297. Red on 480 × 270: the new F-117 test fails, "expected 480 to be greater than or equal to
  528". Green: `tools/card-thumbs.test.ts`, `src/plugin/card-face.test.ts` and `tools/plugin-setup-owner.test.ts`
  pass 41 of 41, with the type check.
- P2, stale check: the 6 level mean did not see a repaint of a plain painting. With the centre 30% of sacrifice.webp
  and salvation.webp mirrored, the old test passed 14 of 14. The fix compares the sha256 of each painting with
  `sources.json`. Red: the same two repaints fail the new test (2 of 14), "the painting changed: run npx tsx
  tools/card-thumbs.ts". A new run of the tool writes the same twelve thumbnails, byte for byte. Green: the three
  test files pass 41 of 41 with the type check; `tools/account-game-build.test.ts` passes 4 of 4; doc lints pass
  178 of 178.
