# Stone sample: round 2, option a

Status: resolved
Type: prototype

## Scope

The owner asks for a clear stone face on a phone.
Option a uses stone on all buttons. Option b uses stone only on the main
action and the game choices. Saar chooses after he sees the samples.

## Plan and checks

1. Save round 1 and check its image hashes.
2. Keep the board grain at a fixed scale. Add a light bevel and a dark edge.
3. Give all stone menu rows the same inner padding. Check every screen.
4. Measure text contrast, target size, press motion and reduced motion.
5. Measure the asset and the built page. The page stays below 1,000,000 bytes.
6. Build both options and the current page. Capture the same phone and
   desktop screens. Keep the same output paths.
7. Run the affected plugin checks and typecheck. Update the README and commit.

## Acceptance

Text on every stone face has contrast of at least 4.5:1.
All control targets are at least 44 × 44 CSS px.
The press moves 4 px. Reduced motion gives no press movement.
Stone rows have equal inner padding. No text touches a stone edge.
All round 1 images stay in `round1/`. The owner choice stays open.

## Result

The stone face uses the board grain at 96 × 96 CSS px.
The lossless crop is 64 × 64 px at x=8, y=8. It uses 3,392 bytes.
The pale wash is removed. The top and left bevel are light.
The lower edge is dark. The press stays at 4 px.
Text uses dark ink on pale stone and light ink on crimson.
Disabled controls keep full opacity for contrast.

All stone menu rows have a 12 px left gap and 8 px top and bottom gaps.
Profile game rows use the same gaps. The move row and Settings labels
also have a 12 px inner gap.

Only `src/plugin/app.css` and the existing texture crop change.
The words and menu structure stay the same. The owner choice stays open.

## Verification

- The current build and both option builds pass the server build.
- This branch passes all 49 checks in the three affected plugin files.
  `npm run typecheck` passes. No test limit changes.
- WebKit checks 393 × 852 with host insets 102 / 118.
  Chromium checks 1280 × 800. Home stays inline.
- The required set has 51 screen PNGs and nine phone comparisons.
  All 60 round 1 PNGs stay in `round1/` with the same hashes.
- The required captures have 232 target checks across both options.
  A check of all screens and setup sheets adds 358 target checks.
  All targets measure at least 44 × 44 CSS px.
- The smallest text gap in the extra check is 4.31 px.
  No text touches a stone edge. No screen has horizontal overflow.
- Raw pixel contrast is at least 4.82:1 on pale stone and 8.98:1 on crimson.
  WebKit face pixels give 4.90:1 and 9.09:1. The disabled face gives 12.03:1.
- Press motion is 4 px. Reduced motion gives no press movement.
  The keyboard press works. A nested button does not move its parent.
- The built page uses 655,102 bytes. Its MCP resource uses
  657,788 bytes. Both stay below 1,000,000 bytes.
- A source and image review finds no further change necessary for this sample.

The commit gate uses an empty source for secret-value matching.
The owner forbids reads of secret files. All other gate checks stay on.

[Images, risk and checks](/private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/taste/stone/README.md)
