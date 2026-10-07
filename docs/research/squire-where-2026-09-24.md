# Squire drop place and check — first look (2026-09-24)

> Recovery status, 2026-09-24: Lab-only historical reserve experiment. The implementation and raw games are archived; its movement/attack, hash, material and evaluation limitations prevent adoption or a balance verdict. Catalog and qualifications (`dd34fa5:docs/cursor-recovery/2026-09-24-0213b442/RESEARCH.md`) · Adoption record (`dd34fa5:docs/cursor-recovery/2026-09-24-0213b442/EXECUTED.md`).

Exploration only. Defaults and the pool stay as they are. Forty-eight games an arm, depth 3,
twelve shared arrangements, seed 95, step Squire. A sample this size can show where the drop
lands and whether a rule bites; it cannot decide fairness.

The free drop (any empty square) was compared with two lab switches already in the rules:
`squireHome` (drop only on your own back rank) and `dropBlocksCheck=false` (a drop may not
answer check; the default lets it).

| arm | rule | decisive | draws | mean plies | every game drops? | drop ranks (1\|8 vs mid) | drops while mover in check |
|---|---|---|---|---|---|---|---|
| sh-any | step Squire, free square | 45 (0.94) | 3 | 92.8 | yes — both sides, 96 drops | 1 home, 95 mid | 0 of 96 |
| sh-home | + `squireHome` | 41 (0.85) | 7 | 104.7 | yes — both sides, 96 drops | 96 home, 0 mid | 0 of 96 |
| sh-noblock | + `dropBlocksCheck=false` | 45 (0.94) | 3 | 92.8 | yes — both sides, 96 drops | 1 home, 95 mid | 0 of 96 |

Rank counts come from the LAN (`E@e1` is rank 1). Home-arm splits: 48 on rank 1, 48 on
rank 8 (White’s first rank and Black’s eighth). Free and no-block arms match: ranks 3–6 take
almost every drop (16+30+26+21); one each on 2, 7, and 8.

“Drops while the mover was in check” is from a legal replay of each JSONL under that run’s
stamped rules: before every `@` move, ask whether the side to move was already in check.
`events.checks` alone is only a per-game total of checks given, so it cannot place a check on a
particular drop; the replay fills that gap. Result: zero such drops on every arm.

## What a player would notice

Locking the drop to the back rank changes the feel. Free of that lock, both sides spend the
Squire almost at once (first drop around ply 1, second around ply 3), nearly always into the
middle of the board. With `squireHome`, they still always drop, but later (first around ply 6)
and only onto the home rank. Games run about a dozen plies longer and draws rise (7 against 3),
with five of the home draws by repetition. That is a quieter, slower entry for the piece — not
a dead rule, but duller than the free mid-board drop.

Forbidding a drop that answers check changes nothing a player would see in this sample. No
drop was played under check on any arm, so the switch never fired; keyed by game id, the free
and no-block move lists are the same. At this depth the Squire is spent in the opening, before
checks start.

## What this does not say

Do not adopt either switch from these numbers. They answer place and check timing for the step
Squire at depth 3, not balance or taste for a finished rule.
