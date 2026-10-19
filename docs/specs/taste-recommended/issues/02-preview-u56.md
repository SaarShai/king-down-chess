# Preview layout faults U5 and U6

Status: resolved

The owner asks for this fix on `taste/recommended` at `2ca46584`.
The scope is the home buttons and the player rows. Keep all words and
44 px coin touch areas. Keep the board size at 393 × 852 with Cards off.

## Plan

1. Add two size tests. Run them on the old code and save both failures.
2. Take WebKit images at 320 × 568 and 393 × 852, with mobile and touch on.
3. Let the home buttons and player coins use a second line when needed.
4. Run the type check and the size tests. Take the same images after the fix.
5. Record the evidence and commit. Do not push or merge.

## Acceptance checks

- At 320 px, both home button labels show in full.
- With Cards and King powers, all coins stay in the frame. Each touch area
  is at least 44 × 44 px. The opponent name is at least 40 px wide and shows
  its first word. Check Black at both phone sizes.
- At 393 × 852 with insets 102/118 and Cards off, the board size stays the same.
- Both new tests fail on `2ca46584` and pass with the fix. No test loses a
  check or gains time. Run only the checks that the owner permits.
- Save the before and after images in the requested `fix/preview-u56/shots/` folder.

## Change

- Below 340 px, the home buttons use separate lines. All words stay the same.
- Narrow player rows put the coins below the portrait and name. The back
  button stays at the top. The row height grows only when the coins need
  the second line. Rows with enough space keep their first layout.
- The fix changes only the plugin CSS. It adds no option or dependency.

## Evidence

- `npx vitest run tools/plugin-preview-size.test.ts` on `2ca46584`: both
  tests fail. The home check finds `Choose a game` cut. The board check
  finds `card-w-3` outside the frame. The opponent name is 0 px wide;
  `Computer` needs 55.82 px. The log records the final test file hash.
- `npx vitest run tools/plugin-preview-size.test.ts tools/plugin-ios-size.test.ts`
  with the fix: all 19 tests pass. The old-code and fixed-code logs have
  the same test file hash. No old check changes. No time limit increases.
- `npx tsc --noEmit -p .`: pass.
- WebKit images use mobile and touch at 320 × 568 with insets 63/84, and
  393 × 852 with insets 102/118. Each size has home and Black board images
  before and after the fix. The board has Cards and King powers on.
- At both sizes, all ten coins stay in the frame. Each coin is 44 × 44 px.
  The opponent name is 55.83 px wide and shows `Computer` in full.
- At 393 × 852 with Cards off, the board stays 384 × 409.59 px. Its position
  also stays the same. Two more images record this check.
- The added rows use board space when Cards are on. The board width changes
  from 218 to 135 px at 320 px, and from 384 to 345 px at 393 px.

Evidence folder:
`/private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/fix/preview-u56/`.
The folder holds `old-tests.log`, `fixed-tests.log`, `typecheck.log`,
`before-sizes.json`, `after-sizes.json`, and ten images in `shots/`.

## Limits

These checks use the local host copy. They do not check a real phone or the
native ChatGPT app. No full browser suite runs. The commit gate uses empty
task sources so it does not read a secret or key file. No push or merge.
