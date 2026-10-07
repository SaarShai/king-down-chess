# Shipped traffic: what a player sees (2026-09-24)

> Recovery status, 2026-09-24: Historical 24-game traffic sketch, all endings adjudicated. It does not establish the balance of the adopted engine; see the catalog for chain and draw/cap corrections. Catalog and qualifications (`dd34fa5:docs/cursor-recovery/2026-09-24-0213b442/RESEARCH.md`) · Adoption record (`dd34fa5:docs/cursor-recovery/2026-09-24-0213b442/EXECUTED.md`).

Pool `QORRBBNNAAGMMSS`, `ogreMode` `push`, no squire, no catapult in the pool
(`docs/RULES.md` Decision 18). This note answers how often five events show up. It does
not recommend adding a piece or a rule.

Older summaries (`kit-pool-*`, most `pb-ab-O-*`) were played under the previous pool
`QLRRBBNNAAGMMSS` (Paladin letter `L`, Ogre only when forced into a rank). None of those
files stamp today’s pool with shot / shove / chain totals. The counts below for today’s
random pool therefore come from one fresh sketch: **24 games, depth 2, defaults**, id
`shipped-traffic-2026-09-24`. Larger older numbers are quoted only as context.

## The five counts (today’s pool)

Source unless noted: `sim/out/shipped-traffic-2026-09-24.summary.json`,
`.report.json`, and the same run’s JSONL event fields. Stamp on every game line:
pool `QORRBBNNAAGMMSS`, `ogreMode` `push`, `archerShots` `plusDiagFwd2`,
`beastChains` true, `guardCaptures` `none`.

| What the player sees | Count in 24 games | Per game | Source |
|---|---:|---:|---|
| Archer shot | **82** | **3.42** | `report.json` → `events.archerShots` = 82 |
| Ogre shove | **36** | **1.50** | `events.ogreShoves` = 36 (friend 35, enemy 1) |
| Beast chain (≥2 captures in one move) | **12** | **0.50** | JSONL `events.beastChains` entries with length ≥ 2 (8 of 24 games) |
| Guard capture (guard takes something) | **0** | **0** | `degeneracy.guardCapturesPerGame` = 0; piece `G` captures = 0 |
| Draw | **1** | **0.042** (1 of 24) | `summary.json` → `draws` = 1 |

`report.json` also lists `beastChainMoves` = 37. That is every beast *capture move*,
including single takes. The row above keeps the research meaning of a **chain**: two or
more captures in one move (`docs/research/sim-beast-chains-2026-09-17.md`).

Caveat: depth 2 and 24 games are a traffic sketch, not a balance study. White score
0.5625 and mean plies 102.4 in the same summary are noisy.

## What a typical game feels like

- **Archer shots are common.** About three and a half shots a game in the sketch; 16 of
  24 games had at least one. A deeper Ogre-rank arm with push and `OGRE_V` 318 saw a
  similar shot rate: **5,754 shots / 1,600 games = 3.60 per game**
  (`sim/out/pb-ab-O-push-d4-v318.var.report.json` → `events.archerShots`).
- **Ogre shoves show up, but not every game.** Ten of 24 games had a shove; overall
  1.5 per game because the random pool only sometimes draws an Ogre. When an Ogre is
  forced onto both sides of fixed ranks, shove traffic is higher: **3.24 shoves per game**
  in `pb-ab-O-push-d4-v318.var` (5,185 / 1,600;
  `docs/research/sim-ogre-combos-2026-09-17.md` §5), and Phase 3 push pilots reported
  **3.926 friendly shoves per game** on mirrored Ogre setups
  (`docs/research/direct-campaign-phase-3-2026-09-22.md`). Almost all shoves move a
  friend (35 of 36 in the sketch; 5,145 of 5,185 in the v318 arm).
- **Beast chains are occasional flavour.** Half a chain per game in the shallow sketch;
  larger depth-3 corpora under the older pool sat near **0.16–0.17 chains per game**
  (`docs/research/sim-corpus-census-2026-09-17.md`; fresh control
  `docs/research/sim-beast-chains-2026-09-17.md`: 279 chains / 1,600 = 0.174).
