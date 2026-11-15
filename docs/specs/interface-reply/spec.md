# Reply: the computer's turn stays off the page thread

Status: ready-for-human

Branch: `redesign` (the uncommitted tree of the launch build, lane "speed"). No commit, push, pull request or deploy until the owner says so.

## 1. Source

Launch decision 44 in the design project (`runs/launch/decisions.md`), from three audits:

- The speed audit `runs/launch/speed/report.md`, fault 3 and fix 2: on "slow 4G" the first reply takes 9.2 s, the engine stops its worker, and each later reply blocks the page for 0.5 to 0.8 s. Budget: no task over 200 ms.
- The opponent audit `runs/launch/opponent/report.md`, faults F2 and F7, recommendations R1 and R5: in card games a reply can take 2 times its time budget (seed 2300005, ply 15), and `npm run balance:check` gives 2 document-drift errors.
- The soak audit `runs/launch/soak/report.md`, fault 2: in one game the page did not answer for 60 to 90 s during a reply after Back to home, Continue and End turn. It did not occur again.

## 2. The plan

### Goal

In normal play the computer searches in its worker. The worker starts when the game opens. The page thread searches only when the worker cannot work. A search stops near its time budget, also in positions with very long move lists. The level strength does not change.

### Scope

[Issue 01](issues/01-reply-off-the-page.md): the parts of decision 44.

1. The engine worker starts when the game opens.
2. The fallback to the page thread starts its timer at the worker's first "ready" message and waits the move time plus 8,000 ms.
3. The search reads its clock after long move lists (the time-check fault of the slow card replies).
4. The two document-drift errors of `npm run balance:check`.
5. Soak fault 2: what the stage found and what the change does for it.

Not in scope: other search changes and level changes (decision 44; opponent R3, R6 and R7), the level lines (decision 46, stage "menus"), the length of the Beast's chain-capture list (a rule of the pieces; see Known limits in the issue).

### What does not change for the old screens

`src/game.ts`, `src/ai/worker.ts` and `src/ai/search.ts` are shared with the old page, the match worker and the tools. Each change sits behind a named option that is off by default:

- `new Engine({ waitReady, workClock })`: only the new page (`src/interface/play/main.ts`) passes them. Without them the engine starts its worker at the first search and stops it the move time plus 2,500 ms after the request, as before.
- `SearchOptions.workClock`: without it the search reads the clock each 128 nodes, as before.
- The worker now sends one `{ ready: true }` message when its code has loaded. An engine without `waitReady` ignores it: a message with no search id answers no search.

## 3. Verification

[Issue 01](issues/01-reply-off-the-page.md), section "Verification".

## 4. Reviews

The lead decided the scope (decision 44). An independent review comes before a pull request.
