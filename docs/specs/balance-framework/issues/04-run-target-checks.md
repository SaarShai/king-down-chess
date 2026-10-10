# Run the next target checks

Type: task
Status: in progress

Owner, 2026-10-09: “let's wait with the commit because there's another agent working on the
codebase. for now - orchestrate the next M1 and Kaggle runs based on the framework.”

## Plan and checks

1. Pin engine commit `7035b5e56c8de435d2e63dc02d47d7002bd54a6e`. Keep the source separate
   from active edits. Record the owner's go in the main queue and each launch manifest.
2. Verify M1 identity, AC power, idle state and free space. Start one detached worth pass:
   seven piece arms of 1,000 games plus 3,000 pawn calibration games, eight workers.
   Use a 60-minute limit. Preserve partial output on any error or timeout.
3. Start one Kaggle timing shard for activity (600 of 12,000 games) and powers (1,056 of
   5,280 games). Check elapsed time before more shards. Keep at most five active notebooks
   and each notebook below nine hours. Use only the saved source and flags for later waves.
4. Save the full source, rules, prices, specs and schedules. Tournament rows lack stamps.
   Keep raw files unchanged. Target certification needs an explicit analysis provenance
   import; the current reader treats tournament rules as partial.
5. Monitor in this chat. Copy results, check counts, IDs, schedule, rules, source, caps and
   sampled legal replays. Back up the data. Rebuild reports after each completed study.

The owner approves the 28-card test pool on 2026-10-09: "yes". The four-card run is queued
after the current pilots pass, with March and Salvation included. This does not adopt the
final published deck. Verify the explicit cardPool in its frozen spec before launch; the
initial preflight helper omits that field. Check 6,000 games and ten shards of 600. The worth run excludes Guard because
the standard swap does not put it next to its king. This is one price pass. A second pass
needs a reviewed seed table. No commit, merge, deployment or change to game rules occurs.

## Paths

- Local launch records: `sim/out/balance-target-20261009/` in the main checkout.
- M1 source and outputs: `/Users/new/projects/kd-balance-20261009/`.
- Main queue: `docs/QUEUE.md`, Target checks, 2026-10-09.

## Start evidence

All 149 source files match the frozen commit. The archive SHA256 is
`ef090a847956542fb238817c4b12eba160250bca24b60669686e785ea246c38d`.
The runner source ID is `d4523a2143a2`. Separate provenance records hold all expected jobs,
full rules, pool and prices. They also cover `src/game.ts`, which the runner hash omits.

M1 identity matches, AC power is on, no simulation or loaded model competes, and 18 GiB is
free. The detached worth process starts at 2026-10-10 05:50:21 UTC (2026-10-09 local).
Supervisor PID 28877; simulation PID 28879. The first game matches the saved source, spec,
pool and all 97 full rules. It uses far2 and the king-adjacent Guard default. The first arm
is producing games. The 60-minute watchdog is active.

Kaggle accepts activity shard 19/20 and powers shard 4/5. Both report RUNNING. Their schedules
hold 600 and 1,056 games. No later shard starts before its pilot passes the time and data checks.

The `orchestrate-target-balance-runs` heartbeat checks this chat near expected job completion. The saved
RUNBOOK.md in the campaign folder defines collection, audit, backup and later-wave steps.
The old delegation heartbeat stays paused. This ticket remains open through collection and
analysis. All three starts use the owner's recorded quote. Nothing is committed or merged.

## First collection checks

M1 finishes at 2026-10-10 06:24:03 UTC, exit 0, in 33.7 minutes. All 10,000 games
are copied to main sim/out/m1/kd-balance-20261009. Unique IDs, full schedules and all
rule/source/spec stamps pass for every row. Eighty sampled legal replays pass against
the frozen source. The run has 42 ply caps. Framework report integration remains pending.

