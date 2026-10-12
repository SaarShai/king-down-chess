# Fixed fairy pieces in the native engine

All nine fixed fairy pieces now have native support: Archer, Beast, Guard,
Maester, Paladin and Ogre, plus the lab Catapult, Reaver and fixed Templar.
The checked base variant matches the TypeScript rules engine. The Beast move
list grows as needed; the former fixed action cap is removed. This is a test
prototype, with no merge, deployment or change to the shipped AI.

## Rules and effects

The `kingdown-base` variant uses the explicit rules in each saved `spec.json`.
It has ordinary chess pieces, standard promotions, no castling or en passant,
and the current base draw rules. Cards, king powers, lab rule toggles and custom
workshop designs are outside this contract. The bridge rejects other signatures.

| Piece | Native effect |
| --- | --- |
| Archer | Quiet king step; current far2 shots through blockers; stays when it shoots. |
| Beast | Quiet king step; adjacent capture chains; retains every victim and final square. |
| Guard | Quiet king step; no captures; only a king may capture it. |
| Maester | King step and capture; adjacent friendly swaps; long home-rank king swap. |
| Paladin | Queen rays through friends; stops at enemies; survives a pawn capture and removes itself on other allowed captures; cannot attack a king. |
| Ogre | King step and capture; pushes a neighbouring non-king onto the empty square beyond and follows it. |
| Catapult | Quiet rook move; stationary shot over one enemy screen onto the first enemy beyond. |
| Reaver | Knight move and capture; optional empty orthogonal step after a capture. |
| Templar | King step outside the capital; queen rays from d4, e4, d5 or e5. |

Guard immunity applies to each attacker and each Beast victim. A push and a swap
are not captures. A Paladin can open a discovered check by removing itself; its
own attack cannot check a king. Final-board king safety decides each legal move.

The reference code does not reset the fifty-move clock when an Ogre pushes a
pawn, despite its comment. The port matches the code. The saved last-rank shove
also shows that a pushed pawn does not promote. No rule decision is made here.

## Verification

Both the editable build and a clean clone plus patch pass the same checks:

- 241 positions: 48 directed, 192 seeded mixed positions and one dense chain.
  All fifteen piece types have legal effects checked for both colours.
- 97,353 reference paths collapse to 16,125 distinct legal effects. Each collapse
  has the same resulting reference state. Every native child FEN and check flag
  matches, as do attacks on all 64 squares for both sides.
- The dense fixture has 91,408 paths and 10,196 distinct legal effects, above the
  former 8,192 limit. All effects and child states match; bounded search returns
  a legal reply. A separate path reaches 17 victims.
- Native assertions check make/undo, board/pawn/material and next search keys,
  PSQT, complete TT moves, and promotion/base metadata before, after and across
  undo. Promoted pieces are swapped, pushed and captured. There are 51 sampled
  deep recapture controls, limited by piece/action kind to keep the dense check
  from becoming quadratic.
- All 58 bounded search replies are legal; 16 use a special action. These are
  correctness checks, not a strength match. Mate, stalemate, material and
  fifty-move draws, threefold history and bridge illegal-action controls pass.
- Both ordinary perft controls give 20 / 400 / 8,902. Four variant depth-2 perfts
  match the reference. Ten additional upstream regression cases match the
  untouched pinned binary, including pocket drops, gating and small shogi
  variants. Each requested variant is advertised; start FENs match.
- Native ordinary-chess depth-5 bench passes 47 positions and 35,972 nodes.
  `npm test` passes 122 files and 1,935 tests, with one file and 21 tests skipped.
  All 50 artwork checks pass. The doc check passes 74 tests.

An independent Python parser compares every saved native child state/check field
with the serialized reference fields. It confirms both certification traces are
identical. It is a crosscheck of the recorded comparisons, not a third legality
implementation or an independent reviewer.

Interim evidence is preserved. Promotion base metadata initially used a shogi
form; it is corrected for standard promotion. The next-key check also catches
and fixes the fifty-move clock adjustment. A regression helper initially asked
for unavailable variants; it now requires advertised choices and matching start
FENs. Standard upstream variants suppress a setup announcement by design; the
King Down bridge requires its own announcement. Only `cert-check` and
`cert-rebuild-check` certify the final source and driver.

## Storage and provenance

Card campaign: `fairy-stockfish-base-20261011`. It holds raw transition traces,
explicit settings and fixture FENs, intermediate failures, reports, test logs,
source archives, file hashes, both binaries and the portable patch. Archive
contents are read back and hashed. All 112 native source files match the fresh
rebuild. The binaries differ because debug build paths differ; byte identity is
not claimed. Exact hashes are in `provenance.json` and `artifacts.json`.

Upstream is `9f778da667f6e07dae1e85d3e2ea204fc6dee94d`. The patch is
`tools/fairy-stockfish/kingdown.patch`; the driver is
`tools/fairy-stockfish-port.ts`. The original Archer/Beast evidence remains in
its separate verified snapshot. The final backup receipt is external to the
result tree, so recording it does not cause another snapshot cycle.

## Remaining work

The port is native ARM64 on this Mac, with one search thread and classical
evaluation. M1 and Kaggle are not used for these functional checks. Full King
Down still needs powers, cards and their turn/state rules, complete serialization
and repetition identity for that state, and parity tests for those features.
Workshop designs and rule toggles need their own supported contracts.

The move and TT carry a complete effect, and move lists grow through legal
lists, move picking and search. Search reductions handle large move numbers.
Physical memory and time still bound dense positions: the original 16-victim
artificial-grid perft preflight exceeds its 60-second allowance. The certified
13-victim grid proves parity above the old cap. Do not interpret the storage fix
as a constant-time chain algorithm.

Exchange pruning stays conservative for the whole base variant. Evaluation and
some ordering geometry remain approximate. Native speed, memory, multiple
threads, difficulty levels and playing strength need measurement at equal
budgets before choosing this as the game AI. NNUE stays disabled; training needs
an adapted generator, compatible action/state features and checked data first.

For the ChatGPT plugin, use the existing server-side `chooseMove` worker boundary
first. It can ask a native engine for an action and validate it in the rules
engine before the existing revision-checked save. Players then need no engine
installation. Our Mac binary is not a Linux server binary. A WebAssembly worker
would run on the player's device and needs a patched build plus a real ChatGPT
host check. See [the plugin assessment](fairy-stockfish-plugin-fit-2026-10-11.md).

Staff check: use one portable patch, one shared compound transition path and the
existing reference engine. Grow the move buffers instead of adding a larger
cap. Keep the production adapter, training and UI out of this correctness port.
No new game campaign, rule adoption or merge occurs.
