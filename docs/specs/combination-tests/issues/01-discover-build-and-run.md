# Discover combinations and run controlled tests

Type: task
Status: claimed

## Plan and checks

1. Verify the four prior studies and freeze their discovery input hashes. Rank observed piece
   pairs, piece/card conditions and card pairs. Save counts, uncertainty and the selection reason.
2. Select six to ten hypotheses, including mechanistic controls. Keep discovery separate from
   the new tests. Save the fixed candidate list before any test games.
3. Add numeric strategy presets, a four-cell paired schedule/report, and action tracking that
   handles card drops, pushes, swaps and transformations. Reuse the engine and existing workers.
4. Test schedule pairing, identity tracking, zero-interaction controls, invalid inputs,
   incomplete/duplicate results and source/spec mismatch rejection. Run the required checks.
5. Freeze source and approval in a named campaign. Record exact runs in the main queue. Run
   M1 and Kaggle pilots, then timed shards; collect, verify, back up and report them. Schedule
   each check for expected completion. No merge.

## Verification criteria

Every candidate has four complete paired cells. Strategy settings are numeric and frozen.
Analysis rejects incomplete or mixed input. Card tracing passes hand-written effect cases and
recorded regressions. The old campaign remains byte-identical. Results state scope and limits.
Each launch records the owner's quote and an exact source hash, spec, seed and worker count.

## Comments

The existing framework worktree is reused. Its engine equals the prior campaign source; its
uncommitted reports and rules-playground files stay intact. The first M1 SSH check times out;
analysis and Kaggle preparation continue while the owner checks its connection.

Discovery fixes eight hypotheses in shortlist.md. The screen has 64 fresh blocks and 5,632 games.
It compares standard card-saving values with a numeric spend preset; identical no-card controls
are shared. Source rules and shipped search defaults do not change.

Verification: npm test passes (type check, 91 test files with one skipped, and 42 document/art
checks). The full old card dataset passes both repaired identity tracking and direct legal
tracing on M1: 6,000 games, 19,556 card actions, no failures. A 12-game depth-1 local smoke with
two workers passes the full schedule/source validator and report. Its evidence is in the main
campaign's smoke folder. This is the only new local simulation batch.

The first full check exposed an existing fixture omission: the size allowlist contains the
large generated status report, but its test omits that entry. The fixture now matches the
existing allowlist. All source and report edits from the earlier work remain intact.

M1 identity, AC power and idle-state checks pass on retry. Its historical card replay is done.
Next: freeze and push this support commit, then start one 352-game screen shard on each machine.
Each shard contains complete four-cell blocks. The M1 and Kaggle pilot blocks do not overlap.
