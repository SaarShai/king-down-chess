# Direct search repair, 2026-09-22

Accepted in the isolated campaign checkout after 252 tests and TypeScript passed. Gameplay rule defaults, weights and the main checkout are unchanged.

Legal minimal position: `7k/8/8/8/3p4/2BOK3/8/8 w - - 0 1`. `Od3>d4-d5`, `d5-d4` checks the opponent on both plies and returns exactly to the original board/turn with halfmove zero. `Game` correctly draws after three occurrences. Search incorrectly discarded positions before pawn-clock resets; its capture/check continuation did not check repetitions at all.

Search now checks its whole path plus a set of supplied historical keys. The same repetition and fifty-move checks apply in quiescence. Both entry points initialize position hash, spent Strike state and history correctly. No new depth limit, gameplay rule or evaluation was introduced.

Baseline-failing regressions cover history at halfmove zero, repeated search work, spent-Strike hash identity and quiescence fifty-move state. A fifth verifies the legal cycle using the existing move generator and Game. Logs retain both red and green results. Full suite: 252/252 in 81.08 seconds; typecheck clean. Six separate campaign-analysis tests also passed.

Measured after cold reset:

| Probe | Before nodes | After nodes | Result |
|---|---:|---:|---|
| Minimal cycle, depth 1 | 448 | 27 | same move `Od3xd4`, +690 cp |
| Minimal cycle, quiescence | 433 | 13 | +690 cp both |
| Historical fresh FEN, depth 4 | 25,447 | 24,791 | same `Kg2-f2`, -287 cp |

Quiescence node counts used a temporary diagnostic accessor, removed before testing/commit. Disabling only quiescence repetition leaves the depth-1 search count at 27: that test primarily verifies normal search, so it is not mislabelled as an isolated quiescence regression.

The original 25-minute warm-state incident is not reproduced by its fresh FEN. This repair establishes and removes a real legal repetition failure; it does not prove every cause of the historical incident. Finite per-move budgets and preserved run evidence remain required.
