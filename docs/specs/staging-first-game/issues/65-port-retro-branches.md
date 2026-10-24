# Port the finished retro branches of the old repository

Status: resolved on branch `staging/lane-retro` (from `staging/integrate` `c4f3d3c3`); not merged, not deployed.

## What

Port the remaining finished work of four old branches into this build: `claude/retro-rules`, `claude/retro-records`, `claude/retro-dead-code` and `claude/submission-final` (read from `refs/old-local/claude/*`). The owner approved the retro answers on 2026-10-20: Q1 close the email grant, Q4 move dead records out, Q5 delete unread code with its tests, Q6 one rule store in AGENTS.md.

## Why

This build has 417 commits after the old main `71f2d4c8`. Some retro work is already here in another form, and some old facts are no longer true here. Each old commit needs a check by content, not by patch id.

## Scope

- Compare each old commit by content with `git diff`, `git ls-tree` and `git grep`. Classify it: already present, ported or skipped.
- Port in this order: retro-rules, retro-records, retro-dead-code, submission-final.
- No change under `src/rules/`, in `src/match/worker.ts` or in `engines/`. No SQL on a hosted database. No push, no deploy.
- Tracker files (`TASKS.md`, `LESSONS.md`, `docs/lessons/`, `docs/QUEUE.md`) change only on main.

## Acceptance

- Each old commit has a row below with its class and the reason.
- Before a removal, `git grep` over `src/ tools/ docs/ index.html public/ plugin-deploy/ package.json` finds no live use.
- `plugin-dist/worker.mjs` keeps sha256 `677b4eeaa35113f0cf2b677f1e3650ae512de72485f0ce2c6617383c3af83f0b`. The 11 engine archives do not change.
- The type check, the doc tests, each touched test file, the database tests, QA and the browser checks of the changed code pass.

## Result

### Classification