The activity pilot finishes 600 games in 2,146 seconds, exit 0. Its commit matches, its
spec is byte-identical, and all scheduled IDs, seeds and armies match. Twenty sampled
legal replays pass. Durable status and raw data are in the campaign's kaggle/activity-s19of20
folder. Four further activity shards (0–3) are dispatched after the account check shows
only the powers pilot active. Check the launch audit for acceptance and live status.

At 07:02 UTC, activity shard 0 passes: 600 games, exit 0, 1,314 seconds. Source, spec,
full schedule and 20 sampled legal replays pass. The backup copies 18 new files to the
Drive desktop folder. Shard 4 takes the free slot; shards 1–3 and the powers pilot remain
active. Total collected activity data: 1,200 of 12,000 games.

At 07:12 UTC, activity shards 2 and 3 pass: 600 games each, exit 0, 2,102 and
2,216 seconds. Source, spec, full schedules and 20 sampled legal replays per shard pass.
The backup copies 23 files to the Drive desktop folder. Shards 5–6 take the two free slots.
Total collected activity data: 2,400 of 12,000 games. The powers pilot still runs.

At 07:22 UTC, activity shard 1 passes: 600 games, exit 0, 2,259 seconds. Source, spec,
full schedule and 20 sampled legal replays pass. The backup copies 13 files to the Drive
desktop folder. Shard 7 takes the free slot. Activity data: 3,000 of 12,000 games collected.

At 07:46 UTC, activity shards 4–5 pass all source/spec/schedule checks and 20 sampled
legal replays each: 2,348 and 1,993 seconds. Total collected: 4,200 games. Shards 8–9
take the free slots. Next check: 01:03 Pacific, near shard 7 completion. The independent
read-only review remains active.

At 08:03 UTC, activity shards 6–7 pass source/spec/schedule checks and 20 sampled
legal replays each: 2,232 and 2,124 seconds. Total collected: 5,400 games. Shards 10–11
take the free slots. Next check: 01:28 Pacific. Independent review finishes and is saved
in the main campaign independent-review/review.md. Code inspection confirms that currentCheck
excludes calibration.relativeError and stopped-shard selection uses game IDs. The remaining
review claims need checks. No report verdict is upgraded from review claims alone.

At 08:27 UTC, activity shards 8–9 pass source/spec/schedule checks and 20 sampled
legal replays each: 2,114 and 2,140 seconds. Total collected: 6,600 games. Shards 12–13
take the free slots. The powers pilot remains active. Next check: 01:46 Pacific.

At 08:45 UTC, activity shard 10 passes: 600 games, 1,980 seconds, source/spec/schedule
and 20 sampled legal replays. Total: 7,200 games. Shard 14 is accepted; 11–13 and the
powers pilot remain active. The next check is 01:58 Pacific with backoff for shard 11.

Review repair ticket 05 is complete. The checked importer integrates all 10,000 worth games
into seven calibrated rows and removes the duplicate worth proposal. The report uses
classic-odds scope; no random-pool claim or price update follows. Activity, powers and cards
have frozen context registrations, but remain incomplete until all checked shards arrive.

At 08:58 UTC, activity shard 11 passes: 600 games, 2,343 seconds and four ply caps.
The powers pilot passes: 1,056 games, 10,521 seconds and six ply caps. Both pass frozen
source, exact spec/schedule and 20 sampled legal replays. Activity total is 7,800 games.
The two free slots take activity 15–16; 12–14 remain active. Unlaunched activity: 17–18.
Power shards 0–3 can now dispatch when capacity permits; use the measured 175.4-minute
pilot plus startup margin. Four-card preflight is complete and both pilots pass, but its
pilot waits for capacity behind activity and powers. Next check: 02:09 Pacific, near
activity shards 12–13 completion. Review ticket 05 is complete; use its tested importer.

Owner, 2026-10-10: "go ahead and commit the framework branch. don't merge yet, and keep
the runs going." This approves the framework commit. Campaign runs keep the frozen source.
The shared main-checkout files stay separate. Merge remains on hold.
