# Moment lines vs engine special moves — 2026-09-24

> Recovery status, 2026-09-24: Resolved in the adopted game: Strike and Reaver captions are present, with completed and prospective wording. Undo/reload rebuild caption history. Reserve/drop captions remain outside the product. [Catalog and qualifications](../cursor-recovery/2026-09-24-0213b442/RESEARCH.md) · [Adoption record](../cursor-recovery/2026-09-24-0213b442/EXECUTED.md).

Compare: every special move `src/rules/engine.ts` can produce (shove, archer shot, catapult lob, beast chain, maester swap, paladin self-remove, strike, reaver step, drop) against `momentKind` / `LINES` in `src/moment.ts`.

Covered (have a first-time line): shove / shoveGuard, shot / shotDrop, lob, chain, swap / swapKing, paladin, drop / dropSquire.

## Gaps (verbs with no line)

The board stays quiet the first time these happen.

- **strike** — One of your pieces acts like a queen for a single turn (the king's Strike power). No.
- **reaver step** — The reaver took something, then slipped one square away instead of standing on that square. No.
