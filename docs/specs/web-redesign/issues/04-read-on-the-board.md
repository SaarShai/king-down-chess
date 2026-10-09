# 04 · Tap to read: the words and the reach of a piece

Status: done on claude/web-redesign-int (waits for the owner's yes on the sample)
Blocked by: 03

## Scope

- Owner choice: Reading a piece, A, tap to read (the words in the fixed line; "its reach shows on the board"). Hold is out.
- Demo: `feat-hold-to-read` (`LINE`, the one-line piece texts; `reachOf` 86–101, `attacksOf` 108–127, `infoFor` 202–236, `drawReach` 313–355). Its tip says "Tap or hold"; here it says "Tap". The demo's words are a model only: the app's words come from the rules in force (spec rule 11).
- Files: new `src/read-text.ts`, `src/read.ts` and their tests; `src/render/renderer.ts` (an optional `Highlights.read`); `src/render/marks.ts` (reading shapes); `src/render/PaintedView.ts` (pass the field); `src/main.ts` (the read, the selection, the I key, the tip); `docs/visual-design/verify.mjs`; `tools/ux-defects/d10-enemy-card.mjs`; new `tools/verify-read-piece.mjs`.

## Plan

1. [x] Reuse the first sentence from `pieceGuide`. Show the name, Frozen and Ice Wall. No new word module.
2. [x] `reachOf` uses real legal moves from the piece's side. It clears Haste and free marks. It skips armed powers, pass and drops. Frozen attack probes are cut.
3. [x] Add optional `Highlights.read`. The plugin keeps its default.
4. [x] Draw outline rings and the existing shot sight. The other reading shapes are cut.
5. [x] Wire own, enemy, waiting and review taps. An enemy read keeps the selected piece. Review uses the shown position.
6. [x] All rules opens the Guide at the piece. A second tap or an empty tap closes the read.
7. [x] I reads the cursor square with board focus. Enter and Space keep their move role.
8. [ ] Cut: the first-read tip and its stored flag.
9. [x] The Clay look ignores the read field.

## Verification

- [x] `src/read.test.ts` checks piece words, states, reach and refusals under the rules in force.
- [x] Pure tests check taps, kept selection, an off-mark chain tap and Guide types from the shown position.
- [x] `read-piece` checks enemy reach, own legal marks and kept selection. It also checks I and All rules.
- [x] D-10 and `visual-design` pass. Changed assertions have `Removed-check:` trailers.
- [x] `npm test` and all 13 named browser checks pass. Each new check passes twice.
- [x] The plugin page is 4,293,703 bytes. Both plugin browser checks pass.
- [x] Render and inspect the three reads at 390×844 and 1440×900.
- [ ] The owner's yes on the sample is pending.

## Risks

- The read uses legal moves from the piece's side. A waiting turn can still stop play.
- `marks.ts` also draws in the plugin page.
- A rule preset can make a demo sentence false; the tests per rule guard it.

## Does not do

- No hold, no card over the board, no ? lens.

## Comments

- W4 wires read taps, I and All rules into W2's context line.
- Legal reach, shove arrows and chosen bite numbers use pure models.
- The fast plan cuts frozen probes, the tip, chain motion, Leap coins, the key line, hover words and refusal motion. The choice dialog stays.
- `VITEST_MAX_WORKERS=1 npm test`: 87 files pass, 1 skips; 1,580 tests pass, 13 skip. All 50 scene tests pass. Type check passes.
- All 13 named browser checks pass. `read-piece` and `verb-marks` each pass twice. The M1 script uses its local fallback.
- Plugin page: 4,291,869 bytes before phase 1; 4,293,703 bytes now. Optional fields keep the default view.
- `SAMPLE=W4`: 14 renders, 0 faults. Both contact sheets are inspected.
- The sample waits for the owner's yes.
