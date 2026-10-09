# 09 · The refusal that teaches, and Take or Shove in the context line

Status: done on claude/web-redesign-int (waits for the owner's yes on the sample)
Blocked by: 04, 05 (`src/haptic.ts`), 08, 10

## Scope

- Owner choice: Your move A (the refusal "Only a king can take a guard." and the take-or-shove choice). Decision D12 (b): Take and Shove in the context line, with Cancel (Advisor A); the demo asks at the square.
- Demo: `feat-your-move` (`shieldMark` 168, the nudge 184, the refusal 457).
- Files: `src/main.ts` (`refuse`, `onSquareClick`, `choosePushOrCapture`; call lines only); a pure `src/why-not.ts` (from today's `whyNot`) and its test; `src/render/marks.ts` (a refusal mark); `docs/2d-first-pieces/board/scene.mjs` and `scene.d.mts` (`nudge`); a pure motion module for the nudge (spec rule 8); `src/render/PaintedView.ts` (an optional `nudge`); `index.html` (`#move-choice` goes); `tools/ux-defects/d10-enemy-card.mjs`; `tools/verify-special-moves.mjs`.

## Plan

1. [x] Keep words only. `whyNot` gives short causes for Guard, Ice Wall, Holy Light, Mercy, Haste, Strike, Frozen, a king in a chain and check. It uses the rules in force.
2. [ ] Cut: refusal marks, nudge and haptic. Kept selection and enemy reads belong to ticket 04.
3. [ ] Cut: new armed-power refusal behavior.
4. [ ] Cut: scene nudge and its motion module.
5. [ ] Cut: Take or Shove in the context line. Keep today's choice dialog.
6. [x] Keep promotion and Sacrifice dialogs.

## Verification

- [x] `src/read.test.ts` checks each refusal cause. No separate why-not module is added.
- [ ] Cut: nudge timing and shelter mark tests.
- [x] `special-moves` keeps the choice, keyboard and stale-choice proofs.
- [x] D-10 keeps the selection after an enemy read. Changed assertions have `Removed-check:` trailers.
- [x] `npm test` and all 13 named browser checks pass. Both plugin modes pass. The plugin page is 4,293,703 bytes.
- [ ] Cut: separate refusal and inline choice sample states.
- [x] The W4 read and verb sample is rendered and inspected at both sizes.
- [ ] The owner's yes on the sample is pending.

## Risks

- `scene.mjs` is shared with the plugin and the trial page; the nudge is opt-in.

## Does not do

- No fan of tiles at the square. Promotion stays a dialog.

## Comments

- W4 wires read taps, I and All rules into W2's context line.
- Legal reach, shove arrows and chosen bite numbers use pure models.
- The fast plan cuts frozen probes, the tip, chain motion, Leap coins, the key line, hover words and refusal motion. The choice dialog stays.
- `VITEST_MAX_WORKERS=1 npm test`: 87 files pass, 1 skips; 1,580 tests pass, 13 skip. All 50 scene tests pass. Type check passes.
- All 13 named browser checks pass. `read-piece` and `verb-marks` each pass twice. The M1 script uses its local fallback.
- Plugin page: 4,291,869 bytes before phase 1; 4,293,703 bytes now. Optional fields keep the default view.
- `SAMPLE=W4`: 14 renders, 0 faults. Both contact sheets are inspected.
- The sample waits for the owner's yes.
