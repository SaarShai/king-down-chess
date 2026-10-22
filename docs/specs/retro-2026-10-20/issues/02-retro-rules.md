# One rule store and current-state docs

Status: done
Type: task

## Plan

1. Put the current run, role and commit rules in AGENTS.md. Keep its phrase, link and merge guards.
2. Correct each current-state claim in the ticket. Check the deal, pool and defaults against code. Keep dated decisions as history.
3. Fix each confirmed review fault. Add checks for the card readings, trailers, aliases and retained owner rules. Restore the deploy files to the base.
4. Commit the change. Run the type check and whole unit suite on the M1. Run plugin-ui through the check runner. Record the results here.

## Proof required

- Each claim has a source path and line in this ticket.
- The steering docs, balance drift, trailer and alias tests pass. The deploy files match the base.
- The type check, whole unit suite and browser check pass at the tested commit.
- No deploy, push, merge or sign-in takes place.

## Scope

The owner asks for these tracker and lesson corrections on this branch. This is an exception to the normal main-only rule for those files.
The current house rule requires the Claude Code trailer and a tool trailer for outside work. This rule takes precedence over the older memory rule.

## Build

### Part 1: shared rules

- AGENTS.md states the standing run order for idle M1 and Kaggle machines. This Mac keeps deploy checks and one browser check at a time. Feature merges keep the approved-spec step path. Deploys and store submission need the owner's word.
- Each agent family reads the role file. Work and review roles stay separate from agent names.
- The current house rule sets the trailers. The name matcher accepts tool names and rejects the current role aliases. Independent tests cover the three required aliases.
- The phrase table keeps the owner rules. It now checks the current compute boundary and role pointer. The link, merge, heading and domain guards stay in place.

### Part 2: current-state text

- RULES.md and MATRIX.md state the shipped power mode and account deal. The local board has no card deal. The account web page is still closed. Dated decisions and art trials stay as history.
- The rules header states why each page or worker has one active rule set. It removes the old file-ownership order.
- The three checklist rows, the migration guide and the hosting guide state the current status. Phone and portal proof stays open. The TASKS.md line and the three lesson clauses are tracker files: the main session applies them on main after this merge.
- The two painted-board README entry points name the shared game scene and mark their old trials as history.
- The balance audit drops three obsolete warnings. The reviewed section pins and normal unit assertions now check the true claims. All other assertions stay.

## Verification limits

The local commit hook normally reads private secret inputs. The house rule forbids those reads. Its supported input overrides point at an empty task folder and an absent task file. The type, path, size and commit-message checks still run. A comparison with current private secret values does not run.

## Claim sources

| Corrected claim | Source |
|---|---|
| All twelve powers ship as an optional mode | `src/rules/rules.ts:167` (`BUILT`) and `:806` (`POWERS_BALANCED`); `src/main.ts:54`; `src/match/worker.ts:61` |
| The account pool has 21 cards | `src/match/setup.ts:13` (`DEAL_CARDS`); spec Q20 in `docs/specs/chatgpt-mvp/spec.md:42` |
| Both sides get the same four cards | `src/match/setup.ts:45` (`draw`, one hand); `src/match/setup.ts:87` (`buildSetup`) |
| Cards and powers default to off | `src/match/setup.ts:24` (`DEFAULT_OPTIONS`); `src/rules/rules.ts:751` (empty kings and hands) |
| A hand allows only an always-on king power | `src/match/setup.ts:69` (`validateChoice`); `src/rules/rules.ts:840` (`setRules`) |
| The local board has no card deal; the account web page is closed | `src/entry.ts:1`; `src/new-game.ts:27`; `src/main.ts:57`; `docs/specs/web-adaptation/spec.md:13` |
| The current piece pool includes the Paladin | `src/rules/setup.ts:9` (`POOL`) |
| Pages and workers set their own active rules | `src/main.ts:57`; `src/plugin/app.ts:118`; `src/match/worker.ts:61` |
| Salvation returns a lost piece; Sacrifice changes an own pawn | `src/rules/engine.ts:99`; `src/rules/engine.ts:104` |
| The painted scene ships | `src/render/PaintedView.ts:1`; `src/main.ts:69` |
| The live release meets checklist rows 20, 22 and 51 | `docs/specs/web-adaptation/issues/08-release-evidence.md:66`; `tools/deploy-live-check.mjs:18` |
| The production MCP URL and public client ID need no placeholder edit | `docs/submission/package/mcp.json:6` and `:14` |
| Migrations through 0014 and their grants are on production | `docs/specs/web-adaptation/issues/08-release-evidence.md:59`; the compiled server's schema check, `tools/plugin-db-check.mjs` |
| The combined site uses the kingdown project | `tools/deploy.sh:139`; `docs/specs/web-adaptation/issues/08-release-evidence.md:66` |
| The old project waits for retirement | `docs/specs/chatgpt-mvp/release/RUNBOOK.md:152` |
| Cleanup removes old unfinished outbox rows too | `src/online/jobs.ts:152` |
| Worktrees use wt add; checks use npm test on the M1; helpers may run | AGENTS.md; `tools/wt.sh:3`; `package.json` test script; the current owner rules supplied with this ticket |

