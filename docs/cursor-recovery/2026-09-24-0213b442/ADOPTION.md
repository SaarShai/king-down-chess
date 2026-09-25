# Selective adoption plan — original decision record

**Executed on owner request:** see [EXECUTED.md](EXECUTED.md) for outcomes and verification. The collection-time plan below is retained for comparison.

This was the decided route for using the recovered work. The current task only collected and assessed it. No code port, merge, branch creation, cleanup deletion, test run or publication has been performed.

## 1. Preserve the accepted base

Use `codex/playable-clay` at `c8f4ca7` as the product base. It already contains the approved full clay cast, facing, fixed presentation, size factors, picking/layout work and repetition repair `413fa3d`. The worktree was clean at inspection. When implementation is requested, create a normal isolated integration branch from that accepted commit.

Use the recovered `takeover` files as donor material, never as a branch-wide replacement. Keep the archived snapshot and hashes until integration is complete. Do not apply the raw recovery patch wholesale: it includes mixed experiments and documentation, and the raw patch captured the newly added recovery tracker section too; the original TASKS bytes are separately preserved in `workspace/TASKS.md`.

## 2. Apply the narrow game decision and reliable engine fixes

First apply only the recorded September 24 pool/default choice: `QORRBBNNAAGMMSS`, Ogre push, O=318, standard promotions, Paladin still available to custom setups and appropriate historical promotion sets. Preserve all other values, piece rules and inactive king powers.

Then reconcile missing-king/checkmate, horizon stalemate, material draw and root fifty-move handling with the accepted search. Keep rules/search terminal order and rule switches consistent. Preserve whole-history/quiescence repetition behavior already fixed in the accepted branch. Do not include Squire flags, reserve hashes, hand fields or drop move generation in this product change.

Acceptance: the accepted repetition negative control remains meaningful; legal search moves and terminal scores agree with the supported rules; rule-off/Strike exceptions are not turned into false draws; appropriate baseline and added semantic regressions plus typecheck pass. This is a bounded correctness pass, not a balance campaign. Check actual worker/history callers as well as exported search helpers.

## 3. Port the useful play improvements

Use existing UI paths to add or reconcile: the live guide and correct promotion lead, skill selector, Hint, optional auto-queen, short move sounds with persistent mute, clear check/hint marks, move explanations and optional practice rows. Fix caption state on undo/reload and qualify experimental rows. Keep the fixed clay appearance and approved proportions.

Add drag only if it works through the existing move-selection logic without breaking board rotation, picking, cancellation or touch input. Reuse the accepted animation infrastructure for a Catapult lob or Reaver capture; those remain lab behavior. Leave arbitrary five-way square-based capture effects in the graphics study.

Acceptance: human/computer and human/human play, promotion picker and auto-queen, old/new saves, muted reload, hint cancellation, real pointer/touch moves, undo during animation, reset while thinking, correct guide for supported presets and mobile layout. Inspect the accepted figures in the actual rendering. Tests should target those contracts, not CSS values or implementation details alone.

**Defer the clock.** It needs an explicit saved state and move/undo/reload/timeout semantics. It is not necessary to deliver the rest. If retained later, settle elapsed time at the turn boundary, persist remaining time and timeout, and test transitions with a controlled clock rather than waiting five real minutes.

## 4. Consolidate tests and records

Retain the original suite and add the smallest coverage that proves each adopted behavior. The 36 file candidates in `files.tsv` are sources of cases, not a request for 36 permanent test files. In particular:

- Fold piece/color/material/clock cases into tables in the existing rules/search suites.
- Fold the 10 `game-restore-*` files into one restore/undo matrix covering distinct move shapes.
- Keep legal-move mirroring as a compact property; make search-mirror ties explicit by checking the mirrored move's score/legality rather than accepting any mismatch with equal top scores.
- Keep malformed-FEN observations in the archive until supported input behavior is chosen; do not bless malformed positions simply because they currently parse.
- Archive shallow numeric/PST probes, redundant twins and the stale `13` assertion. Recoverable copies already exist. Do not delete the user's working files during this collection task.

After code adoption, update `docs/RULES.md` with dated decisions, `docs/PLAYABLE-CLAY.md` with the branch and version that actually implements them, and `TASKS.md` with current acceptance evidence. Restore historical context where the Cursor docs rewrote an old pool decision in place. Record the Squire as **experimental built, not adopted**, rather than “unbuilt.” Mark the king-capture note superseded, the moment-gap note resolved, and the Undo failure superseded by its narrower retest.

Acceptance: typecheck, the consolidated relevant suite and an actual production build pass on one exact source revision; focused browser verification covers the adopted behaviors. Do not publish automatically. Existing individual-pass logs do not satisfy this gate.

## 5. Keep research separate from the product

Keep the 21 original reports at their existing paths, indexed by `RESEARCH.md` with corrections. Keep simulation specs in `sim/specs/` and small summaries/reports in `sim/out/`; bulk JSONL stays ignored and locally archived with hashes. Record these 23 runs as exploratory and segregate caps and engine adjudications. Do not combine them with the earlier frozen direct-campaign studies as if they measured the same engine or pool.

Keep the recovered drop implementation as an archived experiment. The movement/attack/material/hash and reserve-evaluation problems must be resolved before its results can support design choices. A future request can recover that experiment from the archived source, but neither repairing it nor running depth-4 studies is part of this adoption plan's active work.

Likewise retain the discussion of public variant data and LLM benchmarks as background. No benchmark harness was built. Do not start one from the old brainstorming conversation.

## Permanent structure

| Location | Role |
|---|---|
| `src/` | Only adopted product behavior and a compact, meaningful test suite |
| `docs/RULES.md` | Current rule contract plus dated owner decisions |
| `TASKS.md` | Current status and explicit acceptance evidence; no automatic launch queue |
| `LESSONS.md` | Reusable corrections, not hundreds of score observations |
| `docs/research/` | Dated studies and sources; clearly marked status/limitations |
| This recovery folder | Stable provenance, every-agent/every-file indexes, findings and adoption plan |
| `sim/specs/`, `sim/out/` | Reproducible specifications and compact run summaries with source identity |
| Private recovery archive outside Git | Raw conversation/application records, scratch, bulk games, original/current source snapshots and inherited builds |
| Existing graphics study | Unselected capture/appearance experiments |

This uses existing project boundaries. No new framework, general plugin, compatibility layer, test-generation system or research dashboard is needed.
