# Kings' powers tournament: deal-nosalv2

3500 of 3500 games, depth 3, 2 entrants. Rules: `{"markFree":true,"hasteCaptures":false,"strikeCaptures":false,"strikePawns":false}`.

## Same hand for both sides

Each entrant against itself: White's score (50% = no first-move edge), the share of drawn games, the length in turns (a free mark or a Haste is one turn with its move) and the cards played per side, with 95% intervals over pairs (one army each); Δ columns are differences from `none` on the same armies.

| entrant | White % | ±95% | draws % | ±95% | turns | ±95% | Δ White | ±95% | Δ draws | ±95% | Δ turns | ±95% | cards / side | pairs |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| cards6 | 51.0 | 2.3 | 7.6 | 1.2 | 84.1 | 2.2 | -0.3 | 3.1 | -10.5 | 2.2 | -20.3 | 3.1 | 4.66 | 1750 |
| none | 51.3 | 2.1 | 18.1 | 1.8 | 104.4 | 2.3 | - | - | - | - | - | - | 0.00 | 1750 |

Endings: adjudicatedResign 86.5%, adjudicatedDraw 9.3%, drawRepetition 2.3%, checkmate 0.7%, plyCap 0.5%, draw50 0.5%, drawMaterial 0.2%.

## Source review

This report uses the copied raw and spec in
`sim/out/m1/network-2026-10-09/kd-deal/`. It is an analysis with `reportText` and
`mirrorSection` in `src/sim/tournament.ts`. It plays no games.

All 3,500 scheduled game IDs are present. The two arms each have 1,750 distinct
`backRank|seed` keys and share all 1,750 keys. Each delta uses those shared openings.
The intervals are 95% mean intervals from the report method.

The historical pool is `QORRBBNNAAGMMS`, without Paladin. The 27-card deck has no
Salvation. This measures six cards without Salvation against no cards. It does not
isolate Salvation removal, and it does not measure the current four-card target.
The raw rows have no source or spec-key stamps. The queue names launch commit
`bc1bb04`. The log records 3,500 games in 225.8 min. See the source hashes and limits
in [the evidence review](../evidence-review.md).