## Check record

- `21c6728b`: the commit type check, size/path gate and commit-message hook pass. `bash -n tools/deploy.sh` and `git diff --check` pass.
- `plugin-ui`: PASS on this Mac at `21c6728b`, 202.7 s. The check runner reports exit 0. Log: `checks-build-2.txt` in the lane output folder.
- The first detached browser launch leaves no process or log result. The foreground check above supplies the result.
- The first unit launch stops during the bundle copy. The second stops during checkout with no space left on the M1. Neither launch reaches a test. Logs: `unit-1.txt` and `unit-2.txt` in the lane output folder.
- The lane's failed M1 copy is removed. No other lane's files or processes change.
- `df0efb28`: the third unit launch also stops during preparation. The remote checkout reaches this commit, but its package lock differs from the template. The TypeScript executable is absent after preparation. The M1 has about 129 MiB free. No unit or art test runs.
- `npx tsc --noEmit`: PASS on this Mac after the code changes. This is a static type check, not a unit run. Log: `typecheck.txt` in the lane output folder.
- All lane commands end. The failed remote copy and bundle are removed. The M1 cleanup log is `m1-cleanup.txt`.

## Review of the change

The publish guard is one check at the input boundary. It keeps the existing engine query and adds no retry or time limit. The test fixtures give publish cases a fake read-only input. The new cases prove the missing-input stop and check-only skip.

Only the edited document sections get new pins. The untouched RULES.md base-rules pin has earlier drift; this task does not approve or change it. The optional full drift check can still report that fault.

No taste choice is required. This work corrects facts and applies the owner's rules. The old art records stay as history. The owner supplies two independent reviews. This task makes no merge or pull request.

## Proof status

The type check, whole M1 unit suite, art tests and plugin-ui pass at `a4892c8f`. The record below gives the counts and log names. A final check of the record commit uses `unit-fix-4.txt` and `checks-fix-3.txt` in the same lane output folder.

## Review fix plan

1. Check each review claim against the code and owner records. Keep the current house trailer rule.
2. State both account card readings. Restore the cloud-save rule, approved-spec merge path and agent limit. Point to the real role keys and review comments. Remove the old run gate and the test for removed warning codes.
3. Add tests for missing trailers, independent aliases and the corrected text. Check that both deploy files match `1476f55c`.
4. Commit, then run the whole M1 unit suite and plugin-ui with the required runners. Record each result and the tested head.

Pass criteria: each confirmed fault has a check; all required checks pass; the worktree is clean; no publish or branch integration takes place.

## Review findings

