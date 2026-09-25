# Club depth is a time budget, not one ply

> Recovery status, 2026-09-24: Policy explanation retained: Club caps thinking at 800 ms and equals Strong at the default budget. The labels are not calibrated ratings. [Catalog and qualifications](../cursor-recovery/2026-09-24-0213b442/RESEARCH.md) · [Adoption record](../cursor-recovery/2026-09-24-0213b442/EXECUTED.md).

2026-09-24. From `src/ai/skill.ts` and how `src/main.ts` calls the engine.

## The worry

A fixed depth-1 search can miss a winning ogre shove that depth 2 finds. That is a real limit of searching only one ply. It is **not** how the playable computer is limited at Club (or at any skill).

## What the playable game actually does

The Think slider defaults to **800 milliseconds** (`index.html`: `value="800"`). New games default to Club skill.

On each computer move, `main.ts` builds a `skillPlan` from the chosen skill and the Think value, then asks the engine for a move with a **time budget** (`timeMs`) and a temperature. It does **not** pass a one-ply depth cap. Weaker skills still search; they get a shorter or equal clock, then sometimes play a worse move from that search (randomness / blunder chance). A depth cap was the wrong kind of weakness — see the comment in `skill.ts` and `docs/research/ai-players.md` §5.

## The four time budgets

With the default Think of 800 ms, each skill is allowed:

| Skill | Time allowed | How it is set |
|---|---|---|
| Beginner | **700 ms** | `min(Think, 700)` |
| Casual | **800 ms** | `min(Think, 800)` |
| Club | **800 ms** | `min(Think, 800)` |
| Strong | **800 ms** | full Think (no skill cap) |

If the player raises Think above 800 ms, Strong gets the full slider; Club and Casual stay capped at 800 ms; Beginner stays capped at 700 ms. If they lower Think, every skill that uses `min` follows the lower value.

## Bottom line

Missing a winning shove at depth 1 is a property of a depth-1-only probe. A Club game is limited by about **800 ms of search time**, not by a one-ply cap, so that miss is not the Club limit.
