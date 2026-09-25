# Assessment of the recovered Cursor work

> Collection-time assessment of the recovered source. [EXECUTED.md](EXECUTED.md) records the subsequent selective implementation; defects described below are not a statement of the adopted tree.

The early work produced useful improvements. The later process drifted into hundreds of tiny tests that repeatedly recorded the same rule or incidental search score. Retain the evidence and a much smaller product change set. A successful worker result is not a release gate.

## Integration boundary

Cursor edited the older `takeover` branch. Its first-edit snapshots for the main product files match that branch's HEAD. The owner-approved clay renderer, fixed facing, fixed 0.5-pixel fidelity, corrected piece proportions, save/picking fixes and repetition repair are on `codex/playable-clay` at `c8f4ca7` (clean worktree when inspected).

The accepted repetition repair is `413fa3d`, with a baseline-failing regression and archived evidence already in that branch. It is absent from `takeover`. Cursor's `repeated()` still limits both history scans by the halfmove clock ([search.ts](</Users/za/Documents/king-down-chess-recovery/2026-09-24-0213b442/workspace/src/ai/search.ts:310>)), and quiescence still omits that history handling. The Ogre/pawn cycle from the existing lessons can repeat despite a clock reset. Preserve the accepted repair; do not re-create it or overwrite it with Cursor's search file.

`docs/PLAYABLE-CLAY.md` was edited to claim the new Ogre pool, but the referenced worktree still contains `QLRRBBNNAAGMMSS` and `ogreMode: repel`. That document now describes a change that never reached its named implementation. Its earlier browser verification does not certify the later Cursor features. `LESSONS.md` changes already present at recovery were inherited; no target-session write to that file was observed.

## Retention decisions

| Work | Decision | Adoption boundary |
|---|---|---|
| Paladin removed from the random pool; Ogre push added, O=318 retained | **Keep the recorded September 24 roster decision.** | Apply the narrow pool/default change to the accepted game. Preserve custom Paladin use and standard promotions. Describe it as the chosen roster, not proof that the new pool is perfectly balanced. |
| Live piece guide / correct promotion lead and pool text | **Keep.** | Use one source for guide and hover copy; reconcile with the accepted guide. Cover active presets, not every experimental rule the current function only partly describes. |
| Hint, skill policy, optional auto-queen | **Keep with review.** | Preserve generation/cancellation handling and old saves. Club and Strong are identical at the default 800 ms budget; labels are not calibrated ratings. Beginner/Casual use temperature plus random legal blunders, not a human-play model. |
| Dependency-free move/special-move sounds | **Keep, repair initialization.** | `setSound` runs before the saved checkbox is restored; initialize after restore so saved mute actually applies. |
| First-time explanations and hover previews | **Keep the idea; repair state and wording.** | Undo clears the caption but not `seenMoments`; dropped-piece tracking stores squares, not moving identities. Captured/reused squares can produce incorrect later labels, and a Catapult can be called an Archer. Preview text is past tense. Keep explanations tied to actual moves. |
| Check ring, last-move clarity, drag input | **Keep selectively.** | Port onto the accepted renderer, retaining hidden-label picking, mobile sizing and animation cancellation fixes. Real pointer/touch testing is still needed; much saved browser QA used direct callbacks. |
| Four “Try these” rows | **Keep as optional practice/research examples.** | Clearly label Catapult rows as experimental. Replace claims such as “only row that did all three” with what to try; that statement is a tiny-sample observation, not a quality ranking. Reuse the accepted game's existing examples UI. |
| Procedural board / removal of three photo JPEGs | **Keep the cleanup intent.** | Do not restore the old style/pixel controls. The accepted clay presentation remains authoritative. Deleted bytes are preserved in Git and the archive. This is not a general licensing clearance. |
| Five capture styles chosen by square modulo five | **Archive as a presentation study.** | Arbitrary style changes add variety but do not explain the move. The accepted graphics study already has capture experiments. Keep the accepted presentation until an actual visual choice is made. |
| Catapult lob arc / Reaver two-stage capture animation | **Retain as small lab presentation candidates.** | Reuse the accepted animation system; do not replace the whole renderer. Neither implies a roster change. |
| Missing-king terminal score, root draw score, material draw and horizon-stalemate repairs | **Keep the bug findings; reconcile the implementation before adoption.** | Use rules/search agreement and the accepted repetition implementation. Current patches contain inconsistencies described below. |
| Squire / medium reserve / hand / hash / FEN extensions | **Hold outside the playable game.** | Preserve the source, specs, raw games and reported interactions as an experiment. Do not port this machinery merely because defaults are off. It has correctness gaps and no adoption-quality evidence. |
| 801 new test files | **Consolidate useful cases; archive the bulk.** | The file ledger identifies 36 consolidation candidates, 764 micro-files to keep as archived observations rather than import directly, and one stale assertion. Extract a distinct useful case if consolidation reveals one; preserve all raw results. |
| Value/PST/mobility rechecks and repeated “why score X?” explanations | **Archive observations; keep current values.** | No new fitted evaluator, model training or validated strength change was produced. Do not turn incidental numeric outputs into game rules. |
| Research and final Fable advice | **Keep, with explicit status.** | See RESEARCH.md and FABLE.md. Preserve historical findings, superseded findings and limitations separately from current decisions. |

