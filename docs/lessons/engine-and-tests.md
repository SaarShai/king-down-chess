# Lessons: Engine and tests

The lessons on the rules engine, the search, the evaluator and the tests. [LESSONS.md](../../LESSONS.md) holds the Always rules and the index of all topic files.

## 2026-10-03 — one mark slot per side for two-sided powers
- A position held one Freeze/Ice Wall mark, so the side it bound could play its own mark and erase it; under `markFree` (the official reading) it then made the forbidden move, and the search found the trick. It lived from the free-mark reading (2026-10-02) until a review of card mode (2026-10-03), because every test marked with one side only. → State that each side can set keeps one slot per side (`Position.marks`); test every two-sided power with both sides using it in turn, before measuring it. (2026-10-03)

## 2026-10-03 — the hash's high half came from the same stream
- The hash's high half was drawn from the same xorshift stream as the low half; xorshift is linear, so the high half was a fixed function of the low one and keys carried 32 bits, not the 52 the comment claimed. → Draw independent halves from independent generators, and test a claim about key width (distinct low halves with equal high halves must exist). (2026-10-03)

## 2026-10-02 — helpers outside the engine after a new move kind
- Two branches built at the same time met in review: the new screens asked the move generator "as if it were the other side's turn" by copying the whole position, so a pending Haste second move came along and the threat markers vanished; and the screen-reader line took the piece on `from` as the mover, which a Freeze (an enemy square) breaks. → After a new move kind or position field lands, check every helper outside the engine that reads `pseudoMoves`, `m.from` or `m.to` (`grep -n "pseudoMoves\|board\[m.from\]" src/*.ts`), and give power moves their own wording. (2026-10-02)

## 2026-10-02 — the random-army pool switched the net off
- The random-army pool gained the Ogre after the residual net was trained, and the evaluator's "lab piece → plain evaluation" fallback quietly switched the net off on about half of all browser games from 2026-09-25 (commit bda05fb) until today, unnoticed. → After any change to `POOL`, check which evaluator a random army actually gets (`evalBoard` vs `evaluateBoard` on a board with each pool piece), and retrain or extend the net. (2026-10-02)

## 2026-10-02 — closures in hot paths under tsx `keepNames`
- tsx compiles with `keepNames`, which wraps every inner arrow function in a naming call; in the attack test's hot loop that cost more than the work. → Keep closures out of hot paths (module-level helpers, precomputed tables) and measure the search with node counts held equal. (2026-10-02)

## 2026-10-02 — sim workers under Node 22 and a hung `npm test`
- Sim workers stopped loading TypeScript under Node 22 (`new Worker(file.ts)` ignores the parent's tsx loader), and the runner waited forever for games a dead worker would never play; the end-to-end test's `execFileSync` blocked vitest's own timeout, so `npm test` hung too. → Start workers through `src/sim/worker-boot.mjs` (`tsWorker()`), and fail the run when a worker exits with games unplayed. A synchronous child process in a test needs its own `timeout`, below the test's. (2026-10-02)

## Merging two code paths behind a flag changed the one I was not touching (2026-09-14)
- **Mistake:** adding `--loss res` to the NNUE trainer, I folded the new residual clip into the shared `target()` with the base defaulting to 0 for the old losses. With base 0 the clip still applied, so `--loss wdl` — the path that produced the shipped net's numbers — silently started fitting the score clipped to ±150 cp. Every test still passed, because no test pinned the old target.
- **Rule:** when a new mode joins an existing function, the old mode must come out bit-identical, and that is a thing to check on purpose: read the merged expression with the new parameter at its default and ask what it computes. Gate the new behaviour on the new state being present (`if (bases)`), never on a neutral-looking default value.

## Selective adoption — 2026-09-24
- A new default invalidates a test's implicit rules, not necessarily its fixture. Keep historical repel regressions explicit while separately checking the new push default; preserve the accepted whole-history repetition repair.
- Search must agree with game endings before ordinary evaluation, including at the capture horizon. Keep checkmate ahead of a fifty-move draw and honor disabled draw rules and a live Strike power; share the material-draw predicate instead of duplicating exceptions.
- Mobile piece guidance in an auto-sized header moved the board under an active touch. Put changing explanations in the scrolling panel and assert stable board bounds across a real touch gesture. Wait for the camera flip to finish before sampling automation coordinates.

## 2026-09-22 — fairy pawn movement invalidates orthodox repetition bounds
An Ogre can shove a pawn backward; a Maester can swap it. Pawn moves reset the fifty-move clock but need not make older board positions unreachable. The legal cycle `Od3>d4-d5`, `d5-d4` in `7k/8/8/8/3p4/2BOK3/8/8 w - - 0 1` repeats with the clock at zero. Search must check full-path/history repetition, including capture/check continuations; the halfmove clock is only for the fifty-move rule. Require a real baseline-failing regression, and distinguish fixing this proven failure from reconstructing an old warm-state stall.
