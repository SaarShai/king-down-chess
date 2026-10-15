# Stone sample: round 3, option b

Status: resolved
Type: prototype

## Scope

The owner asks for a clear selected state and no visible grain repeat.
The scope of each option stays the same. Saar chooses the option.

## Plan and checks

1. Move round 2 images to `round2/`. Check their hashes.
2. Give checked stone a dark face, light text and a 3 px gold ring.
   Remove its lower edge. Read the state from checked or aria-checked.
3. Use one large grain image per control. Change the crop position on
   nearby controls. Join eight inner board crops with 8 px overlaps.
4. Check selected and clear states in light and dark mode on a phone.
   Check text contrast of at least 4.5:1, 44 px targets and reduced motion.
5. Build all three pages. Keep each page below 1,000,000 bytes.
   Keep page growth from round 2 below 40,000 bytes.
6. Capture the same screens. Add the close selected-row comparison.
7. Run the affected plugin tests and typecheck. Update the README and commit.

## Result

Checked stone has a dark face, light text, a 3 px gold ring and an inset
shadow. It has no lower outer edge. CSS reads checked or aria-checked.
It adds no state class or script. Existing aria-pressed button marks stay.

The 232 × 120 px texture joins eight 64 × 64 px inner board crops.
Their top-left points are (8, 8), (168, 8), (488, 8), (88, 88),
(408, 88), (568, 88), (8, 168) and (168, 168). Each join blends 8 px.
The crops have no dark corners. The CSS uses one image with no repeat.
Its width is at least 384 CSS px. Three crop positions give nearby controls
different grain. The original board image stays unchanged.

Only the shared stone rules, the existing texture, one plugin test and
this ticket change. The scope of this option stays the same.
The owner choice stays open.

## Verification

- The current build and both option builds pass the server build.
- This branch passes 50 tests across the three affected plugin test files.
  Typecheck passes. No test limit changes.
- The new test changes each segment choice in light and dark mode.
  The selected and clear faces follow the native checked state.
- WebKit checks a 393 × 852 phone with host insets 102 / 118.
  Chromium checks 1280 × 800. Home stays inline.
- The required views give 266 target checks across both options.
  All screens and setup sheets give 356 extra checks.
  All targets measure at least 44 × 44 CSS px.
  No text touches a stone edge. The smallest gap is 4.31 px.
- Raw contrast is at least 4.82:1 on pale stone, 9.46:1 on selected stone,
  and 8.61:1 on crimson. Light and dark checks give the same result.
  Disabled faces give 12.03:1.
- Press motion is 4 px. Reduced motion gives no press movement.
  The keyboard press works. A nested button does not move its parent.
- The texture uses 22,384 bytes. It grows by 18,992 bytes from round 2.
- The built page uses 655,641 bytes. It grows by 699 bytes.
  Its MCP resource uses 658,327 bytes. All pages stay below 1,000,000 bytes.
  Page and asset growth together are 19,691 bytes, below 40,000 bytes.
- The set has 54 screen PNGs and ten phone comparisons.
  `compare/selected-phone.png` shows the three segment rows at phone size.
  The light and dark New game PNGs match on both branches.
- All 102 round 2 PNGs stay in `round2/` with their original hashes.
- A source and image review finds no further change necessary for this sample.

The commit gate uses empty secret sources because the owner forbids secret
file reads. All other gate checks stay on. The checks use a local host copy.
They do not test the native ChatGPT iOS app or an OpenAI submission.

[Images, checks and crop recipe](/private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/taste/stone/README.md)
