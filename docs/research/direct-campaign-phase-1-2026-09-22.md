# Phase 1 — current-game confirmation

Artifact paths below are relative to `/Users/za/.local/share/king-down-supervised-20260922/integration`.

Accepted automated evidence: **6,600 study records, 6,599 full endings and one 512-ply cap**. All records pass source/spec/start identity and full legal/event/ending replay. The cap remains unknown, not a draw. Separate operational trials: 96 games; selected endgame diagnostics: three. Total phase budget used: **6,699 / 10,000** physical games.

Source `b0ce8c42639c`, repair `2d7e7b0`. Current material tables are identical between evaluator arms. No weights, gameplay defaults or rules were adopted. Eight local CPU workers; 50 ms main move allowance, four random opening plies and no adjudication. All confidence intervals below resample entire setups.

## Evaluator

| Comparison | Residual score | 95% interval | Games / setups |
|---|---:|---:|---:|
| Equal budget, discovery | 0.6172 | 0.5647–0.6667 | 400 / 96 |
| Equal budget, fresh-seed confirmation | 0.5990 | 0.5497–0.6456 | 800 / 96 |
| Linear 200 ms vs residual 50 ms | 0.3390 | 0.2856–0.3919 | 400 / 96 |

The equal-budget improvement repeats, on the same setup frame with fresh opening seeds. The deeper linear arm reverses it. Actual equal-budget non-mate median reported depth was 4 for both engines; the deeper linear arm reached median 5. Reported depth can include a partial last iteration. This is neither an unrestricted strength rating nor proof of accurate endgame play.

## Archer

Current minus classic shots. The extended linear sample is descriptive; the residual confirmation is a separate fixed test. Both price the Archer at the current 505 centipawns.

| Outcome | Linear: 1,600/arm | 95% interval | Residual: 800/arm | 95% interval |
|---|---:|---:|---:|---:|
| Checkmate share (percentage points) | +0.92 | -1.82 to +3.51 | -1.89 | -5.82 to +1.91 |
| White score (percentage points) | +2.21 | -0.94 to +5.44 | -0.79 | -5.77 to +4.20 |
| Plies/game | -14.00 | -19.17 to -8.91 | -13.48 | -20.83 to -6.16 |
| Shots/game | +2.06 | +1.77 to +2.36 | +1.78 | +1.44 to +2.14 |

About 14 fewer plies and more shots repeat in both settings. A checkmate-rate improvement and a White-advantage shift are not established. The current-rule capped game is ID 1487 (`MKABRQLG`): White king versus Black king, Archer and Guard at the cap, with halfmove clock 17. It is a verified legal, unresolved ending. Assigning its outcome anywhere from 0 to 1 moves the linear checkmate contrast bounds only from +0.860 to +0.923 points; sampling uncertainty is substantially wider.

## Beast, Guard and ending examples

The 200-game residual focus sample contains 400 Beast-owning armies, with ten never moving a Beast, and 180 Guard-owning armies, with 30 never moving a Guard. Selected actual games include 10–11-capture Beast chains and 39–45 consecutive own turns of legal Guard immobility. A stationary Guard can still have a useful blocking role; these counts do not measure enjoyment or uselessness. Exact FENs and source game/ply IDs are in `campaign/results/phase-1-examples.json`.

One original rook ending drew. Fresh continuations from the same three-piece position mated in 94 plies at 50 ms, 26 at 200 ms and 24 at 800 ms. This selected diagnostic exposes conversion sensitivity and does not estimate its prevalence. Draw-rate comparisons remain conditional on these finite-budget players.

## Decision and next work

Keep the current simple Beast, ordinary promotions/draw rules and existing Archer while people test clarity, surprise and recall. Do not add or remove abilities based on this evidence. Proceed with controlled Paladin, Ogre, Guard-placement and arrangement studies under the frozen protocols. No actual human sessions have occurred.

Evidence: `campaign/phase-1-evidence.json`; calculations `campaign/results/phase-1-analysis.json`; fixed-confirmation independent check `campaign/results/phase-1-confirmation-independent.json`; repaired-search regressions `campaign/search-repair/`. Raw games remain in `sim/out/` with SHA-256 inventory.
