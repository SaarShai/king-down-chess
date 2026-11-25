# Retro, 2026-11-24: slow runs, repeated faults and the shape of the code

Status: for the owner. Items 1, 2 and 3 are built and merged (PR 464). Items 12 and 15 are built (PR 465). Item 14 and the small faults are built (tickets [04](issues/04-lock-holder.md) and [05](issues/05-small-faults.md)). Item 6 is closed with no build. The section "Decisions after the merge" holds the decision on each other item.

Method. One helper read the session records of the last 12 days: 144 sessions (85 worktree lanes) and 327 helper records. It counted tool wait time, repeated errors and owner complaints with scripts. One helper read the code for the cost of a change: where the core lives, how each form uses it, and how many places one new card touches. The lead measured the test suite on this Mac and read the check and CI tools. Each number below comes from those sources. A guess has the label "guess".

Two cautions. The scan read only the first 600 and the last 300 characters of each tool result, so the failure counts are lower bounds. No repeated test failure is proven to be a flake: a red test in a test-first lane looks the same in the record.

## Numbers

The values come from commit `96ba0f0f6`, before the merge of 161 newer commits of main.

- In the lanes, tools take 28.2 h of 44.9 h (63%). The agent waits on tools more than it thinks.
- `npm run check:browser`: 337 calls, 576 minutes. `play-scenes` takes 220 s (median, 81 runs), `plugin-ui` 275 s, `web-game` 85 s.
- Wait loops on a log or a check: 202 calls, 371 minutes.
- Focused `npm test`: 177 calls, 222 minutes. Full `npm test`: 117 runs, median 426 s.
- The full suite on this Mac, idle: 525 s, 8,074 tests in 410 files, all green. The two type checks take 1.7 s. `tools/**` takes 83% of the test time: `deploy.test.ts` 235 s, `plugin-app.test.ts` 217 s, the `plugin-board` files 317 s. All of `src/**` takes 85 s. The rules tests take 21 s.
- The machine lease: 60 sessions wait for it. A run that waits takes 4.5 minutes (median). A run that does not wait takes 0.2 minutes.
- One card has entries in about nine tables in four forms. Today 28 non-test files in `src/` and `tools/` name `Rally`.
- `src/interface/play/main.ts` has 2,142 lines. Sessions open it 435 times; reads of it give about 11% of all tool output.

## Suggestions, most severe first

### High

1. **[Checks] The browser checks need setup that they do not do. Built: `retro-env-checks`.** `web-game` fails 18 of 36 runs, `play-scenes` 24 of 81. In 28 cases the test database address is not set; in 21 sessions the agent then builds a PostgreSQL by hand (98 calls). In 9 cases the build has no test pages. Change: the runner starts a throwaway PostgreSQL for a check with the `db` flag, prepares the schema, and stops and removes it on every exit. It builds the test pages for a check that needs them. With no PostgreSQL programs it stops before the build with one line. Result: `web-game` (83 s) and `play-scenes` (225 s) pass with no variable set. Ticket: [01](issues/01-check-setup.md).

2. **[Tests] Almost every change runs the full suite, and the full suite holds the machine lease. Built: `retro-env`.** The selection of `check:changed` knows two CSS files; each other change gives the full plan. Change: `npm run test:changed` reads the repository into one graph (imports, files that a test or a tools file names, globs, folders) and runs the test files that the change can reach. The full suite runs for a file outside `src/` and `tools/` (a hook, a migration, a public file) and for a file that no import, name or glob connects to a test. CI still runs the full plan. Measured: a change in `src/interface/play/main.ts` runs 45 of 441 files in 44 s. Estimates from the full run: a change in `src/account/account.ts` 59 s, in `src/plugin/screens/board.ts` 288 s, in `src/rules/engine.ts` 391 s (314 files: the core reaches almost every test). A change in a tools script still takes about 240 s, because `tools/deploy.test.ts` (235 s) covers most of them. History check: for 150 commits that change a test and a source file together, the first selector held 253 of 260 changed tests; each of the 7 others has a cause that is not a missed link. An independent review then found two false skips (a catch-all glob made every file look connected; a migration and a git hook reached their tests through paths that the scanner cannot read). Both are repaired and have test cases. With the repaired selector, 46 of the 150 commits give the full suite and the repairs add no miss. A second review on the merged head found a third false skip (a test that lists its own folder) and four shell variables that could narrow a full run. Both are repaired. The tickets hold the review record. Ticket: [02](issues/02-test-changed.md). The section "Tests and checks" of AGENTS.md names the command, so that agents use it in the inner loop (the owner said "add it").

