# Research recovered, qualified and organized

Keep all original reports as dated evidence. This catalog supplies their current status without silently rewriting what the earlier agents found. “Keep” means retain a useful source or observation; it does not mean adopt a rule, accept a balance verdict or restart a study. No external facts were refreshed and no game was replayed during recovery.

Current product changes and fresh verification are recorded in [EXECUTED.md](EXECUTED.md). The 21 reports now carry short status notices; their original bodies and exact pre-notice bytes are preserved.

## The 21 reports

| Original report | Retained value | Status and correction |
|---|---|---|
| [learn](../../research/learn-2026-09-24.md) | Source map for variants, engines, weaker play and useful interface features. | **Background.** Availability on a site does not establish popularity or a player count. Some missing-feature statements are superseded by later session work. Squire is now an experimental implementation, not merely unbuilt. Claims that Ogre push solves Guard blockades need the earlier local studies' qualifications. |
| [emergence](../../research/emergence-2026-09-24.md) | Examples of small rule sets producing combinations; links worth revisiting. | **Design inspiration.** Its “primary sources only” framing is too strong: it also uses commentary and player anecdotes. These do not establish how much players generally enjoy a mechanic. The Mini Metro conclusion lacks equivalent sourcing. |
| [emergence-deeper](../../research/emergence-deeper-2026-09-24.md) | Readability, inspectable consequences and examples from several strategy/puzzle games. | **Design inspiration.** Distinguish developer interviews/help pages from reviews and forum reactions. Do not infer that more interactions automatically make King Down more enjoyable. |
| [explore-combo](../../research/explore-combo-2026-09-24.md) | Six concrete starting rows and their observed Catapult/Archer/Ogre/Beast/Maester traffic. | **Exploratory.** 96 depth-2 games, 16 per row; Catapult value **156**, not the current 400. Five games hit the ply cap. Different entire armies confound causal claims such as “the Guard did not help.” Keep examples, not a ranking or a new value. |
| [squire-drop](../../research/squire-drop-2026-09-24.md) | First comparison of step, forward, non-capturing Squire and medium reserve against a control. | **Lab only.** 120 depth-2 games. The reserve adds material rather than replacing a back-rank piece. Immediate spending does not demonstrate player preference; reserve value is absent from the evaluator. See implementation caveats below. |
| [squire-depth3](../../research/squire-depth3-2026-09-24.md) | Deeper descriptive counts, drop timing and follow-on captures. | **Lab only.** 400 games, 80 per arm, including three caps. Step had 5 scored draws versus control's 16; the earlier depth-2 direction differed. No adopted rule or stable balance conclusion follows. “Drop square later shoved” tracks a square and is weaker than tracking the same piece. |
| [squire-where](../../research/squire-where-2026-09-24.md) | Shows which tested restrictions were actually exercised. | **Lab only.** 144 depth-3 games. Free-drop and no-check-block arms have identical move lists; zero drops answered check, so this sample does not assess that restriction. Home drops happened later. Calling that “duller” is a taste judgment unsupported by the counts. |
| [squire-stories](../../research/squire-stories-2026-09-24.md) | Readable LAN clips: a dropped piece captures, is shot, shoves, or participates in a board with chains/lobs. | **Keep as examples of the experimental implementation.** 96 depth-2 games, one cap. Six requested interaction types were illustrated; king-adjacent and back-rank drops were explicitly not observed. These are selected moments, not evidence of fairness or fun. |
| [shipped-balance](../../research/shipped-balance-2026-09-24.md) | Distinguishes the new pool's small traffic sample from older studies. | **Keep with corrections.** The title overstates the 24-game depth-2 sketch. It found 82 Archer shots, 36 shoves (35 friendly), and 12 multi-capture Beast chains in 8 games. Its 37 `beastChainMoves` also includes single captures. All endings were engine adjudications: 23 resigns and one draw. Clarify the older draw/cap accounting below. Ordinary custom setup does not by itself provide the unbuilt browser reserve workflow. |
| [white-edge](../../research/white-edge-2026-09-24.md) | Separates old-pool, designated-piece and evaluator-comparison studies. | **Keep that separation.** The older 2,000-game pool score is 0.5525; a different 2,000-game Paladin arm reports 0.5403. Today's exact pool has only the 24-game 0.5625 sketch here. The older figures cannot establish a precise first-move advantage for the new pool or later engine patches. No rule change is justified by this note. |
| [quiet-pieces](../../research/quiet-pieces-2026-09-24.md) | Explains zero Guard captures and separates Beast single takes from multi-capture chains. | **Fold useful definitions into the traffic reading.** Zero Guard captures follows the rule; a “silent” piece is not necessarily ineffective. Do not add evaluation bonuses solely to make a count rise. |
| [eval-sees-shots](../../research/eval-sees-shots-2026-09-24.md) | Explains how existing search sees material won by special moves. | **Keep as a source-time explanation.** Capturing shots enter tactical search; non-capturing shoves may need more depth. This is not a proof that every tactic is seen or a reason to add an arbitrary bonus. |
| [king-capture-score](../../research/king-capture-score-2026-09-24.md) | Records a real missing terminal-score problem and its original reproducer. | **Superseded implementation finding.** Later session edits added missing-king terminal handling. Preserve the discovery, then require rules/search agreement on the adopted branch rather than quoting the old behavior as current. |
| [standard-values](../../research/standard-values-2026-09-24.md) | Snapshot of the existing orthodox material values: P=100, N=316, B=322, R=449, Q=933. | **Point-in-time audit.** No new fitting or adopted value change. Fold into a single value/reference record when integrating. |
| [values-check](../../research/values-check-2026-09-24.md) | Checks existing fairy values and promotion/pool documentation. | **Point-in-time audit.** A=505, L=408, G=96, M=318, S=434, O=318; lab C=400, V=400, T=350. Do not confuse C=400 with the arrangement experiment's C=156 override. |
| [club-depth](../../research/club-depth-2026-09-24.md) | Corrects the claim that Club is simply depth 1. | **Keep the correction.** Club has an 800 ms cap; it uses the same policy as Strong when the think budget is already 800 ms. Neither label is an independently calibrated human strength level. |
| [try-these](../../research/try-these-2026-09-24.md) | Four practice rows with FEN/URL entry points. | **Keep as optional examples.** Three include lab Catapult. Their actual game uses current values, so it is not a replay of the C=156 study. Explain what to try; do not present the rows as measured winners. |
| [play-pass](../../research/play-pass-2026-09-24.md) | Saved browser observations and the original Undo failure. | **Historical partial QA.** It viewed the older voxel presentation. Its Undo finding was superseded by the retest; the other observations certify only the tested state, not the final tree or accepted clay build. |
| [undo-retest](../../research/undo-retest-2026-09-24.md) | Retest of Undo in human/human play and after a computer reply. | **Keep as narrower later evidence.** Board input used direct callbacks and Undo used a DOM click. This does not establish real pointer/touch, animation cancellation, reserve or clock undo behavior. |
| [moment-gaps](../../research/moment-gaps-2026-09-24.md) | Identified missing Strike/Reaver explanatory captions. | **Resolved locally later.** Both cases now exist in `moment.ts`; remaining wording/state defects are in ASSESSMENT.md. No new gap task is needed for those two cases. |
| [stale-copy](../../research/stale-copy-2026-09-24.md) | A bounded copy audit reporting no listed stale cases. | **Historical check only.** It does not certify every preset, the final end-state or the inaccurate playable-clay branch claim. |

