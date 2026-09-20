# The Templar (T) — built, measured, rejected (2026-09-17)

The fourth proposed piece (`docs/PIECES-PROPOSED.md` #4): a king-step anywhere, a **queen on a
capital square** (d4 e4 d5 e5). The idea is a zone — the centre becomes a prize worth fighting for.
The measurement says the fight never starts.

## What was built

- Piece type 15 (`T`) through every seam: letters, generation (queen rays on a capital, king-step
  off it), the `isAttacked` mirror (**two** branches: adjacency for the king-step, queen rays for a
  capital), Zobrist slot, FEN, mating material, browser click path and guide text.
- A zero PST plus a hand-set `TEMPLAR_ON_CAPITAL = 120` location bonus as the second experiment —
  the proposal itself asked for "a location bonus in the evaluation".
- Tests: off-capital king steps, on-capital queen moves, attack agreement via `crossCheckAttacks`
  (which caught a missing adjacency branch within seconds), FEN, pool/promotion exclusions, mating
  material.

## Measurements (depth 3, 16 workers; odds 300 games, composition 2,000 paired games vs the np-N
knight control on identical ranks and opening seeds)

| reading | odds vs a knight | implied value | composition vs knight control |
|---|---|---|---|
| no location bonus | −64 ± 34 Elo | **2.15 ± 0.53 pawns** | decisive **−5.4 ± 2.7 pts**, draws 25.2% → 30.6%, plies +8.6 ± 3.1, balance +1.1 ± 2.6 |
| `TEMPLAR_ON_CAPITAL = 120` | −49 ± 36 Elo | **2.39 ± 0.56 pawns** | decisive **−2.5 ± 2.6 pts**, draws 25.2% → 27.7%, plies +5.3 ± 3.0, balance +1.5 ± 2.6 |

**The piece barely visits its own mechanic.** Only **4%** of its moves start on a capital — 8% with
the bonus. At depth 3 the search will not camp on a central square for a queen payoff it does not
value; so the Templar plays as a weak king-stepper that lengthens games and adds draws.

## Verdict

**Rejected as a candidate; kept as a lab piece only** (it is not in `POOL` or the promotions). The
bonus moved both the occupancy (4% → 8%) and the game metrics (−5.4 → −2.5 decisive) in the right
direction, but neither cleared its interval, and raising it further would just make one piece
dominate four squares — a different design. This is the project rule applied: *a failed candidate is
a completed experiment, not permission for an unlimited tuning campaign.*

**Insight for the loop:** a "contested zone" needs something else in the game to make the zone worth
holding. The Ogre's shove and the Catapult's lob interact with a square, but no shipped piece scores
the centre; a zone mechanic on a single piece carries the whole burden and the search correctly
ignores it. If a capital idea returns, it should arrive with several pieces or a rule that pays for
the zone (e.g., a promotion-like reward), not as one piece's private bonus.

## Jev interestingness

With measured parameters (`tools/jev-interest.ts`, 3 runs, controls valid), the Templar scores
**2.23/3** — above the shipped median (promotion 2.08, beast 2.07). The tension is real: *interesting*
and *good for the game's stated priority* are different axes, and this piece is the clearest example
of the gap so far. Both numbers belong in the next build decision.
