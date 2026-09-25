# Stale player-facing copy — 2026-09-24

> Recovery status, 2026-09-24: Historical bounded audit, not certification of the final tree. Current rule and playable-build references were reconciled during adoption. [Catalog and qualifications](../cursor-recovery/2026-09-24-0213b442/RESEARCH.md) · [Adoption record](../cursor-recovery/2026-09-24-0213b442/EXECUTED.md).

Checked against current facts: pool `QORRBBNNAAGMMSS` (ogre in, paladin out of the draw); default promotion queen/rook/bishop/knight; 2017 preset still promotes more widely; ogre shove is push; guard is an immortal one-step wall.

Scope: `index.html`, `src/main.ts`, and other player-visible strings under `src/` (guide/hover via `pieceGuide` / `fillPieceGuide`, moment lines in `src/moment.ts`, button titles and prompts). Source files were not edited.

## Mismatches

None.

Live guide lead, pool line, piece rows, hover blurbs, Always-queen title, custom-setup pool prompt, and moment shove lines all match the facts above (pool and promotion/ogre mode read from `POOL` / `GAME_RULES`).
