# Selective adoption completed

Completed September 25, 2026 (America/Los_Angeles), following the September 24 recovery and decisions.

The owner's follow-up, “execute your decisions,” authorized implementing the [recorded plan](ADOPTION.md). The selected work is integrated on **`codex/cursor-adoption`**, in `/Users/za/.codex/worktrees/cursor-adoption/king down chess`, based on accepted clay commit **`c8f4ca7`**. The verification manifest records the full base identifier and source hashes; the commit containing this record is the adoption revision.

The current product entry point is [PLAYABLE-CLAY.md](../../PLAYABLE-CLAY.md), with a local production preview at **http://127.0.0.1:5189/**. The original dirty `takeover` checkout and private recovery archive remain preserved. No old agent, delegation, model call, research campaign or publication was resumed.

## What was adopted

| Decision | Implemented outcome |
|---|---|
| Preserve accepted product | Started from the clean clay base, including repetition repair `413fa3d`. Kept the complete clay cast, facing, fixed 0.5 px rendering, proportions, hidden-label picking and cancellation infrastructure. |
| Recorded roster choice | `QORRBBNNAAGMMSS`, Ogre push and O=318. Other values, standard promotion and inactive king powers stay as decided. Historical pool decisions were retained with their original dates. |
| Terminal correctness | Missing kings score as a loss; mate precedes the fifty-move draw; stalemate is recognized before capture-horizon evaluation. Game/search share material-draw rule and live-Strike handling. Repetition uses full history; its rule switch and spent-Strike state are respected. |
| Useful controls | Live guide and hover text, skill policy, Hint, optional auto-queen, short Web Audio sounds with effective saved mute. Old saves without a skill retain Strong; new games reset to current/URL rules while resumed games keep their rules. |
| Explanations | Completed-move and prospective wording distinguish shots, lobs, shoves, swaps, chains, Paladin removal, Strike, Death Touch and Reaver steps. Undo/reload reconstruct caption history from actual moves. |
| Input and presentation | Check ring and hint marks; piece drag routes through existing selection. Real touch revealed a shifting-header bug, fixed by moving changing explanations into the scrolling panel. Empty-board dragging retains orbit controls. |
| Optional examples | Four rows added to the existing selector, three labelled Catapult lab. Historical examples retained; no ranking claim. |
| Small lab animations | Catapult lob arc and Reaver capture-then-step reuse the accepted renderer. Both complete and cancel correctly on undo. Neither adds a piece to the pool. |
| Asset cleanup | Removed the unused photo-texture loader and three JPEGs from `public/` and the build. Legacy Dungeon uses procedural stone; fixed clay remains the game presentation. Original bytes remain archived. |
| Compact coverage | Original seven test files retained, with three new files: `terminal.test.ts`, `symmetry.test.ts`, `play.test.ts`. Ten restore files become one seven-row replay/undo matrix. The 801 donor micro-files are preserved outside the adopted test tree. |

The 36 candidate test files all have an explicit final disposition in [test-adoption.tsv](test-adoption.tsv). Material/notation contracts already covered by the original suite were reused. The Maester horizon fixture retains its stalemate contract without the arbitrary `-1666` score. Mirror tests check the legality and equal score of a differently chosen mirrored move. The preserved repetition regressions still cover the original repel bug, with a separate new push-cycle case.

## What stays outside the product

- **Clock:** no clock controls or runtime path were imported. Saved remaining time, turn-boundary accounting, undo and timeout semantics remain unresolved in the archived implementation.
- **Squire/reserve/drop:** source, specs, summaries and raw games remain recoverable, but none of the hand fields, drop generation or reserve hashes were ported. Movement/attack, material, identity and evaluation defects invalidate an adoption claim.
- **Arbitrary capture-style selection:** archived with the original donor; existing graphics studies remain the home for appearance experiments.
- **Incidental score locks and malformed-FEN characterization:** preserved as observations. They do not become current engine contracts. Fable's wider playout/perft proposals and the suggested LLM benchmark were not built or automatically queued.

These are deliberate disposition decisions, not unfinished dependencies of this build.

## Research and provenance

All 21 reports remain at their original `docs/research/` paths with short status notices and their original bodies. The [catalog](RESEARCH.md) carries source, sample, cap/adjudication and implementation qualifications. King-capture findings are marked superseded, caption gaps resolved, and the original Undo failure superseded by its later retest and current verification.

Nine historical specs and 25 compact summary/report files are retained in `sim/specs/` and `sim/out/`. The 23 raw datasets, 880 games, 888 transcripts, 916 first-edit snapshots and other original artifacts remain in the private archive. No historical game was replayed or newly measured for this adoption. Exact runnable trees for every historical source fingerprint remain unreconstructed.

The original every-agent and every-file ledgers remain collection-time records: [agents.tsv](agents.tsv), [agents.jsonl](agents.jsonl), [files.tsv](files.tsv). [ASSESSMENT.md](ASSESSMENT.md) and [FABLE.md](FABLE.md) retain the reasoning that led here; source links for historical defects now target archived bytes. [verification.json](verification.json) certifies the earlier collection only; the fresh product evidence below is separate.

## Verification

| Check | Result / evidence |
|---|---|
| Full existing + consolidated suite | **267 passed, 10 files**; [tests.log](validation/tests.log). Includes the accepted repetition regressions and existing short legality self-play tests. |
| TypeScript and production bundle | **Pass**, `npm run build`; [build.log](validation/build.log). No dependency or lockfile changes. |
| Accepted clay behavior | **15 passed, no page/console errors**; [browser-checks.json](validation/clay/browser-checks.json). Fixed presentation, facing, pawn picking, walk/leap, worker reply, save/reload, shove/capture undo, reset during animation and mobile layout. |
| Adopted behavior | **11 scenarios passed, no page/console errors**; [adoption-browser.json](validation/adoption-browser.json). Hints/history/cancellation, muted and old saves, both orientations, promotion/preset transitions, captions, guide/check marks, real touch, and both lab animations. |
| Visual inspection | [Desktop](validation/clay/desktop.png), [mobile layout](validation/clay/mobile.png), [completed mobile touch move](validation/touch-mobile.png). Clay look and proportions retained; header does not overlap the board. |
| Source and collection checks | [execution-verification.json](execution-verification.json): source/build hashes, retained-report bodies, immutable archive manifest, unchanged donor product and source-boundary checks. |

Browser checks run against the production build using isolated headless Chrome profiles, not the owner's saved browser. Re-run with `PLAYABLE_BROWSER=chrome PLAYABLE_URL=http://127.0.0.1:5189/ node tools/verify-cursor-adoption.mjs`; the clay verifier additionally accepts `PLAYABLE_OUT` so the September 22 evidence is not overwritten.

Development checks caught old implicit repel/pool fixtures, four favicon requests, the camera-settling test timing and the mobile header shift. The final logs above supersede those intermediate failures. Physical-device performance and calibrated AI strength were not measured; Vite still reports a non-failing large-chunk notice. This is a verified local build, not a new balance study or public release.

## Structure going forward

`src/` owns adopted behavior and compact tests. `docs/RULES.md` owns current rules plus dated decisions. `docs/PLAYABLE-CLAY.md` points to the actual product checkout. `TASKS.md` records completion, and `LESSONS.md` records reusable corrections. Dated research and compact simulation summaries stay in their existing folders; this recovery folder owns provenance and disposition. Raw conversations, experimental source, bulk games and inherited builds stay in the private archive outside Git.