| Old commit | Subject | Class | New commit | Reason |
|---|---|---|---|---|
| `21c6728b` | State current rules and require the engine check for publish | ported in part | `ba6f5e6d` | Ported: AGENTS.md (merged, see below), HOSTING.md, issue-tracker.md, the supabase outbox sentence, the alias names in the model-name matcher, the steering pins, the two painted-board READMEs. Skipped: RULES.md, MATRIX.md, `src/balance/design.ts` pins and the submission checklist (see "Skipped facts"); `src/rules/rules.ts` (engine rule); TASKS.md and the lesson file (tracker files, main only); `tools/deploy.sh` and its test (the old branch restored them to its base later; this build already stops `--publish` without `KINGDOWN_ENGINES_DATABASE_URL`, `tools/deploy.sh:62`). |
| `df0efb28` | Complete the current-state source records | ported in part | `ba6f5e6d` | COMPUTE.md, steering pins and the record. `src/rules/rules.ts` skipped (engine rule). |
| `adf25bac` | Record verification results and the M1 disk block | ported in part | `ba6f5e6d` | The record only. The balance pins skipped with MATRIX.md and RULES.md. |
| `712a7d5b` | Fix the rule record and review faults | ported in part | `ba6f5e6d` | Hook trailers, AGENTS.md, COMPUTE.md, matcher tests, steering pins. MATRIX.md, balance pins and the lesson clause skipped as above. |
| `5f6ba03b` | Keep the review guard on each merge path | ported | `ba6f5e6d` | |
| `a4892c8f` | Fix the steering check faults | ported | `ba6f5e6d` | |
| `711bbe88` | Record the rule fix proof | ported | `ba6f5e6d` | Record. |
| `8adaf5d6` | Move the tracker-file edits to main | skipped | — | It removes the tracker edits from the branch; the net branch change is zero. The edits are listed below for main. |
| `8ee5e1a4` | Record: the tracker-file edits land on main | ported | `ba6f5e6d` | Record. |
| `e770e07d`, `c29d2ba3` | Merges of old main into retro-rules | skipped | — | Merge commits of the old main; not retro work. |
| `4fa9a68c` | Move tournament fixtures and remove old simulation records | ported | `4d2eda9f` | `sim/out` here is the same tree as the old base (1,667 files). The 14 fixtures move to `src/sim/fixtures/tournaments/`. |
| `9b55fab3` | Remove parked clay records and six unused packages | ported in part | `bcb05dac` | `parked/` and `docs/graphics-prototype/` are the same trees as the old base. The package removal is skipped (see "Packages"). |
| `992a50e4` | Remove both rejected Archer studies | ported | `4314771f` | |
| `af36f699` | Remove the old release copy and unused baseline tool | ported | `359449a9` | |
| `e7b636c1` | Fix archive links and record the removal checks | ported | `8f03952e` | `docs/2d-first-pieces/README.md` resolved by hand: the retro-rules text stays, and the Archer line points to the restore commands. |
| `9eb05221` | Fix dashboard startup and removed-record pointers | ported | `5367f670` | |
| `86c1e123` | Accept local document links in the fact-file check | ported | `b5df837f` | |
| `4664850c` | Record the review fixes and passing checks | ported | `75399845` | Record. It says the six packages are gone; in this build they stay. |
| `07a060be` | Merge of old main into retro-records | skipped | — | Merge commit. |
| `daa43386` | Remove dormant email jobs and sender | already present | `1c25cab6` | `src/online/mail.ts` is absent; jobs, HTTP routes, server start and tests match. `tools/vercel-check.mjs:196-201` expects 404 for `/internal/outbox`. |
| `064aeee1` | Remove runtime access to player email | already present | `1c25cab6` | `supabase/migrations/0015_remove_email.sql` is identical. Runtime role, start check, release SQL, HOSTING, RUNBOOK and the supabase README have the same facts. |
| `d1b5de90` | Remove unused Workshop verdict outputs | ported | `e41a451c` | No caller of `idle`, `why`, `fixes`, `deltas` or `judge(d, full)` remains. |
| `9ab46380` | Remove the unused website poll | already present | `39c10e22` | `merge` and `watch` are absent from `src/online/client.ts`. |
| `db0d9d62` | Fail QA on every failed case | ported | `30f19569` | The QA files are the same as the old base. Only dated specs name the known-red list. |
| `139e80d2` | Use the search exports directly in the simulator | ported in part | `b9dc874a` | `positionKey` and the removal of `applyDrawRules` are already here. Ported: direct `resetSearchState`/`search` imports and the runner search test. |
| `a66ede3b` | Record the engine archive removal plan and checks | ported | this ticket's commit | Record only (`03-retro-dead-code.md`). No engine archive changes. |
| `d5847169` | Keep startup available across email removal | already present | `1c25cab6` and later | The start check has no email probe; the migration test checks start before and after 0015; RUNBOOK and `deadline.ts` match. |
| `20f7ef97`, `1b8b96e4` | Record review checks | ported | this ticket's commit | Record only. |
| `17518e0d` | Merge of old main into retro-dead-code | skipped | — | Merge commit. |
| `dfa1e32b` | Three 706 x 800 submission screenshots | ported | `50b09fbb` | `plugin.json` here is the same as the old base. |

Totals: 28 non-merge commits and 4 merges. Ported in full: 17. Ported in part: 6. Already present: 4 (`daa43386`, `064aeee1`, `9ab46380`, `d5847169`). Skipped: 1 (`8adaf5d6`) and the 4 merges. The 3 dead-code records (`a66ede3b`, `20f7ef97`, `1b8b96e4`) land as one record file.

### AGENTS.md merge

- Kept this build's "Tests and checks" section (`KINGDOWN_TEST_FILE`, `KINGDOWN_TEST_NAME`, the short lines).
- Took the retro trailer rule, the merge rule with an independent review, the standing run order for the M1 and Kaggle, the owner-word rule for deploys and store submission, the role file pointer and the cloud lines.
- Did not take "Run the unit suite on the M1" and "This Mac runs no unit suite". The staging lanes and the lead run `npm test` on this Mac. The line now reads: "This Mac runs unit tests, browser checks and a smoke run of at most 20 games with 2 workers; no long run." The steering pin `20 games` stays.
- Did not take the steering test for the lesson clause ("Keep no more than about 6 agents"). That clause is a tracker edit for main.

### Skipped facts

