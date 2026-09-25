# Standard piece values — 2026-09-24

> Recovery status, 2026-09-24: Point-in-time value audit, retained as evidence. Current values are consolidated in docs/PLAYABLE-CLAY.md; no new fit was performed. [Catalog and qualifications](../cursor-recovery/2026-09-24-0213b442/RESEARCH.md) · [Adoption record](../cursor-recovery/2026-09-24-0213b442/EXECUTED.md).

Compared the six standard chess material constants in `src/ai/eval.ts` to written decisions in `docs/RULES.md`. Fairy values (Archer 505, Ogre 318, Guard 96, Maester 318, Beast 434, Paladin 408) were out of scope for this pass and left alone.

**Verdict: `docs/RULES.md` does not state pawn, knight, bishop, rook, queen, or king material constants.** No contradiction to fix. `src/ai/eval.ts` was not edited.

## Code (`src/ai/eval.ts`)

| Piece  | Constant / binding | Centipawns |
|--------|--------------------|------------|
| Pawn   | `PAWN_V`           | 100        |
| Knight | `KNIGHT_V`         | 316        |
| Bishop | `BISHOP_V`         | 322        |
| Rook   | `ROOK_V`           | 449        |
| Queen  | `QUEEN_V`          | 933        |
| King   | `VAL[K]` / `VALUES[K]` | 0      |

These are the Texel-fit numbers already in the file (pawn anchored at 100; king never traded). This note does not invent replacements.

## `docs/RULES.md`

No adopted decision pins those six constants. Mentions of a knight near 3 pawns or an old engine table (archer 430, beast 350, knight 320) are historical research context, not a current value table to ship against.