- **Draws happen, but this tiny sample understates them.** The sketch has one draw in
  24 (mostly adjudicated resigns). Bigger random-pool play under the previous 15-letter
  pool: **380 draws / 2,000 = 19.0%** (`sim/out/kit-pool-shipped.summary.json`). The
  push / O=318 arm: **382 draws / 1,600**, `drawRate` **0.22875**
  (`pb-ab-O-push-d4-v318.var.summary.json` / `.report.json`).

## What looks silent

- **The guard never captures.** That is the shipped rule (`guardCaptures: 'none'`), not a
  measurement accident. Decision 9 keeps the immortal wall; lab capture toggles stay off
  (`docs/RULES.md`).
- **Enemy ogre shoves are rare.** One enemy shove in the 24-game sketch; Phase 3 push
  reported **0.031 enemy shoves per game** against **3.926 friendly**
  (`direct-campaign-phase-3-2026-09-22.md`). The shove the player notices is usually
  pushing their own piece.
- **Squire and catapult never appear from the random pool.** They are absent from
  `QORRBBNNAAGMMSS` (Decision 18). Custom setup can still place them; that is not
  traffic from a new game.
- **Beast multi-capture chains are not the main beast verb.** Most beast takes are single
  captures; the multi-hop is the rarer highlight (census ~14% of games).

## What must not be changed because it measured near even

These are keep-as-is readings. None of them is an invitation to add a piece.

- **Ogre priced at 318 with push stays fair.** Push vs repel at depth 4 with both arms
  at O=318: white **+0.4 ± 2.4** (score 0.522 → 0.526, paired **+0.004 ± 0.024**), while
  decisive still rose (**+7.1 ± 2.5**) and draws fell (**−7.1 ± 2.4**)
  (`docs/research/sim-ogre-combos-2026-09-17.md` §3; `pb-ab-O-push-d4-v318`). Do not
  reprice or stack extra shove filters without a new measurement — friends-only on top of
  push was **within noise of push alone**.
- **Turning beast chains off does not move the game shape.** Depth 4: decisive
  **−0.005 ± 0.045**, draws **+0.015 ± 0.047** (`sim-beast-chains-2026-09-17.md`). Leave
  `beastChains` on.
- **Paladin-survives-pawn (`paladinKamikaze: 'nonPawn'`) left balance inside its
  intervals** when it shipped (`docs/RULES.md` Decision 15: “the paired A/B moves
  nothing”). The Paladin is out of the random pool now; do not reopen that lever for
  pool balance.
- **No double first turn for Black.** Measured: full pool White 0.533 → 0.472; without
  Paladin it landed **near even (0.490)** (`docs/RULES.md` Decision 14). Keep the normal
  first-move edge.
- **Guard stays a wall that never captures** (Decision 9). Capture and step buffs were
  measured and rejected on identity, not because traffic was missing.
- **Phase 1 wrap:** keep the current Archer, ordinary promotions / draw rules, and the
  simple Beast while people play; inconclusive mate-rate / White-score intervals are not
  a reason to add abilities (`direct-campaign-phase-1-2026-09-22.md`).
- **Phase 3 wrap:** shove-mode pilots did **not** establish an overall superior Ogre rule
  beyond what Decision 18 already shipped; do not expand Guard/arrangement campaigns from
  this note (`direct-campaign-phase-3-2026-09-22.md`).

## Files touched for this note

- Written: `docs/research/shipped-balance-2026-09-24.md` (this file only among docs).
- Run (allowed sketch): `sim/out/shipped-traffic-2026-09-24.{jsonl,summary.json,report.json,report.md}`.
- Read, not resumed: `kit-pool-shipped.summary.json`, `pb-ab-O-push-d4-v318.var.*`,
  phase reports under `docs/research/direct-campaign-*-2026-09-22.md`, `docs/RULES.md`.