3. **[Code] One new card touches about nine tables, and nothing names a missed table. Built: `retro-env-cards`.** PR 431 repaired Guide and Help lines that were false. Change: each table states its key set as a type, so a new card or power with no entry fails `npm run typecheck` at that table, and a new piece fails the forms drift test. The forms drift test started from the web table, so a piece with no web name passed; it now starts from the released pieces. No text and no behaviour changes; the worker fingerprint is the same. Ticket: [03](issues/03-card-tables.md).

4. **[Sessions] Agents wait in loops against the rule.** 873 loop calls in 159 sessions; one session waited 36.6 minutes on a log. The top-level session made 891 scheduled wake-ups and 235 `gh pr checks` calls, and the owner asked for less polling 12 times. Change: `check.mjs` and `test-lock.sh` write an end marker file, and the rule names the one wait command that reads it. A lane writes its state to one file; the lead reads the file when the owner asks. Not built: it changes the launch briefs under `runs/`, which this retro did not read in full.

### Medium

5. **[Hooks] The tool gate refuses the form that its own message recommends. Decided: no change.** About 17 of 20 `ps` refusals use `ps -o pid=,command= -p $pid` or a comma list of PIDs. The rule accepts only one literal number (`.claude/hooks/tool-gate.mjs`, `oneProcess`). Change: accept a list of numbers. A variable is a wider change. The lead did not edit a safety hook without the owner's word.

6. **[Code] The readings rule lives in at least six builders.** "A game with a power or a hand gets the balanced readings" is written out in `src/main.ts:65`, `src/new-game.ts:204`, `src/interface/play/saved.ts:38`, `src/online/launch.ts:25`, `src/screen/play.ts:690` and `src/match/service.ts:199`. Decision 188 edited five of them. Change: one function gives the readings for kings and hands; each builder calls it. A test of each builder comes first. The worker copy moves with the next engine pair, because the worker source is part of the save fingerprint.

7. **[Code] Three turn-input modules.** `src/turn.ts`, `src/plugin/screens/board-model.ts` and `src/interface/play/turn.ts` hold the same staging rules. The Sky Lift repair was made two times (fcde7a5eb, 74735c31a). Change: one draft-turn module for both boards. This needs browser checks on the web page and the plugin, so it is a class B change with its own spec.

8. **[Code] `src/interface/play/main.ts` is the largest and the hottest file.** 75 commits since 2026-11-01. Change: move the online host wiring and the card bar to their own modules. Only browser checks cover the file, so each move needs `play-scenes` and `web-game`.

9. **[Code] No platform seam.** The iOS app, the website and the plugin differ through 9 `inApp` branches in 5 files, 11 build flags, and two source rewrites by exact text in `tools/solo-launch.mjs`. The route list exists three times (`vite.config.ts`, `tools/plugin-server-build.mjs`, `SceneDelegate.swift`). Change, before a fifth environment arrives: one platform object (API origin, sign-in providers, haptics, links) with a web adapter and an app adapter, and one route table that the three places read. It needs an iOS build and a review.

10. **[Steering] The launch briefs are large.** `runs/launch/decisions.md` is 216 KB and 32 sessions read it. Change: an index with one line per decision; a lane brief names the decision IDs that it needs.

11. **[Tests] Eight test workers save about 200 s, but some tests fail under that load. Decided: 4 workers stay.** `vite.config.ts` sets `maxWorkers: 4`; this Mac has 16 cores. Two full runs with 8 workers took 327 s and 312 s, against 525 s. One run failed `tools/plugin-ios-size.test.ts` ("keeps the seat and board large at 393 × 852 with host insets 102/118"); the other was green. Change: find why that test fails under load (guess: it reads the layout before the page settles), then use 8 workers outside CI. Result: the cause is found and repaired. The two `plugin-app` tests that failed next have proven causes and repairs too (ticket [07](issues/07-plugin-app-workers.md)). But the second pass bar with 8 workers failed two other tests in run 4 of 10, with no proven cause (see "Decisions after the merge"). A suite that fails some runs is worse than a slow suite.

### Low

12. **[Shell] The shell is zsh.** About 37 failures come from `echo ====` and from a glob with no quotes. Change: one line in `docs/COMPUTE.md` beside the existing zsh note.
13. **[Briefs] A helper brief and a hook disagree.** 26 refusals: a helper tries to write a report file, or calls the plan tool. Change: the brief tells a helper to give its result as text.
14. **[Lease] The wait line of `test-lock.sh` does not name the holder.** The check runner's wait line does. During this retro a 22 s test run waited more than 6 minutes for a lane that the line did not name. Change: write the PID and the folder into a record beside the lock file (the lock file itself is the lease identity), and print them. Built: ticket [04](issues/04-lock-holder.md).
15. **[Search] `engines/` holds 56,000 lines of released bundles.** They must stay (save compatibility). Change: an ignore file for the search tools, so a search of the code skips them.
16. **[Tests] Between 17 and 75 test files read source text.** A rename breaks them with no change in behaviour. Change: when one of them fails on a rename, replace it with a test of the behaviour. No batch rewrite.