## Raw data census

Every line of the 23 preserved JSONL datasets parses; every dataset has the number of distinct game IDs expected by its summary. [runs.json](runs.json) records each dataset's counts, full stamped rules, source/spec identifiers and recounted White score. These are audits of existing records, not new simulations.

| Family | Datasets | Games | Search | Ply caps | Use |
|---|---:|---:|---|---:|---|
| `explore-combo-2026-09-24` | 1 | 96 | depth 2 | 5 | Six whole-row traffic examples; C=156 |
| `sq-*` | 5 | 120 | depth 2 | 0 | Initial reserve alternatives, seed 93 |
| `s3-*` | 5 | 400 | depth 3 | 3 | Reserve alternatives, seed 94 |
| `sh-*` | 3 | 144 | depth 3 | 0 | Home-rank / check-block restrictions, seed 95 |
| `stories-*` | 8 | 96 | depth 2 | 1 | Four fixed rows × two reserve types, seed 96 |
| `shipped-traffic-2026-09-24` | 1 | 24 | depth 2 | 0 | New-pool event sketch, no reserve |
| **Total** | **23** | **880** | | **9** | |

Recorded ending reasons total **741 adjudicated resigns, 69 adjudicated draws, 30 repetitions, 20 checkmates, six fifty-move draws, five material draws and nine ply caps**. Thus 810/880 endings were engine adjudications, 61 were rules-defined endings, and nine were unfinished at the cap. A summary may give a capped game half a point; that is not a completed drawn game.

