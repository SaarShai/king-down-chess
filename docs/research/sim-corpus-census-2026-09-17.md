# Sim corpus census: beast chains and draw endings

Rules stamp 2026-09-17, depth 3. Compiled 2026-09-20.

## Method

- Files and denominators: five JSONL game files, 1,600 games each, 8,000 records total:
  `sim/out/pb-ab-G-nocap.base.jsonl`, `sim/out/pb-ab-S-fwd.base.jsonl`,
  `sim/out/pb-ab-A-shots.base.jsonl`, `sim/out/pl-guard-near.jsonl`,
  `sim/out/pl-guard-far.jsonl`.
- `pb-ab-G-nocap.base.jsonl` and `pb-ab-S-fwd.base.jsonl` hold the same 1,600 control
  games: the multisets of (`startFen`, move list, `result`, `reason`) match exactly; only
  game order and move times differ. Pooled numbers below therefore use the 6,400 unique
  games of the other four corpora. A pooled count over all five files would count the
  control twice.
- Parsed fields: `startFen`, `moves[].lan`, `result` (1 = White win, 0 = Black win,
  0.5 = draw), `reason`, `stats[].survived`, `events.beastChains`, `rules`.
- Beast capture event: a move whose LAN starts with `S` and holds one or more `x`
  segments (`Sd4xe5`). Chain: two or more (`Sd4xe5xf6`). No `S` move used the `*` shot or
  `!` strike form (0 of 8,000 games), so the `x` count is exact. The parse matched
  `events.beastChains` in all 8,000 games (0 mismatches).
- Draw end positions: every drawn game of `pb-ab-G-nocap.base.jsonl` (334 of 1,600) was
  replayed move by move with the repo engine, rules set from the record. All moves were
  legal, and all 334 final boards matched `stats[].survived`, the record's own final
  census. Replay for the other files was not needed: their records carry the same census.
- Beast present: an `S` in the start back rank, or an `S` move (covers promotion to `S`;
  one game promoted to `S`, and that game already had a beast).
- Intervals are Wilson 95% binomial intervals.

## 1. Beast chains

| Corpus | Games | Beast present | Games with ≥1 chain | Beast captures | Chains | Captures/game | Chains/game | Chain lengths (captures: games) |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| pb-ab-G-nocap.base | 1,600 | 1,240 (77.5%) | 235 (14.7%) | 1,953 | 265 | 1.22 | 0.17 | 2:173, 3:55, 4:17, 5:11, 6:4, 7:3, 8:1, 9:1 |
| pb-ab-S-fwd.base | 1,600 | 1,240 (77.5%) | 235 (14.7%) | 1,953 | 265 | 1.22 | 0.17 | same as the row above (same games) |
| pb-ab-A-shots.base | 1,600 | 1,240 (77.5%) | 239 (14.9%) | 2,006 | 278 | 1.25 | 0.17 | 2:206, 3:42, 4:12, 5:11, 6:1, 7:3, 8:1, 9:1, 10:1 |
| pl-guard-near | 1,600 | 1,080 (67.5%) | 192 (12.0%) | 1,651 | 215 | 1.03 | 0.13 | 2:162, 3:33, 4:6, 5:7, 6:4, 7:2, 9:1 |
| pl-guard-far | 1,600 | 1,200 (75.0%) | 225 (14.1%) | 1,926 | 250 | 1.20 | 0.16 | 2:175, 3:49, 4:13, 5:1, 6:3, 7:1, 8:2, 9:3, 10:1, 11:2 |
| Pooled unique | 6,400 | 4,760 (74.4%) | 891 (13.9%) | 7,536 | 1,008 | 1.18 | 0.16 | 2:716, 3:179, 4:48, 5:30, 6:12, 7:9, 8:4, 9:6, 10:2, 11:2 |

A game with a chain carries 1.13 chains on average (1,008 chains in 891 games). Chains
of 2 or 3 captures are 88.8% of all chains (895 of 1,008).

## 2. Chains and outcome

Pooled unique games (6,400). Decisive = White win or Black win.

| Group | Games | Decisive | Decisive % (95% CI) | Draws | Draw % (95% CI) | White–Black wins |
|---|---:|---:|---|---:|---|---|
| With ≥1 beast chain | 891 | 760 | 85.30% (82.82–87.47) | 131 | 14.70% (12.53–17.18) | 377–383 |
| No beast chain (all) | 5,509 | 4,020 | 72.97% (71.78–74.13) | 1,489 | 27.03% (25.87–28.22) | 2,280–1,740 |
| — beast present, no chain | 3,869 | 2,776 | 71.75% (70.31–73.15) | 1,093 | 28.25% (26.85–29.69) | 1,568–1,208 |
| — no beast at all | 1,640 | 1,244 | 75.85% (73.72–77.86) | 396 | 24.15% (22.14–26.28) | 712–532 |

