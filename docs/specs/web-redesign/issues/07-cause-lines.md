# 07 · Check and shots show their cause; all sounds in one key

Status: ready-for-agent (the owner approved [the spec](../spec.md) on 2026-10-09)
Blocked by: 03, 05 (W2, for phase 2)

## Scope

- Owner choices: Their turn A (every check gets its cause line, an ember ring on your king and one low note; no red flash); Your move A (a cause line for a take with no contact); Warm joy, with the path step "Rewind undo; the tell; sounds in one key".
- Demo: `feat-their-turn-check` (`checkers` 91–102, `checkLine` 114–123, `drawCause` 163–191, `emberRing` 194–207, `showCheck` 210–219, `shotCause` 325–328).
- Files: `src/move-text.ts` (`checkersOf`) and test; `src/render/renderer.ts` (`Highlights.check` with the checkers, an optional `lastCause`); `src/render/PaintedView.ts` (`drawMarks`); a pure motion module for the ring and line timing (spec rule 8); `src/main.ts` (`refresh`, `commit`, the context words; call lines only); `src/render/sfx.ts` (the low note, one key) and a test; `src/haptic.ts` (a pulse on check); new `tools/verify-their-turn.mjs`.

## Plan

1. [x] `checkersOf(pos)` (pure, beside `threatsIn`): the pieces that give check now, each with its path kind (straight, or an arc for a knight, a leap or an Archer shot over pieces). A frozen piece still counts. It must agree with `inCheck` under every rule flag.
2. [ ] Replace the red ellipse under the king with an ember ring (a bloom of 380 ms, then still) and a thin ember line (`#c4501f`, drawn on in 280 ms) from each checker to the king, above all figures. Both show only after the move lands, and stay while the player reads or selects.
3. [ ] For a shot, a Death Touch take, a Strike capture and a lob, a thin line from the shooter to the taken square stays with the last-move wash until the next move. It follows the shown ply in review and clears on Undo. A check line draws over a shot line.
4. [ ] Words: when the active side is in check and nothing is staged, the context line says "Check! Your move." and the cause on its second line ("Their archer can shoot over f2.", "Strike moved their archer to shoot over f2.", "Their knight attacks your king."). The cause words come from `checkersOf` and the rules in force (spec rule 11). A double check names both pieces. A staged check uses the words of spec §4.9.
5. [ ] Sound: the check note moves from the launch of the move to its landing, and becomes one low note (a triangle from 110 to 98 Hz with 220 Hz). One short vibration pulse.
6. [ ] All sounds in one key: tune the pitched part of every sound in `SOUNDS` (move, capture, check, shove, shot, chain, swap) to the notes of one key that holds the check note (for example A minor). The noise parts do not change. Keep each sound's character and length.
7. [ ] Motion Off and reduced motion: the line and the ring show at once.

## Verification

- [ ] `src/move-text.test.ts`: `checkersOf` agrees with `inCheck` on positions from random legal games under the powers rules and the flags `paladinChecks`, `archerChecks`, Holy Light and Darkness, and under each Archer reading; a frozen checker counts; a double check gives two; a discovered check names the real checker.
- [ ] A sound test: each pitched tone in `SOUNDS` starts and ends on a note of the chosen key.
- [ ] Node test of the ring and line timing module.
- [ ] New check `their-turn` (part 1): after a checking move lands, the highlights hold the checkers and the ring; no line during the animation; the line clears after Undo; the shot line follows review; a staged check shows the staged words, not "Check! Your move."
- [ ] `npm test`, `npm run check:browser` and `plugin-ui` pass. Record the plugin page size. The plugin session knows before the pull request.
- [ ] Rendered sample, 390×844 and 1440×900: an Archer check over pieces; a knight check (arc); a double check; a shot capture line; check while a piece is selected. One phone video with sound: a move, a capture, a check, a shot and a bite chain. The owner's yes, with the date, in Comments.

## Risks

- A wrong `checkersOf` draws a line to no checker. The corpus test guards it.
- A line across figure faces: keep it thin, with a halo.
- A retuned sound can lose its character; the video lets the owner hear it.

## Does not do

- No tell (13), no red flash, no king shake.

## Comments

W5 phase 1 complete. Phase 2 waits for W2.
- Test `checkersOf` at the seam named in the fast plan. Compare it with `inCheck` in seeded legal games under powers rules.
- Add still ember marks as an option. Keep the plugin default. Draw cause lines above figures after landing.
- Move the low check note to landing. Add no vibration.
- Verify with `npm test`, typecheck, `plugin-ui` and the plugin page size. Leave context words, W2 wiring and `their-turn` for phase 2.
- Phase 1: checkers, still ember marks in both views, and the low note at landing. Cut timing, shot lines, vibration and the other sound changes.
- Tests: `VITEST_MAX_WORKERS=2 npm test`: 80 files pass, 1 skips; 1,448 tests pass, 13 skip; 50 scene tests pass. Typecheck and build pass.
- Samples: `SAMPLE=07` gives six renders with no fault in `/tmp/wr-w5-samples`. Phase 2 adds the context words and staged checks, runs `their-turn` twice and the full browser suite, then updates the samples for W2.
- Plugin: default stays; page size 4,291,869 → 4,292,443 bytes. `plugin-ui` passes (15.8 s); `plugin-ui-http` passes (15.5 s) with a disposable local PostgreSQL 17 database ([setup](../../../plugin-preparation.md)).