The earlier `pb-ab-O-push-d4-v318.var` comparison quoted in `shipped-balance` has 382 half-point outcomes out of 1,600, including 16 caps. Its report's `drawRate=0.22875` uses the 366 non-cap draws; 382/1600 is 0.23875. The files are internally explainable, but quoting “382 draws” beside 22.875% without explaining caps conflates the two definitions. Keep these historical 1,600 games separate from the 880 newly recovered game records.

Three source fingerprints appear in this session's datasets: `3444cecd3292` (96 records), `8ceb7f5be5e0` (120), and `e8458d960179` (664). The fingerprint implementation includes TypeScript tests under the source trees. Three different fingerprints therefore do not, by themselves, prove three different engine implementations. Original stamps, per-agent first-edit source and tool records are preserved; exact runnable trees for each historical fingerprint have not been reconstructed. Later engine fixes and the accepted repetition repair must not be silently credited to these earlier games.

## Why the drop work stays experimental

The surviving code has mismatched Squire movement/attack detection, incomplete reserve/material handling and a hash that merges different reserve types. The evaluator values a dropped piece on the board but not the same piece still in hand. This gives the search an immediate accounting benefit for spending the reserve and makes “it always drops early” weak evidence about the mechanic. See the concrete source findings in [ASSESSMENT.md](ASSESSMENT.md).

Preserve the observations as behavior of the experimental implementation. They cannot presently justify adopting the intended Squire rules or selecting the “best” form. The raw records and source snapshots allow a later authorized investigation; correcting the experiment or launching deeper runs is not active work.

## Research that never became a report

The parent also discussed variant popularity and downloadable game corpora, general LLM chess performance, recent model comparisons, and a possible King Down benchmark. Those sections were recovered into `conversation-only-research.md` in the private archive, with parent transcript line references. Individual source/tool responses remain available there as well.

Retain this as a **background source lead**, not an adopted benchmark plan. Player counts, corpus availability and model rankings require dated primary-source verification before future use. The session did not produce a downloaded public game corpus, benchmark harness, benchmark result table or evaluation dataset. Testing a new board or unusual piece may test tactical legality and search; it does not by itself isolate creativity, understanding or resistance to memorization.

Other repeated searches and “why this score?” answers remain in [agents.jsonl](agents.jsonl), including failed hypotheses and corrections. They belong in the evidence archive unless they reveal a distinct rule contract or regression. They should not each become a permanent research document.

## Record structure after adoption

Use this catalog as the status layer over the original 21 reports. When a related implementation is adopted, update its current rule/product document and record the exact accepted source revision and verification. Leave the older study available with a superseded/limited label rather than replacing its numbers or pretending later fixes were present. Keep speculative ideas and unfinished suggestions out of the active task list until the owner asks for them.
