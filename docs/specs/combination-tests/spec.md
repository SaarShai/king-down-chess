# Strategy and combination tests

Status: approved scope

Owner, 2026-10-10: "go ahead with that plan. analyze the existing games, shortlist the combinations, build the missing test support, and run the tests on M1 and Kaggle. only check at expected completion times, and don't merge yet."

## Scope

Use the checked 33,280-game campaign as discovery evidence. Select six to ten combinations.
Add named, numeric strategy settings, paired interaction reports, and card-aware action tracking.
Run controlled, fresh-seed tests on M1 and Kaggle. Keep the game rules and shipped AI defaults
fixed. Keep all source, schedules, data and settings explicit. No merge or deployment.

## Experiment

Use four cells: neither factor, A, B, A+B. Compare the same army draw and opening seed in all
four cells. Swap the focal side. Report the paired interaction (AB - A - B + neither), and the
four cell means, with intervals across independent army/seed blocks. Piece factors replace one
named reference piece; report the replacement. The result is conditional on that replacement,
not a universal material value. Card factors change the focal hand; the opponent stays fixed.
Compare numeric power-saving presets against the default opponent. A preset changes search
incentives, not legal moves. Log the moves and actual use, since a setting may not change play.

Discovery is descriptive and may be confounded by the rest of the army. Do not label a shortlist
winner as a confirmed interaction. Use new seeds for confirmation and adjust for the number of
combinations. Depth 3 screens; depth 4 confirms the selected signals. Track draws, side advantage,
length, caps, participation, and card use, with examples and counters. No rule adoption follows.

## Compute and evidence

Time a representative pilot before each new depth/compute wave. At most five Kaggle notebooks
across the account; each below nine hours. M1 uses eight workers only after identity, AC power,
and idle-state checks. No heavy simulations on the owner's local Mac. Use unique, absent shard
names and never repeat accepted shards. Check only at expected completion, with measured time
and a startup margin. Keep failed output. Verify exact schedules and legal replays before use.