- RULES.md, MATRIX.md: the retro text says "The account web page is not open yet" and "Account play in ChatGPT". In this build the web account game is open (`src/account-game/`, `docs/specs/staging-first-game/plan.md`). The 21-card pool is still true (`src/content/cards.ts`), but the paragraphs mix both facts. A writer who owns these files must restate them for this build. The balance pins in `src/balance/design.ts` follow those files, so they stay too.
- `docs/submission/checklist.md`: the retro rows state the production deploy `3d4c97ae` as the current state. This build is an independent project with no production release path (`tools/deploy.sh:32`). The rows stay as they are.
- `supabase/README.md`: kept this build's migration text (0001–0018, no production claim). Took only the outbox sentence. It is true: `cleanup` deletes rows made or done 30 days ago (`src/online/jobs.ts:56`). The old "Historical release order (2026-10-19, complete)" heading is not taken, because it claims a production state.

### Packages

`three`, `@types/three`, `@gltf-transform/core`, `@gltf-transform/extensions`, `@gltf-transform/functions` and `meshoptimizer` have no use in this build outside `parked/` and `docs/graphics-prototype/` (both removed). `git grep` finds only dated research text.

The removal is skipped. The tool gate refuses `npm install` in this worktree, because `node_modules` links the shared installation. A lockfile edit without npm makes `tools/install-guard.test.ts` fail in a linked worktree ("package-lock.json differs from that checkout's"). To finish it: in a worktree with its own installation (`wt add <path>`), run `npm uninstall three @types/three @gltf-transform/core @gltf-transform/extensions @gltf-transform/functions meshoptimizer`. The old commit removed 23 lock entries, and no other package here depends on them.

### Tracker edits for main

Commit `8adaf5d6` moved these edits to main. They do not land here:

- TASKS.md: the "ChatGPT app and submission" line, and "runs follow AGENTS.md" in the Guard drop and Powers-mode lines.
- `docs/lessons/agents-and-tools.md`: `wt add` in the "build main beside a branch" lesson; the resume rule with "Keep no more than about 6 agents at once near the limit window; start research after builds"; the delegation history line.

### Checks

Head of the checks: see each line.

All code checks ran at `50b09fbb` (the last code commit). This ticket commit adds only records.

- `npm run typecheck`: pass (`tsc --noEmit`, no output).
- `npm run test:docs`: `Test Files  13 passed (13)`, `Tests  166 passed (166)` (with this ticket).
- `npm run lint`: not run; `package.json` has no lint script.
- `KINGDOWN_TEST_FILE='{src/sim/tournament,src/sim/sim,src/workshop/face,src/workshop/judge,src/workshop/ui,tools/dashboard,tools/dev-settings,tools/wt,tools/install-guard,tools/gate,tools/lib/first-fault,tools/lib/layout-message,tools/qa,tools/lib/model-names,tools/git-hooks/commit-msg,tools/git-hooks/prepare-commit-msg}.test.ts' npm test`: `Test Files  16 passed (16)`, `Tests  234 passed (234)`. `tools/wt.test.ts` needs `tools/install-guard.test.ts` in the same focus: its guard cases start a child run that reads `KINGDOWN_TEST_FILE`.
- Database, lane database `kingdown_lane_retro_test`: `KINGDOWN_TEST_FILE='{tools/plugin-db/migrations,src/online/jobs,src/api/http}.db.test.ts' npm test`: `Test Files  3 passed (3)`, `Tests  25 passed (25)`. These prove the "already present" email rows.
- `npm run plugin:build:runtime`: pass. `plugin-dist/worker.mjs` sha256 `677b4eeaa35113f0cf2b677f1e3650ae512de72485f0ce2c6617383c3af83f0b` (same). `git diff --stat c4f3d3c3 HEAD -- engines/ src/rules/ src/match/worker.ts`: empty.
- `npm run check:browser workshop`: `ok   workshop          118.6 s`.
- `npm run check:browser workshop-cast`: `ok   workshop-cast       8.9 s`.
- `npm run check:browser qa` (QA now fails on each failed case): `ok   qa                157.9 s`.
- `npm run check:browser plugin-ui`: `FAIL plugin-ui          14.1 s  locator.click: Timeout 10000ms exceeded.` A second run alone fails the same way (13.8 s). The base `c4f3d3c3`, in a temporary worktree, fails the same way (14.4 s), at the same step: `tools/lib/plugin-android-check.mjs:61`, the Earth Quake sheet shows "Not current" and no `Use` button. This port does not change plugin code, so the fault is older than this ticket. It needs its own ticket.
- Full `npm test`: not run here; the lead runs it after the merge.
