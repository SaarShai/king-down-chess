# Retro, 2026-11-24: slow runs, repeated faults and the shape of the code

Status: draft for the owner. Three items are built on local branches (not pushed). The other items wait for the owner's decision.

Method. One helper read the session records of the last 12 days: 144 sessions (85 worktree lanes) and 327 helper records. It counted tool wait time, repeated errors and owner complaints with scripts. One helper read the code for the cost of a change: where the core lives, how each form uses it, and how many places one new card touches. The lead measured the test suite on this Mac and read the check and CI tools. Each number below comes from those sources. A guess has the label "guess".

Two cautions. The scan read only the first 600 and the last 300 characters of each tool result, so the failure counts are lower bounds. No repeated test failure is proven to be a flake: a red test in a test-first lane looks the same in the record.

## Numbers

- In the lanes, tools take 28.2 h of 44.9 h (63%). The agent waits on tools more than it thinks.
- `npm run check:browser`: 337 calls, 576 minutes. `play-scenes` takes 220 s (median, 81 runs), `plugin-ui` 275 s, `web-game` 85 s.
- Wait loops on a log or a check: 202 calls, 371 minutes.
- Focused `npm test`: 177 calls, 222 minutes. Full `npm test`: 117 runs, median 426 s.
- The full suite on this Mac, idle: 525 s, 8,074 tests in 410 files, all green. The two type checks take 1.7 s. `tools/**` takes 83% of the test time: `deploy.test.ts` 235 s, `plugin-app.test.ts` 217 s, the `plugin-board` files 317 s. All of `src/**` takes 85 s. The rules tests take 21 s.
- The machine lease: 60 sessions wait for it. A run that waits takes 4.5 minutes (median). A run that does not wait takes 0.2 minutes.
- One card has entries in about nine tables in four forms. Today 28 non-test files name `Rally`.
- `src/interface/play/main.ts` has 2,142 lines. Sessions open it 435 times; reads of it give about 11% of all tool output.

## Suggestions, most severe first

### High

1. **[Checks] The browser checks need setup that they do not do. Built: `retro-env-checks`.** `web-game` fails 18 of 36 runs, `play-scenes` 24 of 81. In 28 cases the test database address is not set; in 21 sessions the agent then builds a PostgreSQL by hand (98 calls). In 9 cases the build has no test pages. Change: the runner starts a throwaway PostgreSQL for a check with the `db` flag, prepares the schema, and stops and removes it on every exit. It builds the test pages for a check that needs them. With no PostgreSQL programs it stops before the build with one line. Result: `web-game` (83 s) and `play-scenes` (225 s) pass with no variable set. Ticket: [01](issues/01-check-setup.md).

2. **[Tests] Almost every change runs the full suite, and the full suite holds the machine lease. Built: `retro-env`.** The selection of `check:changed` knows two CSS files; each other change gives the full plan. Change: `npm run test:changed` reads the repository into one graph (imports, files that a test or a tools file names, globs, folders) and runs the test files that the change can reach. The full suite runs for a file outside `src/` and `tools/` (a hook, a migration, a public file) and for a file that no import, name or glob connects to a test. CI still runs the full plan. Measured: a change in `src/interface/play/main.ts` runs 45 of 441 files in 44 s. Estimates from the full run: a change in `src/account/account.ts` 59 s, in `src/plugin/screens/board.ts` 288 s, in `src/rules/engine.ts` 391 s (314 files: the core reaches almost every test). A change in a tools script still takes about 240 s, because `tools/deploy.test.ts` (235 s) covers most of them. History check: for 150 commits that change a test and a source file together, the selection holds 253 of 260 changed tests; each of the 7 others has a cause that is not a missed link. An independent review then found two false skips (a catch-all glob made every file look connected; a migration and a git hook reached their tests through paths that the scanner cannot read). Both are repaired and have test cases. Ticket: [02](issues/02-test-changed.md). Owner decision: add one line to the section "Tests and checks" of AGENTS.md, so that agents use it in the inner loop.

3. **[Code] One new card touches about nine tables, and nothing names a missed table. Built: `retro-env-cards`.** PR 431 repaired Guide and Help lines that were false. Change: each table states its key set as a type, so a new card, power or piece with no entry fails `npm run typecheck` at that table. The forms drift test started from the web table, so a piece with no web name passed; it now starts from the released pieces. No text and no behaviour changes; the worker fingerprint is the same. Ticket: [03](issues/03-card-tables.md).

4. **[Sessions] Agents wait in loops against the rule.** 873 loop calls in 159 sessions; one session waited 36.6 minutes on a log. The top-level session made 891 scheduled wake-ups and 235 `gh pr checks` calls, and the owner asked for less polling 12 times. Change: `check.mjs` and `test-lock.sh` write an end marker file, and the rule names the one wait command that reads it. A lane writes its state to one file; the lead reads the file when the owner asks. Not built: it changes the launch briefs under `runs/`, which this retro did not read in full.

