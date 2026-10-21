# Shared Ranked and Casual screens

Status: source complete. Integration checks remain in ticket 30. Parent: ticket 30. Staging only.

## Plan and checks

1. Keep creation mode in the setup draft, saved settings and retry. Ranked fixes the approved options and random colour. Computer, friend, Play now and End New game use Casual.
2. Gate the lobby list, own waiting shortcut and direct accept by stored policy. Keep the selected policy through handle creation.
3. Show the stored policy in game lists, board Menu, profile history and End. Explain the fixed family and permitted built-in guidance.
4. Check setup and settings boundaries, lobby policy separation and handle continuation, shared list labels, and the existing app lifecycle tests. The parent runs the compiled journey after integration.

## Progress

The shared setup now has the Ranked choice. Its fixed options, mode and private king choice survive saved settings and retries. Play now and End New game use Casual. Custom pool sheets stay closed in Ranked.

The lobby keeps the chosen setup. Its list, own waiting shortcut and direct accept use the stored policy. Handle creation keeps the accept policy. The shared list, board Menu, profile history and End show the policy. Old computer games show Legacy; old human games show Legacy rated. Ranked rules state the built-in help and outside-advice policy.

## Evidence

- Backend parent: `db98bb0d`, applied here as `d2e0ceba`.
- `KINGDOWN_TEST_FILE='src/{plugin/screens/setup-model,plugin/screens/lobby,plugin/app,account-game/games-list}.test.ts' npm test`: typecheck passes; 4 selected files and 131 cases pass. The standard 54 document animation cases pass too. This is a focused pass, not a full-suite pass.
- Tests cover fixed Ranked configuration, optional saved mode, Casual quick/new-game setup, Find retry mode, policy separation with Any rules, own waiting games, and accept continuation after handle creation.
- Final static review separates Legacy computer labels from Legacy rated human labels. Its added assertion waits for the next compute lane.
- `git diff --check` passes.

The parent owns compiled shared-journey and rendered checks. No production, deploy or live database change is part of this work.


## Screen fixture follow-up

The in-memory screen fixture now projects stored policy to view, inbox and lobby. It uses the production schema, ranked options and start key. Find stays inside its policy, direct accept checks the selected policy, and rematches start Casual. Old history and inbox seed rows default to Legacy. A view seed can set its policy explicitly. Existing direct fixture-test accepts now send policy; one focused case checks mode and projections. The parent owns the targeted fixture test and compiled checks. No CPU check runs in this follow-up worktree.


## Pending Find remount correction

A lobby Find does not save last setup. After a lost reply, a lobby remount must derive its shown mode, rules and colour from the pending Find. `currentSetup()` now supplies that effective setup to both lobby and Play. The correction keeps the labels and filters aligned with Retry. Two opposed saved/pending-mode cases cover a lobby remount without opening Play. The parent owns execution; no CPU check runs here.
