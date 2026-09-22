# Phase 3 — Ogre relocation pilots

**800 study records verified: 799 full endings and one 512-ply cap.** Both 400-game pilots finished before campaign closure. The owner requested wrapping up existing work and starting nothing new; the optional expansion was not run. Eighty fixed mirrored Ogre arrangements, matched opening seeds, 50 ms per move, eight CPU workers, four random opening plies and no adjudication. Both arms use the same current linear evaluator because Ogre is outside residual support. Non-mate median reported depth is 4 in both arms; reported depth may include a partial final iteration.

All records passed source/spec/start identity checks and canonical legal-move, event and ending replay. Independent Python arithmetic agrees with the four paired contrasts. Means give equal weight to each setup; uncertainty resamples whole setups. Outcome contrasts require complete matched pairs. Observed-horizon shove counts include the capped game.

| Measure | Repel | Push | Push minus repel, 95% interval |
|---|---:|---:|---:|
| Enemy shoves per game (primary) | 0.273 | 0.031 | −0.242 [−0.308, −0.179] |
| Friendly shoves per game | 3.096 | 3.926 | +0.830 [+0.494, +1.188] |
| Checkmate share | 82.92% | 88.54% | +5.63 points [+0.31, +10.94] |
| White score | 50.31% | 44.38% | −6.35 points [−13.49, +1.04] |

Push produced fewer enemy shoves and more friendly shoves. The primary interval straddles the predeclared worthwhile difference of 0.25 shoves per game in magnitude. Its lower confidence bound on checkmate improvement is below the three-point practical threshold; the White-score shift remains uncertain. These pilots do not establish an overall superior rule, a material price, or enjoyable play. The optional confirmation remains unperformed under the owner's stop instruction.

The single cap is push game 337, setup `NLBNGBOK`, ending at `4g3/8/4p2P/3kB3/3Pb3/4K3/8/8 w - - 3 257`. It remains unresolved, not a draw. Assigning that outcome every possible value gives fixed-allocation bounds of −6.04 to −5.83 points for White-score change and +5.42 to +5.63 for checkmate-share change. These bounds describe censoring only, not sampling uncertainty, and use all allocated records instead of the complete-pair subset.

## Availability and mechanisms

Enemy shoves were legally available on an average 2.84% of surviving Ogre owner-turns in repel and 4.99% in push. Friendly shoves were available on 58.12% and 64.69%. Ogre legal immobility averaged 3.49% and 2.69%. These are per-game fractions averaged within pairs/setups; they are not pooled turn fractions or measures of usefulness. In raw owner-army counts, 65/800 repel Ogres and 49/800 push Ogres never moved.

The replay found 106 enemy shoves in repel (67 pawns, nine Guards) versus 14 in push (three pawns, ten Guards). Friendly shoves totalled 1,241 versus 1,576; pawns accounted for 1,012 and 1,248. More available enemy shoves did not translate into more chosen enemy shoves. Friendly displacement was the dominant observed use in both modes.

Of friendly shoves, 347/1,241 in repel and 416/1,576 in push increased the target's geometric mobility; 595 and 685 reduced it. Home-rank advancement occurred 722 and 614 times. These event descriptions do not establish strategic benefit: relocation may alter king safety, tempo and future access, and geometric mobility is only a proxy.

## Constructed positions and short continuations

Nineteen constructed cases cover pawn movement/reset, friendly development, Guards, blocked destinations, edges, pins, discovered lines and other fairy pieces. Colour/mode/capture combinations produce 152 legal variants. Search was performed only where the capture toggle changed an available enemy-contact choice: 114 variants, each at 200 and 800 ms. In the initial capture-enabled cases, neither mode selected an enemy shove at 800 ms; removing captures led push to choose it twice. The three supplemental cases did not establish enemy shoving as best. These deliberately selected positions are not population evidence or forced-outcome proofs.

King safety can favour either mode. In the Guard/rook pin example, repel preserves the Ogre's blocking square while push exposes its king and is illegal. A supplemental bishop-screen example reverses that legality. Alternative captures or quiet moves were preferred in these searches. Keep these conditions visible rather than describing either mode as universally better.

The 114 eight-ply continuations were legally verified: 98 stopped at their diagnostic cap and 16 ended by insufficient material. They remain separate from the 800 full-study records. Thirty-eight corresponding human entry positions are prepared, but no real participant has supplied feedback.

## Decision and evidence

Keep the existing gameplay defaults and Ogre's experimental status. The pilots support describing friendly relocation as its common observed role under these settings; they do not support adopting push or adding abilities. No further experiments were launched after the owner requested closure.

Evidence: `campaign/phase-3-evidence.json`, `campaign/results/phase-3-analysis.json`, per-run replay files and the four `phase-3-*diagnostics.json` / `phase-3-*continuations.json` files. Raw game files remain on disk with SHA-256 hashes in the evidence manifest.
