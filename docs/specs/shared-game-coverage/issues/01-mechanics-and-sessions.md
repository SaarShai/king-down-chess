# Prove the complete shared mechanics and session paths

Type: task
Status: claimed
Parent: U05

## Outcome

Prove the full released mechanic roster and important interactions through shared website and embedded account play. Reuse existing tests and repair confirmed gaps. Complete the remaining local and account session criteria before advancing.

## Checkable work

1. Audit the released roster and current engine/service/browser evidence in parallel, without duplicating U04.
2. Extend the existing compiled browser checks for missing roster actions and interaction effects. Assert accepted state and reload, not just visible controls.
3. Add focused checks and fixes for confirmed session gaps. Preserve separate local and account authorities.
4. Run relevant checks once per changed tree. Obtain independent review. Record exact source, output paths, failures and repairs.
5. Verify actual staging website and ChatGPT. Update the blueprint only when the evidence satisfies U05.

## Current evidence

U04 already proves game-owned immutable rules, search isolation, multi-action budgets, cancellation, and the representative March/Maester/Morph web–ChatGPT journey. Its full-suite run and focused repairs are preserved. This ticket extends that evidence; it does not count the same journey as full roster coverage.

## Integrated changes and receipts

- `833c0eef`: drafts require the stored engine identity as well as account, game, revision and rules. Focused identity checks: 210 tests in five files, typecheck and 53 artwork checks pass.
- `90c3121d`: 55 named replay fixtures cover six fairy types, 21 released cards, 12 powers and 16 high-risk interactions. Each turn checks its expected effect and save/reload. Focused fixture checks: 56 tests plus 53 artwork checks pass.
- `2989b61c`: HTTP/MCP fixture views and saved-state audits carry the real implementation identity. Focused tooling checks: 23 tests plus 53 artwork checks pass.
- `93d2cbd3`: the `shared-mechanics` browser check drives both compiled clients through real board controls, real HTTP/MCP and one disposable database. It checks accepted state, stored surface, history, uses and remount. The final compiled matrix pass is recorded below.
- `92be70f0`: account screen close releases clocks, observers, frame callbacks and sheet listeners. Delayed replies cannot access removed account DOM. Isolated worker verification: 106 tests, typecheck and 53 artwork checks pass. Root integration adds board/renderer disposal and guards connection/display-mode callbacks.
- Equal-revision reads now replace the complete seat projection, including empty/redacted command lists. The unchanged board keeps interaction state while its private data is replaced. This fixes stale cached payloads; no visible message disclosure was demonstrated.

## Verification selected for the final tree

Run the combined focused lifecycle, board, motion, keys, turn and level checks. Then run `shared-mechanics`, `painted-game`, `web-online` and `plugin-ui-http` through the existing browser wrapper. Reuse U04's unchanged new-game/same-device setup evidence. `web-online` supplies actual offline network-cut, reload, lesson/Workshop preservation and AI reply checks. Record all run folders and failures below before closure.

The actual staging check will use the existing authorized account and ordinary games. Full roster coverage belongs to the compiled web and MCP/AppBridge matrix. Actual ChatGPT smoke supplements it. Do not claim that all matrix rows were replayed in the live ChatGPT host. Staging has one auth user; no extra credentials or product fixture endpoint are needed for this acceptance gate.

## Final focused verification

The first integrated run passes 398 tests and finds 11 failures. Six assertions expose unchanged-revision draw-offer controls that need a refresh. Three draft cases use an obsolete synthetic view without implementation identity. The teardown case sends an invalid raw message instead of the SDK lifecycle. The rematch watch exposes lost recent-activity timestamps after a delta read clears commands.

Repairs keep the product identity guard, use the real AppBridge teardown, refresh visible action metadata, and reread the existing cached command window. The service still caps this window at 50 commands. There is no second polling state store or extra API request.

The repaired combined run passes 420 tests in ten selected files and all 54 artwork checks, with no skip; see `/tmp/kingdown-u05-final-focused-2.log`. It includes source browser checks for input, motion and disposal. Two independent readers find no should-fix in the product lifecycle/privacy change, including the final polling delta. Actual staging remains pending.

## Compiled verification

The first run (`app-4e06nb`) exposes three test setup faults and one unexplained browser error. The mechanics runner renames the same test accounts twice. The painted driver opens Menu while a move animation still takes that click. The web recovery driver expects obsolete 404 responses from public account entry routes. Repairs initialize each test actor once, wait for the ready action state, and preserve private route/cache assertions while accepting current public routes.

The second run (`app-UkYmgo`) passes `painted-game` (111.2 s) and `web-online` (113.5 s). This supplies current-tree Review, Today, local input, offline practice, offline lesson/Workshop, private-cache and recovery evidence. The archived worker `d1eb413b…` passes 142 archive checks, typecheck and 54 artwork checks.

Later runs expose test-driver errors, not changed mechanics: Archer shots need source selection despite their equal source/target; the embedded host must enter the full game surface before mounting a board. With those corrections, all six fairy types, 21 cards and 12 powers pass on both clients. Six interaction rows also pass before the standard-promotion fixture correctly ends as an insufficient-material draw. The driver must inspect the finished board through its result/review controls; it cannot use the hidden playing-only Menu. The full 55-row check is still open.

The six artwork CSP errors come from the local host removing an iframe before the SDK teardown. A temporary initiator probe identifies the old board portrait assignment. `34d5fab4` tears down the old resource before removal and removes all probes. The next run (`app-qFautS`) exposes a second host-order issue: fresh-host state can be overwritten during that awaited teardown. Preserve SDK teardown and reset the new host state after it. Do not relax CSP or ignore browser errors. The next run needs both repaired checks; neither failed run counts as acceptance.