- A1: confirmed. `src/match/worker.ts:61` selects the balanced rules only if a king has a power. MATRIX C.2 now states both setups, with both mark costs and Strike and Haste capture limits. The schema test checks the text and both rule sets. The engine stays the same.
- A2 / B1: confirmed. Both deploy files now match `1476f55c`. A git comparison checks this. The dropped publish build is removed from this record. PR 71 owns that change.
- A3 / B4: the hook fault is confirmed. B4's proposed rule is refuted by the current house rule, which requires the Claude Code trailer and the outside tool trailer. The hook adds missing trailers once. Tests cover no trailers, each partial set, complete sets, a mixed-case key and another tool's trailer.
- A4: confirmed. COMPUTE Recipes points to AGENTS.md for the run rule. The steering test requires that pointer and refuses the old gate.
- A5: confirmed. Three matcher cases use inputs outside `MODEL_NAMES`. The M1 check shows three passes with the current matcher and three failures with the base matcher. Log: `alias-proof.txt` in the lane output folder.
- B2: confirmed. The cloud-save rule is restored. The steering test requires it. The current run's no-push rule still applies.
- B3: confirmed. `b4312d98:AGENTS.md` and `docs/specs/web-redesign/spec.md:58` retain the approved-spec step path. AGENTS.md restores it; the compute section points to the merge section. The steering test requires the path.
- B5: confirmed. The role file has `bulk`, `high` and `hard`; its comments state the review choice. AGENTS.md now names those keys and comments. The steering test requires this text. No external role file changes.
- B6: confirmed. The lesson again limits agents near the limit window and starts research after builds. A lesson test checks both clauses.
- B7: confirmed. The old logs prove no unit pass. The assertion for removed warning codes is removed. The normal schema tests retain the current-state checks and add both card setups. The full M1 suite and plugin-ui pass at the fix head; see the proof below.

## Fix checks

- `5f6ba03b`: the M1 type check passes. The unit run has 3,138 passes, 164 skips and two steering failures. Both failures are fixed: the commit section now has 120 words; HOSTING keeps its setup-guide pointer without the two links that match the secret-value pattern. No guard is weakened. Art tests do not start after the unit failure. Log: `unit-fix-2.txt`.
- `5f6ba03b`: plugin-ui runs on this Mac. The checkout guard rejects the run because this lane changes hook files during the check. The next checks use a committed, fixed checkout. Log: `checks-fix-1.txt`.
- The first queued unit command ends before tests start so the lane can test the new head. Only this lane's command stops.
- The alias check on the M1 passes all three independent cases with the current matcher. The base matcher fails all three. Log: `alias-proof.txt`.
- The balance report has the same earlier RULES section 1 drift that both reviews report. The new C.2 pin has no drift. Log: `balance-fix.json`.
- The hook error text now states that the required trailers stay. Its test checks that text. Each existing-trailer test keeps the prior 30-second limit.

All log names in this section refer to the task's `lanes/retro-rules` output folder. The required unit and browser runs now pass.

## Passed proof

- `a4892c8f`: the type check and whole M1 unit suite pass through `m1-unit.sh`. The unit result is 184 passed files, 12 skipped files, 3,140 passed tests and 164 skipped tests. All 51 art tests pass. The runner reports exit 0. Log: `unit-fix-3.txt`. The M1 has no test database; the optional drift tests also skip.
- `a4892c8f`: plugin-ui passes on this Mac in 217.8 seconds through `check-runner.sh`. The runner reports exit 0. Log: `checks-fix-2.txt`. No server code changes, so plugin-ui-http is not required.
- All 51 steering tests, all 40 matcher tests, all 11 trailer tests and all 11 commit-message tests pass. The card schema tests pass; the eight optional drift tests skip.
- The three independent alias cases pass with the current matcher and fail with `1476f55c` on the M1. Both deploy files match that base. The balance report retains only the earlier RULES section 1 error.
- This commit changes only this proof record. The final confirmation uses the same unit and browser runners at its head. No test or check limit is raised.
