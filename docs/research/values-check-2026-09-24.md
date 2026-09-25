# Values check — 2026-09-24

> Recovery status, 2026-09-24: Point-in-time value audit. Ogre 318 is now adopted on the clay base; Catapult remains 400 in the product, distinct from the 156 exploration override. [Catalog and qualifications](../cursor-recovery/2026-09-24-0213b442/RESEARCH.md) · [Adoption record](../cursor-recovery/2026-09-24-0213b442/EXECUTED.md).

Compared adopted piece values in `docs/RULES.md` (decisions 15–18 and the value refresh under the adopted archer) to the constants in `src/ai/eval.ts`. Shipped pool is `QORRBBNNAAGMMSS` with ogre push; Paladin (`L`) remains legal but is not in the random pool.

**Verdict: match. No change to `src/ai/eval.ts`.**

| Letter | Piece | Constant | Centipawns | Adopted decision |
|--------|-------|----------|------------|------------------|
| P | Pawn | `PAWN_V` | 100 | Anchor (fit never moves it) |
| N | Knight | `KNIGHT_V` | 316 | Texel fit |
| B | Bishop | `BISHOP_V` | 322 | Texel fit |
| R | Rook | `ROOK_V` | 449 | Texel fit |
| Q | Queen | `QUEEN_V` | 933 | Texel fit |
| K | King | — | 0 | Never traded |
| A | Archer | `ARCHER_V` | 505 | Decision 16: `plusDiagFwd2` → 337 → 505 |
| L | Paladin | `PALADIN_V` | 408 | Decision 15 (`nonPawn`) + values refresh fixed point under adopted archer |
| G | Guard | `GUARD_V` | 96 | Immortal wall (decision 9); material scan out of band; 96 kept |
| M | Maester | `MAESTER_V` | 318 | Values refresh fixed point under adopted archer |
| S | Beast | `BEAST_V` | 434 | Decision 17: blind spot removed → 4.34 pawns (377 → 434) |
| O | Ogre | `OGRE_V` | 318 | Decision 18: ogre push in pool; push reading fair at 318 |
| C | Catapult | `CATAPULT_V` | 400 | Lab seed (not in pool) |
| V | Reaver | `REAVER_V` | 400 | Lab seed (not in pool) |
| T | Templar | `TEMPLAR_V` | 350 | Lab seed (not in pool) |

No `eval.test` file exists; none was added.
