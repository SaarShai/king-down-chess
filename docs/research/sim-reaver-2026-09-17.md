# The Reaver (V) — built, priced and measured (2026-09-17)

The third of the five proposed pieces (`docs/PIECES-PROPOSED.md` #5). A knight that, after a capture,
may step one square onto an empty square as part of the same move. The proposal's watch note said
"if it dodges every recapture it is too strong; the nerf is one word — the step is orthogonal only."
**That is exactly what happened.**

## What was built

- **Piece type 14 (`V`)** through every seam: `LETTERS`/`NAMES`, `PieceType`, generation in
  `genPiece`, the `isAttacked` knight branch, Zobrist (`SLOTS` 15, the new keys appended so every
  stored key is unchanged), FEN, mating material (a lone leaper is a dead draw), and the browser's
  click path (victim, then landing square) and guide text.
- **Notation `Vb1xc3-d3`** — capture, then step. Checked before the archer's `to === from` shot
  shape, which a step back onto its own square would otherwise print (and parse) as.
- **`reaverStep` toggle**: `any` (the proposal reading) or `ortho` (the measured default).
- **`REAVER_V = 400`** (measured), zero PST, excluded from the pool and the promotion list.
- Six new tests (knight moves, step variants, no capture by the step, LAN round-trip, attack
  agreement via `crossCheckAttacks`, FEN/pool/promotion/mating-material rules); **another test pins
  the default reading to `ortho`**.

## Measurements (depth 3, 16 workers; each odds arm 300 games, each composition 2,000 paired)

| reading | odds vs a knight | implied value | composition vs a knight control |
|---|---|---|---|
| `any` (8 directions) | **+120 ± 36 Elo** at a 3.50-pawn seed; **+188 ± 32** even at 5.04 | **does not converge — overpowered** | decisive **+12.3 ± 2.4 pts**, draws 25.2% → 12.9%, plies −17.8 ± 2.9, balance +2.3 ± 2.7 |
| `ortho` (default) | **+101 ± 35** at 3.50; **+56 ± 36** at 4.74 → **4.04 ± 0.56 pawns**, converging | **~4.0 pawns** | decisive **+7.1 ± 2.5 pts**, draws 25.2% → 18.1%, plies −4.7 ± 2.7, balance +1.1 ± 2.7 (neutral) |

Activity: 11.2 Reaver moves per game, present in 98% of games, surviving 0.96 per game; **87%** of
its captures use the step under `any`, **75%** under `ortho`. So the piece is always on stage, and
the step is its identity rather than an occasional trick — which is also why the full reading breaks
the game: a knight plus a free escape from every recapture is simply worth more than the table can
price.

## Jev interestingness, before and after measurement

`tools/jev-interest.ts` (controls: routine 0.08, highlight 2.92 — valid): the **proposed** Reaver
scored **2.50/3**. Re-scored with the **measured** parameters it drops to **1.93** (ortho reading
1.90), just below the shipped beast chain (2.08). The gap is the aspiration discount: "slips out of
the recapture" sounds like a story, "a knight that steps 75% of the time and is worth four pawns"
sounds like a stat line. **Calibration for future builds: score the measured description, not the
pitch** — and expect a well-behaved piece to land near 2, not 3.

## Verdict

**Lab-only, orthogonal reading.** The full step is rejected on measurement (no fixed point). The
orthogonal reading is a sound, sharp piece: neutral balance, seven decisive points of sharpening,
and a price the lab can converge on. It stays out of `POOL` and the promotion list, and reaches a
board only through `--pool`/`--rule` or an explicit back rank.

Bounded next step if the piece is ever considered for the pool: a depth-4 confirmation of the
`ortho` composition (the depth-3 effect is half the full reading's and could shrink further), and a
Muller step-2 pass (pawn-compensated arms) to pin the 4.04-pawn reading exactly.
