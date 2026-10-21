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


## Browser test contract follow-up

Direct random-game accept calls now send the stored policy. Friend-game setup tests use Invite and Join. Exact list, history and end-reason checks include the policy label and keep their original reason, revision, board and ceremony assertions. Synthetic old history and waiting rows name Legacy; a seeded rating outcome names Legacy explicitly. The handle continuation records both accept requests and checks their game and policy.

The Collection remount check waits for a fresh settings read and mount completion before it checks the restored Cards radio. The existing dot-wrap and Menu viewport assertions stay intact; the parent repairs their product regressions. Static `git diff --check` passes. The parent owns all test execution for this patch; no new pass is claimed here.

## Short end card correction

The 201 × 357 compiled zoom case exposed a real layout fault. The two-line Legacy win reason pushed New game below the 144 px card. The empty block status also placed a 12 px margin before the actions because it kept the default flex order. At top inset 62, Back ends at 110 and only 139 px remain for the card. Raising the fixed cap alone cannot solve that case.

The narrow card now orders status and error feedback after the actions, as the landscape card already does. Short portrait cards use the height available below Back. Compact title line spacing and action gaps apply through 480 px height, so a wrapped Ranked resignation at 197 × 426 also fits. Font sizes, complete reason text and button target sizes remain intact.

Checks:

- Red: `/tmp/kingdown-end-red.log` records the 201 × 357 cue below 12 px before the repair.
- `KINGDOWN_TEST_FILE='tools/plugin-{board,app}.test.ts' KINGDOWN_TEST_NAME='end reasons and actions|populated end status|board box still behind the end card|failed end read and Retry|Retry on the end card' npm test` passes: typecheck, 12 selected browser cases and the standard 54 document animation cases. Log: `/tmp/kingdown-end-final.log`.
- Five compiled zoom sizes cover Legacy, Casual and Ranked with checkmate, resignation, timeout and material reasons: 60 presentations. The short win/loss text, first action and at least 12 px of the next action fit before scrolling. Back remains clear and hittable. Targets remain at least 48 × 48 px. Long explanations retain every word and can be read by scrolling; each full action remains reachable. The matrix uses the compiled fixture's solo actions to isolate policy text from creation admission.
- A populated status and real failed end read at 201 × 357, top inset 62, remain readable by scrolling. The recovery control remains at least 48 px high and its click clears the error. Two existing end-error recovery cases also pass.
- Four existing board-size cases pass. `git diff --check` passes. The compiled check assertions remain unchanged; the parent owns the release rerun. No full suite, release build or deploy runs here.
