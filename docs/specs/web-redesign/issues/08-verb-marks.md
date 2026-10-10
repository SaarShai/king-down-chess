# 08 · Verb marks: the shove arrow, the Beast chain on the board and the key line

Status: done on claude/web-redesign-int (waits for the owner's yes on the sample)
Blocked by: 04, 10

## Scope

- Owner choice: Your move A, verb marks. Decision D12 (a): a bite gets its number after it is made (Advisor S); the demo numbers the planned bites.
- Demo: `feat-your-move` (`shoveArrow` 133, bite badges 155, `drawTargets` 209–235, `drawChain` 237–253, the target sentences 283–298, `keysFor` 300, the landing tap 430–431, the chain 466–539: `biteTo` slides the Beast and dips the victim; a tap on the Beast is Stop here).
- Files: new `src/marks-model.ts` and test; a pure `chainPreview` (in `marks-model.ts`) and its test; `src/render/marks.ts`; `src/render/renderer.ts` (optional `shoveTo` and `bites`); `src/render/PaintedView.ts`; a pure motion module for the bite slide (spec rule 8); `src/main.ts` (`candidates`, `markTargets`, `refresh`, `onSquareClick`; call lines only); new `tools/verify-verb-marks.mjs`; `tools/verify-special-moves.mjs`; `tools/qa.mjs`.

## Plan

1. [x] `marksModel` uses offered moves for steps, takes, shots, shoves, swaps and chosen bites. It keeps step priority at a shove landing.
2. [x] Show the target ring and a teal arrow at the landing. A unique landing tap plays the shove. The ghost is cut.
3. [ ] Cut: `chainPreview`, the Beast slide and the changed board during a chain.
4. [x] Keep normal take marks before the first bite. Number chosen bite squares. An off-mark tap keeps the chain and gives short words.
5. [ ] Cut: the Leap coin.
6. [ ] Cut: the key line.
7. [ ] Cut: new hover and focus sentences.
8. [x] Keep the swap chase and the shot sight.

## Verification

- [x] `src/marks-model.test.ts` checks Ogre, Beast, Maester and Archer marks, step priority, shove landings and Reaver paths.
- [ ] Cut: chain preview and bite slide timing tests.
- [x] `verb-marks` checks shove play, chosen bite numbers, no early ply, an off-mark tap and Stop here. It also checks swaps and shots.
- [x] `special-moves` and all 13 named browser checks pass. Each new check passes twice. No full browser suite runs.
- [x] `npm test` passes. Both plugin browser checks pass. The plugin page is 4,293,703 bytes.
- [x] Render and inspect shove, two chosen bites, swap and shot at both sizes.
- [ ] The owner's yes on the sample is pending.

## Risks

- Two shoves can land on one square. Only a unique shove accepts a landing tap.
- The bite numbers must stay readable at 375 px with 4 bites.
- A pending chain keeps today's board until the move commits.

## Does not do

- No refusal mark and no Take or Shove buttons (09). No fan of tiles at the square.

## Comments

- W4 wires read taps, I and All rules into W2's context line.
- Legal reach, shove arrows and chosen bite numbers use pure models.
- The fast plan cuts frozen probes, the tip, chain motion, Leap coins, the key line, hover words and refusal motion. The choice dialog stays.
- `VITEST_MAX_WORKERS=1 npm test`: 87 files pass, 1 skips; 1,580 tests pass, 13 skip. All 50 scene tests pass. Type check passes.
- All 13 named browser checks pass. `read-piece` and `verb-marks` each pass twice. The M1 script uses its local fallback.
- Plugin page: 4,291,869 bytes before phase 1; 4,293,703 bytes now. Optional fields keep the default view.
- `SAMPLE=W4`: 14 renders, 0 faults. Both contact sheets are inspected.
- The sample waits for the owner's yes.

## Batch 3 words

- decided by delegation (2026-10-09).
- The chain note is “Nothing moves until you stop.” It does not repeat the read note.
- Stop here counts bites. The play text uses Take, Shove, bite and Tap.
- Pure tests and browser checks cover the chain note and bite count.
- Checks: npm test passes (1,695 tests; 13 skipped). Typecheck and all ten required browser checks pass. Three extra checks pass.
- Sample W4: 28 renders, 0 faults. Both contact sheets are inspected.
## Board review fixes

Decision: decided by delegation (2026-10-09).
Bite digits use the body font at 12 CSS px, in the bottom-right corner.
Four chosen bites stay readable at 375 px. The browser checks the drawn digits.
The shove arrow stays inside its landing square. Its phone stroke is thicker.
Optional W4 9 waits: a read sign must stay distinct from selection.
W4: 30 inspected renders, 0 faults. Tests and all nine required checks pass.

Item 5: decided by delegation (2026-10-09). Bite digits use 14 CSS px lining type and 7 CSS px badge radii. The browser measures the actual visible glyph through measureText and the canvas scale. All four digits pass 8.5 CSS px at 375 px. The first final3 images show that larger circles cover the figures. The smaller circles sit at the cell corner and keep clear of the figures.

Item 11: decided by delegation (2026-10-09). Web bite badges use an 8 px radius on phones. The plugin keeps its old default. The font check rejects the body font. Bold digit records stay separate from rank labels; each measured digit is bold. Unit and verb-marks checks pass.