## Decisions after the merge

The owner gave these decisions to the lead ("you decide what is best").

- Item 2: AGENTS.md names `npm run test:changed`.
- Item 5: no change. The lead does not edit the hook that controls its own tools, and the cost is small: about 17 refusals in 12 days.
- Item 11: the suite keeps 4 workers. The cause of the `plugin-ios-size` failure is known and repaired: the test read the place of the canvas before the board had its size (ticket [06](issues/06-test-workers.md)). But a full run with 8 workers then failed a different test in `tools/plugin-app.test.ts` (line 2018): 1 red in 3 valid full runs. A run of the plugin files failed one more (line 1379); this is weaker evidence, because that run held a probe copy and most likely, not certainly, used 8 workers. Ticket [07](issues/07-plugin-app-workers.md) finds both causes and repairs the tests: line 1379 taps before the board preview reply, and line 2018 reads at once after `setOffline(false)`, which fails if the browser applies the online state late. The proof is a forced order (red with the exact line, green with the repair); that a full suite gives that order is an inference. Line 2018 also failed with 4 workers (three session reds in October). Its pass bar then failed run 4 of 10 on `plugin-real-host` and `plugin-setup-owner`: the first wait after a page boot passed 5 s, with no proven cause. So 8 workers are still not safe, and the suite keeps 4.
- Measured in the same work: `tools/deploy.test.ts` (207 tests) takes 235 s in the idle run with 4 workers of this retro and 274 s in a run with 8 workers. It runs in one worker, so it sets the shortest possible run for each selection that holds it. Its sections in the 274 s run: `deploy.sh` 139 s, the two slow-link sections 57 s, the two `--publish` sections 33 s (`deploy.sh --publish` 28 s, `deploy.sh --target plugin --publish` 5 s), `deploy-live-check.mjs` 26 s. With the numbers of that run, a split of the file by section lowers a selected run by about 135 s (274 s to 139 s) for a selection that does not hold `tools/plugin-app.test.ts`, and by about 60 s (274 s to 215 s) for a selection that holds it. It does not lower the full suite with 4 workers, where the total work sets the time. Not built.
- Items 12 and 15: built. `docs/COMPUTE.md` holds the zsh line, and `.ignore` keeps `engines/` out of a search.
- Item 6: closed, with no build. The retro did not weigh PR 429 (decision 188). Its test `src/match/one-reading.test.ts` fails when the match worker, the solo hand-over and the solo page give different readings, and `src/match/service.test.ts` holds the game record. The old page (`src/main.ts`, `src/new-game.ts`, `src/screen/play.ts`) cannot start a new game with a hand, and its rematch with a hand gets the balanced readings. The builders take different inputs (a game type, options, kings and a hand, stored rules), so one function would hold only "a power or a hand". The one fault of this kind was in a check tool; ticket [05](issues/05-small-faults.md) repairs it.
- Item 9 is the next large item. It needs its own spec.
- Items 7 and 8 wait: a different session of the owner works on the GUI, and these items change the same files (`src/interface/play/main.ts` and the turn modules).
- Items 4 and 10 wait: they change the launch briefs under `runs/`, which this retro did not read in full.
- Item 14: built. The wait line names the holder, or says "holder unknown" with the last record.
- Items 13 and 16 stay open.

## Faults found on the way

- `tools/forms-drift.test.ts`: the piece name test could not fail for a missing piece. Repaired in item 3.
- `src/interface/play/learning.ts:59` reads a Guide note with no fallback, so a missing note throws. The new test of item 3 prevents the missing note.
- `src/render/effects/power-overlays.ts:179` casts an action ID to a kind with no check. No change: only the six IDs of the kind get to the cast (ticket [05](issues/05-small-faults.md)).
- `src/card-symbol.ts:45`: the comment says that a released card can have no painting; all 21 cards have one. Repaired (ticket 05).
- `tools/verify-motion-concepts.mjs:45` gives the balanced readings for kings only, but it sets hands (guess: stale since decision 188). Repaired (ticket 05).
- The hand size 4 is in two dealers (`src/match/setup.ts:58`, `src/interface/play/new-game.ts:124`). Correct now; it can drift. A test now fails when the two dealers differ (ticket 05).

## What this retro did not determine

- Which repeated test failures are flakes. The files that fail in the most sessions: `tools/plugin-app.test.ts` (7 sessions), `home-reveal.test.ts` (6), `saved.test.ts` (5 sessions, 12 failures). The checks: `signin-speed` fails 9 of 14 runs, `owner-playtest-round2-b` 8 of 11.
- The true time of background runs: the 600 s shell limit hides it.
- CI: 22 re-runs in the period; `verify` and the WebKit jobs fail most. Not examined.