The with-chain and no-chain intervals do not overlap: a 12.3-point gap. Per corpus the
gaps run +6.5 points (control: 84.7% [79.5–88.7] vs 78.2% [75.9–80.3]), +16.0
(A-shots: 84.9% [79.9–88.9] vs 69.0% [66.5–71.4]), +10.3 (guard-near: 83.9%
[78.0–88.4] vs 73.5% [71.1–75.8]) and +16.4 (guard-far: 87.6% [82.6–91.3] vs 71.2%
[68.8–73.5]). The control corpus alone has touching intervals.

This is a correlation, not a cause. A chain needs a beast, and it marks a capture-heavy
position in which the beast survives long enough to strike twice. Beast presence alone
does not carry the gap: with a beast but no chain, decisiveness is the lowest group
(71.75%), below games with no beast at all (75.85%).

## 3. Draw census

End reasons from each summary file. Cells show the number of draws and its share of that
corpus's draws. Mean plies covers all 1,600 games, not only draws.

| Corpus | Games | Draws | Mean plies | adjudicatedDraw | repetition | material | fifty-move | ply cap | other |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| pb-ab-G-nocap.base | 1,600 | 334 (20.9%) | 110.8 | 266 (79.6%) | 43 (12.9%) | 11 (3.3%) | 7 (2.1%) | 7 (2.1%) | 0 |
| pb-ab-S-fwd.base | 1,600 | 334 (20.9%) | 110.8 | 266 (79.6%) | 43 (12.9%) | 11 (3.3%) | 7 (2.1%) | 7 (2.1%) | 0 |
| pb-ab-A-shots.base | 1,600 | 458 (28.6%) | 118.0 | 382 (83.4%) | 32 (7.0%) | 15 (3.3%) | 9 (2.0%) | 19 (4.1%) | 1 stalemate (0.2%) |
| pl-guard-near | 1,600 | 404 (25.3%) | 116.3 | 306 (75.7%) | 45 (11.1%) | 11 (2.7%) | 25 (6.2%) | 17 (4.2%) | 0 |
| pl-guard-far | 1,600 | 424 (26.5%) | 111.5 | 319 (75.2%) | 53 (12.5%) | 16 (3.8%) | 17 (4.0%) | 19 (4.5%) | 0 |

All decisive games end by `adjudicatedResign` (1,142–1,266 per corpus), apart from one
checkmate in pl-guard-near.

Drawn games of the control corpus (`pb-ab-G-nocap.base.jsonl`, 334 games), final board
read by replay:

| End reason | Draws | Guard on board at end | Mean pieces left (of 32) | Mean plies |
|---|---:|---:|---:|---:|
| adjudicatedDraw | 266 | 123 (46.2%) | 16.84 | 98.1 |
| drawRepetition | 43 | 19 (44.2%) | 17.26 | 107.2 |
| drawMaterial | 11 | 7 (63.6%) | 3.36 | 202.2 |
| draw50 | 7 | 3 (42.9%) | 7.14 | 262.1 |
| plyCap | 7 | 6 (85.7%) | 8.86 | 300.0 |
| All draws | 334 | 158 (47.3%) | 16.08 | 110.4 |

Guard detail: 158 of 334 drawn games (47.3%) end with at least one guard on the board;
149 of those have both guards (307 guards in total), 9 have exactly one.

Material detail: mean 16.08 pieces left (median 16, interquartile range 11.25–21, range
2–30), made of 7.76 pawns and 8.32 other pieces; pawns are 48.3% of the surviving
material. 56 games (16.8%) end with ≤8 pieces; 54 (16.2%) end with ≥24.

Capture proxy, for comparison: a drawn control game makes a mean 15.39 capture events, so
`32 − captures` gives 16.61 pieces against the true 16.08. The proxy differs from the
true count in 140 of 334 games (41.9%): a kamikaze paladin capture removes two pieces
while the LAN records one capture event (179 such events across those games). The
replayed counts above are the true end positions.

## What this suggests

- Beast chains are uncommon and short: 13.9% of unique games (891 of 6,400) contain one,
  and 88.8% of chains capture 2 or 3 pieces. A beast is present in 74.4% of games, so
  most beasts never chain.
- Games with a chain are 12.3 points more decisive than games without one (85.3% vs
  73.0%) and the pooled intervals do not overlap. This is a correlation: chain games are
  a selected, capture-rich set, and the control corpus alone shows touching intervals.
  The effect does not come from the beast alone — beast-without-chain games are the least
  decisive group (71.8%), below no-beast games (75.9%).
- Draws are 20.9–28.6% of games, and 75.2–83.4% of draws end by adjudication rather than
  a rule. The engine rarely plays to a rule draw: repetition 7.0–12.5% of draws,
  fifty-move 2.0–6.2%, material 2.7–3.8%, ply cap 2.1–4.5%.
- Drawn control games are not empty boards: mean 16.1 of 32 pieces remain, about half
  pawns, and a guard survives in 47.3% (both guards in 149 of 334). Only material draws
  strip the board (mean 3.4 pieces); adjudicated and repetition draws keep full
  midgame material.

These numbers describe five corpora at depth 3 under the 2026-09-17 rule stamp.
Adjudicated endings are decisions of the adjudicator, not rule endings.