### Medium

5. **[Hooks] The tool gate refuses the form that its own message recommends. Owner decision.** About 17 of 20 `ps` refusals use `ps -o pid=,command= -p $pid` or a comma list of PIDs. The rule accepts only one literal number (`.claude/hooks/tool-gate.mjs`, `oneProcess`). Change: accept a list of numbers. A variable is a wider change. The lead did not edit a safety hook without the owner's word.

6. **[Code] The readings rule lives in at least six builders.** "A game with a power or a hand gets the balanced readings" is written out in `src/main.ts:65`, `src/new-game.ts:204`, `src/interface/play/saved.ts:38`, `src/online/launch.ts:25`, `src/screen/play.ts:690` and `src/match/service.ts:199`. Decision 188 edited five of them. Change: one function gives the readings for kings and hands; each builder calls it. A test of each builder comes first. The worker copy moves with the next engine pair, because the worker source is part of the save fingerprint.

7. **[Code] Three turn-input modules.** `src/turn.ts`, `src/plugin/screens/board-model.ts` and `src/interface/play/turn.ts` hold the same staging rules. The Sky Lift repair was made two times (fcde7a5eb, 74735c31a). Change: one draft-turn module for both boards. This needs browser checks on the web page and the plugin, so it is a class B change with its own spec.

8. **[Code] `src/interface/play/main.ts` is the largest and the hottest file.** 75 commits since 2026-11-01. Change: move the online host wiring and the card bar to their own modules. Only browser checks cover the file, so each move needs `play-scenes` and `web-game`.

9. **[Code] No platform seam.** The iOS app, the website and the plugin differ through 9 `inApp` branches in 5 files, 11 build flags, and two source rewrites by exact text in `tools/solo-launch.mjs`. The route list exists three times (`vite.config.ts`, `tools/plugin-server-build.mjs`, `SceneDelegate.swift`). Change, before a fifth environment arrives: one platform object (API origin, sign-in providers, haptics, links) with a web adapter and an app adapter, and one route table that the three places read. It needs an iOS build and a review.

10. **[Steering] The launch briefs are large.** `runs/launch/decisions.md` is 216 KB and 32 sessions read it. Change: an index with one line per decision; a lane brief names the decision IDs that it needs.

11. **[Tests] Eight test workers save about 200 s, but one test fails under that load. Owner decision.** `vite.config.ts` sets `maxWorkers: 4`; this Mac has 16 cores. Two full runs with 8 workers took 327 s and 312 s, against 525 s. One run failed `tools/plugin-ios-size.test.ts` ("A setup piece keeps its touch drag guard"); the other was green. Change: make that test wait for its state and not for a time, then use 8 workers outside CI. Not built: a suite that fails one run in two is worse than a slow suite.

### Low

12. **[Shell] The shell is zsh.** About 37 failures come from `echo ====` and from a glob with no quotes. Change: one line in `docs/COMPUTE.md` beside the existing zsh note.
13. **[Briefs] A helper brief and a hook disagree.** 26 refusals: a helper tries to write a report file, or calls the plan tool. Change: the brief tells a helper to give its result as text.
14. **[Lease] The wait line of `test-lock.sh` does not name the holder.** The check runner's wait line does. During this retro a 22 s test run waited more than 6 minutes for a lane that the line did not name. Change: write the PID and the folder into the lock file, and print them.
15. **[Search] `engines/` holds 56,000 lines of released bundles.** They must stay (save compatibility). Change: an ignore file for the search tools, so a search of the code skips them.
16. **[Tests] Between 17 and 75 test files read source text.** A rename breaks them with no change in behaviour. Change: when one of them fails on a rename, replace it with a test of the behaviour. No batch rewrite.

## Faults found on the way

- `tools/forms-drift.test.ts`: the piece name test could not fail for a missing piece. Repaired in item 3.
- `src/interface/play/learning.ts:59` reads a Guide note with no fallback, so a missing note throws. The new test of item 3 prevents the missing note.
- `src/render/effects/power-overlays.ts:179` casts an action ID to a kind with no check. Open.
- `src/card-symbol.ts:45`: the comment says that a released card can have no painting; all 21 cards have one. Open.
- `tools/verify-motion-concepts.mjs:45` gives the balanced readings for kings only, but it sets hands (guess: stale since decision 188). Open.
- The hand size 4 is in two dealers (`src/match/setup.ts:58`, `src/interface/play/new-game.ts:124`). Correct now; it can drift. Open.

## What this retro did not determine

- Which repeated test failures are flakes. The files that fail in the most sessions: `tools/plugin-app.test.ts` (7 sessions), `home-reveal.test.ts` (6), `saved.test.ts` (5 sessions, 12 failures). The checks: `signin-speed` fails 9 of 14 runs, `owner-playtest-round2-b` 8 of 11.
- The true time of background runs: the 600 s shell limit hides it.
- CI: 22 re-runs in the period; `verify` and the WebKit jobs fail most. Not examined.