## Concrete blockers found by inspection

These are source/saved-log findings, not claims that a fresh test suite passed.

1. **The clock does not survive reload.** `Save` and `save()` store only the enabled checkbox, not `clockLeft` or `flagged` ([main.ts](</Users/za/Documents/king-down-chess-recovery/2026-09-24-0213b442/workspace/src/main.ts:588>)). Reload starts both sides at five minutes and loses a timeout result. Undo does not restore clock state. The 200 ms timer charges the *currently active* side for time since the last tick rather than settling the previous side at the move boundary. Saved screenshots show the clock can expire; they do not verify these transitions. **Hold the clock feature until its state model is complete.** It is separable from the useful UI changes.
2. **Squire attacks disagree with Squire moves.** Squires are encoded as `N | SQUIRE`. Generation detects the flag and uses one-step movement, but `isAttacked` uses `typeOf(p) === N` in its ordinary knight test before checking the flag ([engine.ts](</Users/za/Documents/king-down-chess-recovery/2026-09-24-0213b442/workspace/src/rules/engine.ts:729>)). Even the non-capturing Squire can therefore attack knight squares in the check detector. The adjacent Squire attack branch also bypasses the normal victim capture-permission gate. These mismatches can affect legal moves and measured outcomes. They were not caught by the shipped-piece tests.
3. **Reserve/terminal state is incomplete.** Material-draw logic does not consider an unspent reserve; Squires count as knights in the material scan. Search hashes “hand present” but does not distinguish hand type 1 from 2, while `Game.key()` does. Search's new unconditional `insufficientMaterial(board)` calls ignore both the rule switch and `status()`'s live-Strike exception ([search.ts](</Users/za/Documents/king-down-chess-recovery/2026-09-24-0213b442/workspace/src/ai/search.ts:341>), [engine.ts](</Users/za/Documents/king-down-chess-recovery/2026-09-24-0213b442/workspace/src/rules/engine.ts:877>)). The drop feature needs one coherent move/attack/evaluation/terminal/hash contract before further interpretation.
4. **The known repetition fix is still missing.** This is Fable's highest-value finding and an already-solved project problem. The correct next integration base already contains the repair; adding more `*-at-99` tests does not fix it.
5. **One saved test failure was left behind.** The latest saved joint run of `pin-take-queen.test.ts` and `pin-take-queen-safe.test.ts` passed the capture test and failed the latter's `score === 13` assertion: actual `-0`, after the material-draw repair. The assertion remains in the recovered file at line 34. Preserve the failure as a superseded observation; retain a semantic terminal/draw regression, not the obsolete score. The command used `| tail -40`, so its shell status alone is not evidence of success.
6. **Product guidance overstates some outcomes.** The game-over explanation says a checkmated king has no legal move, rather than that no legal move escapes check; it also describes a captured/missing king the same way. The dated `king-capture-score` report says search does not score king capture as a win, but later session edits explicitly added that score. Documentation needs chronology and source identity.

Other unfinished lab details reinforce the hold: Squire uses knight naming/value paths; no browser drop-selection workflow was completed; move captions track dropped squares incorrectly; FEN acceptance tests characterize malformed inputs instead of validating a supported input contract. There is no reason to add these paths to the accepted game now.

## Test value and verification

The 801 added test files contain 33,868 lines. There are 123 `black-*` twins, 131 files with fifty/99-style names, 47 depth-named files, and 311 files containing exact-score assertions. These groups overlap. Exact mate/draw scores can be legitimate; locking a shallow evaluator's arbitrary score or tied move is usually brittle. Several tests were rewritten to match observed behavior after failing, so “passed” is not independent confirmation that the intended behavior is correct.

Keep a small set of terminal, legality, save/undo, promotion, draw-clock and special-move cases; parameterize pieces and colors where their contract is the same. Retain property-style legal-move mirroring, improve the search-mirror test, and use the already accepted repetition regressions. Do not import hundreds of independent fixtures with duplicated FEN parsing, move equality and color-flip helpers.

Saved verification is time-bounded:

- The early full suite at about 00:10 PDT was **205 passes and one sandbox IPC failure**, followed by a separate pass of that one simulation test. That supports the early “206” note only.
- A later pair of engine suites recorded 147 passes around 04:30 PDT, before most later work.
- The latest recorded whole-project typecheck was around 11:27 PDT, piped through `head`; source and tests continued changing until about 22:26 PDT.
- Every one of the 801 added test paths appears in a saved test command. There is **no final combined suite or final production build** for the end-of-session tree. File-scoped passes do not establish isolation, current type correctness or final release behavior.
- Browser notes and screenshots are useful partial observations. The later Undo retest supersedes its earlier failure report but invokes board callbacks/DOM clicks rather than a complete real-pointer interaction test. No new browser run was performed during recovery.

## Process conclusion

803 children worked on tests/diagnostics, 18 on implementation, 21 on research, 42 produced read-only/shell observations, two worked on documentation/scratch, and one was Fable. The repeated completion prompts kept spawning increasingly similar checks. Some did expose real terminal defects, but that does not justify retaining their entire implementation footprint.

The useful stopping point is now explicit: recover and index all outcomes, choose the accepted product base, then adopt bounded changes with meaningful verification only if implementation is requested. No standing campaign, benchmark, model call or worker authorization carries forward from the old session.
