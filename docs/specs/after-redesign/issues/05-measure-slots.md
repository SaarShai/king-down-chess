# 05 · Measure before N = 3

Status: done on claude/slots-3 (merges when CI passes)
Blocked by: 01

## Scope

- [Spec §3.4](../spec.md#34-measurement-before-n-goes-above-2). On this Mac, at a quiet time, on one commit: `king-effects`, `painted-game` and `qa` 3 times alone, 3 times beside one functional run, 3 times beside a build and an `npm test` in another worktree.

## Plan

1. [x] Tell the owner; wait for a quiet Mac (no build agent, no simulation). The owner (2026-10-10): "go ahead with ticket 05 now". No build agent and no simulation ran; the Mac carried its usual desk load (load average 5 to 6 from the window server, Obsidian, the Claude app and Codex), recorded with each run.
2. [x] Run the 27 checks; record each frame rate, millisecond value and time from the logs.
3. [x] If no value moves near its limit, change the default N to 3 in one commit with the table in its message; else keep 2 and record why.

## Verification

- [x] The table of values in Comments, with the commit and the date.

## Risks

- A measurement on a busy Mac gives false alarms: run it only at a quiet time.

## Does not do

- No change to the exclusive list unless the table shows a check that moves under load.

## Comments

- **Method** (2026-10-10, 11:32 to 12:54 UTC, main 46f34f72, Node v26). Three scratch worktrees outside the checkout, each with its own `npm run check:browser`. The measured run: `king-effects painted-game qa` in one worktree. The three checks are exclusive, so a measurement beside a functional run needs one local commit in that worktree that drops their `exclusive` flag (never pushed); the app code is the same. Nine runs in sequence: 3 alone; 3 beside a functional run in a second worktree (`ux-defects special-moves account new-game end cursor-adoption`, about 3.6 minutes a loop, run in a loop until the measured run ended: 54 of 54 checks passed); 3 beside `vite build` and `npm test` in a loop in a third worktree (the build takes 0.6 s with the rolldown bundler, so the load was `npm test`, about 90 s a loop; the load average rose to 12 to 19). All 27 measured checks passed; no run printed a wait line. The values below come from the logs (`run.out`, `king-effects.log`, `painted-game.log`, `qa.log`), each as the range over the three runs of that mode; the limit in brackets is the check's assertion.

| value | alone ×3 | beside a functional run ×3 | beside `npm test` and a build ×3 |
|---|---|---|---|
| load average at start → end | 5.4–6.1 → 5.4–6.0 | 5.2–6.2 → 6.1–7.0 | 5.7–14.0 → 12.0–19.0 |
| `king-effects` time, s | 105.8–106.1 | 105.6–106.0 | 105.9–106.8 |
| idle effects fps (12–40) | 20.0 | 20.0–20.5 | 20.0–20.5 |
| king blow, normal ms (1,450–2,100) | 1,658–1,665 | 1,659–1,669 | 1,651–1,670 |
| king blow, fast ms (650–1,150) | 832–844 | 830–836 | 828–835 |
| title kings fps (no limit) | 23–25 | 19–23 | 21–24 |
| scene fps, lowest (no limit) | 20.0 | 20.0 | 20.0 |
| scene frame p95 ms, highest (no limit) | 3.0–3.6 | 2.2–2.7 | 1.7 |
| `painted-game` time, s | 115.1–121.5 | 109.2–114.6 | 105.0–129.4 |
| quiet move, normal ms, highest (< 560) | 450–454 | 447–451 | 448–451 |
| quiet move, fast ms, highest (< 0.7 × normal) | 219–220 | 218–235 | 219–231 |
| quiet tap-skip ms (< 300) | 84 | 83–98 | 98–100 |
| capture animation, normal ms (no limit) | 1,637–1,648 | 1,641–1,648 | 1,634–1,642 |
| capture animation, fast ms (< 0.65 × normal) | 825–832 | 821–833 | 816–824 |
| tap-skip ms (< 600) | 157–162 | 158–162 | 162–220 |
| Off ms (< 400) | 1–6 | 1–7 | 7–36 |
| `qa` time, s (limit 900) | 169.8–395.1 | 271.6–343.7 | 175.2–258.1 |
| `qa` AI game: plies, s | 116–333, 123–348 | 219–286, 225–297 | 123–203, 129–210 |

- **Reading.** No value moves near its limit. The values that move with load are the tap-skip (157 → 220 ms, limit 600), Off (1 → 36 ms, limit 400) and the quiet tap-skip (84 → 100 ms, limit 300): each stays under 37 % of its limit. The frame rates and the blow times do not move. The `qa` time follows the length of the AI game (116 to 333 plies), not the load. The title's longest frame is 2.4 to 2.7 ms in five runs and 27 or 51 ms in four, in every mode (alone included), with no assertion on it: the pause is in the page, not in the load.
- **Decision** (plan item 3): `SLOTS` goes from 2 to 3 in this commit; `docs/COMPUTE.md`, spec §3 item 3 and D1 say so. The exclusive list does not change (the scope of this ticket): the table shows no check that moves under load. The same table would support a later step that takes `king-effects`, `painted-game` and `qa` out of the exclusive list, so that a full run no longer waits for them; that is a separate decision.
- **Transition.** A runner on a branch from before this commit takes slots 0 and 1 only; a runner on this commit takes 0 to 2. While both exist, an old exclusive check can run beside one new normal check. Branches that rebase onto main get the new constant; the window closes with them.
- **Tests.** `npm test` (the lock tests include `SLOTS` = 3) and `npm run test:docs` pass.