Independent review of the driver and teardown delta finds no confirmed should-fix by source inspection. Execution supplies the additional end-screen and fresh-host-order failures above. This distinction is retained so that source review is not mistaken for a browser pass.

## Remaining lifecycle correction

Run `app-CtzJPy` passes setup defaults, 16 toggle mixes, both seat kings, four computer levels, weighted locks, card-safe powers, saved choices and lost-Start remount. It then finds a real disposal bug: setup `onStop` invokes the user-close path, which clears the persisted open sheet. The remounted seat cannot restore its king dialog. Separate DOM/listener disposal from user close; add a regression that preserves widget state across SDK teardown. Audit other disposal callbacks for the same cause before another compiled run.

The matrix failure in that run is a different test race: its mount wait catches an outgoing game's poll response. `74759043` matches the selected game's full read for mount and reload, excludes incremental polls, and keeps the exact identity/state/history/result assertions. No stale application response is accepted as correct.

## Complete matrix and final integration

Run `app-TxaUyR` completes all 110 gameplay cases, then catches an Earth Quake renderer error. A legal empty quake center has no single piece to animate. The area-push path incorrectly asks the single-piece planner for that empty square's art. `1b900718` skips that planner for area pushes; the normal authoritative board sync displays the accepted result. A real scene regression reproduces the crash before the fix and covers both motion settings after it (`5872c8bc`). Independent review finds no should-fix.

The integrated renderer, lifecycle, SDK teardown and error-trap checks pass 73 tests in four files, full typecheck and 54 artwork checks. The earlier 420-case focused run remains applicable to unchanged paths. Logs: `/tmp/kingdown-u05-integration-lifecycle.log`, `/tmp/kingdown-u05-quake-red.log` and `/tmp/kingdown-u05-quake-green.log`.

Run `app-Dfr0Y7` passes all 110 cases and their browser error checks. Its final JSON write fails because a successful run takes no failure screenshot and has not created its output directory. The runner now creates that directory explicitly before writing its report. The embedded journey gets farther and exposes a retained-read injection that disappears across SDK teardown; this remains under investigation. Neither overall failed check is marked complete.

## Coverage limits

No exhaustive claim for all possible card/power combinations. Use small complete admission tables and targeted high-risk interactions. No production or original-project writes. Keep the unresolved startup error separate from mechanics claims.

The compiled matrix checks complete-turn boundaries and the final state on both surfaces. Mid-action checkpoints remain engine replay/reload evidence, not browser checkpoint evidence. Actual ChatGPT host smoke is a separate final gate.

## Accepted matrix and remaining journey gate

Run `app-iyECZN` on source `43b6f40e` passes all 55 named cases on both surfaces (110 executions, 126 seconds) and writes `shared-mechanics.json`. Accepted state, history, uses, reload and browser error assertions all pass. The report and log are preserved in the parent project evidence folder. This is local compiled HTTP/MCP coverage, not 110 actual ChatGPT host opens.

The same run exposes a failed-rematch Resume loop in the full embedded journey. U07 ticket 04 owns its minimal retained-Retry fix and 30 passing source checks. The broader source app suite passes 131 of 133 cases; its two failures identify a missing Next game refresh and an invalid same-identity rules mutation in the power-focus test. Both remain explicit gates before the next compiled journey and staging verification. No matrix rerun is required for rematch-only recovery changes.

## Compiled journey pass and actual staging finding

The two source app failures are repaired in `9f719633`: the next ready-game candidate refreshes the action row, and the focus regression uses an actual Haste game with a presence-only update. Both selected cases pass; the other 131 are deliberately excluded in that focused run, not newly claimed as passing.

The complete compiled `plugin-ui-http` run `app-dpkaQp` passes in 235.8 seconds, including SDK remount, phone/desktop rematch recovery, account journeys and the final browser error assertion. All current U05 compiled gates now have evidence.

Source `9f719633` is deployed only to staging as `dpl_DcfdH39aR1MN387bX7YsxdLpJshX`. The staging alias index hash matches the built artifact. Native ChatGPT opens and resumes the preserved game without Try again. Native website startup also succeeds; an earlier debugger-attached reload fails the cache access gate. Preserve that tooling limit rather than weakening the gate.

The preserved game accepts website Freeze plus knight movement, then ChatGPT Ice Wall plus knight movement. Both surfaces show the same 15 accepted actions after reload, including the computer Ice Wall and stationary archer capture. This live check also finds an empty Choose a move list after a card step. Direct board continuation works; the picker reopens cleared DOM instead of current choices.

`009f2a44` repairs the picker. A public create/setup regression first fails on the missing ordinary move after Freeze, then passes with the fix; typecheck and all 54 artwork checks pass. Independent review finds no should-fix. The complete matrix passes again on `d6b73a33` in `app-y1cbkf` (132.2 seconds, 55 cases on each surface). That source is deployed only to staging as `dpl_DsfT4jDR54iCpRWqeoPKQQtD4xi9`; the alias index hash matches the built artifact.

The final native website reload then fails with “Online play is unavailable until the public cache is safe.” This occurs after the debugger banner is cancelled; the exact cause is not established. Do not dismiss it as tooling interference. A local regression with the real service worker reproduces one release-transition failure: the uncontrolled page waits on a retired worker even after its replacement activates. The cache transition ticket owns the repair and preserves fail-closed access. The Mac is locked before further native diagnostics; the requested unlock remains pending.

U05 stays open until the corrected build passes the live picker continuation and native fresh opens without Try again. Existing mechanics and cross-surface receipts remain accepted; this startup gate does not require rebuilding their coverage.
