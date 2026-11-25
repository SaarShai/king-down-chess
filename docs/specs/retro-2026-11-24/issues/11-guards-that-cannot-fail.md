# Guards that cannot fail, and a guard that fails with no fault

Status: done on branch change-guards (PR A); waits for the review

Source: the owner's task of 2026-11-25, track 2. [Ticket 03](03-card-tables.md) found one test in `tools/forms-drift.test.ts` that could not fail.

## Problem

A guard test that cannot fail gives false trust. A guard that fails with no fault teaches agents to ignore red.

## Method

For each guard test, a scout read what the test says that it catches. In a scratch copy it put exactly that fault in the code or the doc that the test guards (not in the test), ran the focused test, and recorded the red line, or "cannot fail" when the test stayed green. It reverted each fault before the next one.

Files: `tools/forms-drift.test.ts`, `tools/game-boundary.test.ts`, `tools/plugin-worker-boundary.test.ts`, `src/presentation-ownership.test.ts`, `tools/install-guard.test.ts`, `tools/test-lock-guard.test.ts`, `tools/lib/error-forms.test.ts`, `src/platform.test.ts`, `src/interface/platform.test.ts`, `tools/lib/test-select.test.ts`, `tools/lib/changed-files.test.ts`, and twelve docs lints of `npm run test:docs`. The guards of ticket 03 are checked in [ticket 10](10-change-rehearsals.md) (kind "a new piece, a new king power, a new card").

The lead added one guard that failed with no fault: `npm run ios:check` in each worktree but the one that made the Swift module cache.

## Results

| Test file | Guard | Injected fault | Result |
|---|---|---|---|
| `tools/forms-drift.test.ts` | the web piece names are the engine names | src/interface/play/texts.ts: piece(N, 'Knight' changed to piece(N, 'Horse'. | red: `AssertionError: texts.ts pieces: knight: expected 'horse' to be 'knight' (tools/forms-drift.test.ts:18)` |
| `tools/forms-drift.test.ts` | the Guide has notes for each released piece | src/interface/play/learning-content.ts: key "Knight" renamed to "Knight_x". | red: `AssertionError: learning-content.ts learningNotes: knight: expected undefined to be defined (tools/forms-drift.test.ts:22)` |
| `tools/forms-drift.test.ts` | the web game has one short line for each king power and each dealt card | src/interface/play/texts.ts: Strike entry removed from powerLines. | red: `AssertionError: expected [ 'Burn', 'Control', 'Curse', ...(21) ] to deeply equal [ ...(22) ] (tools/forms-drift.test.ts:26)` |
| `tools/forms-drift.test.ts` | the plugin tool text states the hand size and the switch count of the code | src/match/setup.ts: draw hand slice(0, 4) changed to slice(0, 3). | red: `AssertionError: expected [ 'Freeze', 'Mimic', 'IceWall' ] to have a length of 4 but got 3 (tools/forms-drift.test.ts:32)` |
| `tools/forms-drift.test.ts` | the plugin tool text states the hand size and the switch count of the code | src/plugin/server.ts: 'four shared cards' changed to 'three shared cards'. | red: `AssertionError: expected 'import { nextGame } from ...' to contain 'four shared cards' (tools/forms-drift.test.ts:33)` |
| `tools/game-boundary.test.ts` | keeps ambient engine and helper operations inside the owned boundary | src/cursor-text.ts: import { legalMoves as lm } from './rules/engine'. | red: `"src/cursor-text.ts: legalMoves from src/rules/engine.ts" (tools/game-boundary.test.ts:99)` |
| `tools/game-boundary.test.ts` | keeps ambient engine and helper operations inside the owned boundary | src/cursor-text.ts: void import('./rules/engine'). | red: `"src/cursor-text.ts: * from src/rules/engine.ts" (tools/game-boundary.test.ts:99)` |
| `tools/game-boundary.test.ts` | keeps owned rules independent of search, evaluation and presentation | src/game-rules.ts: import { searchLegal } from './ai/search'. | red: `AssertionError: expected [ './ai/search' ] to deeply equal [] (tools/game-boundary.test.ts:95)` |
| `tools/plugin-worker-boundary.test.ts` | keeps exact enforcement bytes for presentation and evaluator edits, but changes them for mechanics | src/match/worker.ts: imports RELEASED_CARDS from ../content/cards and stores it on globalThis. | red: `AssertionError: expected { sameBytes: false, ... } to deeply equal { sameBytes: true, ... } (tools/plugin-worker-boundary.test.ts:40)` |
| `tools/plugin-worker-boundary.test.ts` | keeps exact enforcement bytes for presentation and evaluator edits, but changes them for mechanics | src/match/worker.ts: imports ceremonyMoveLabel from ../ceremony-game. | red: `AssertionError: ceremony labels: expected { sameBytes: false, ... } to deeply equal { sameBytes: true, ... } (tools/plugin-worker-boundary.test.ts:49)` |
| `tools/plugin-worker-boundary.test.ts` | keeps exact enforcement bytes for presentation and evaluator edits, but changes them for mechanics | src/match/worker.ts: imports PAWN_V from ../ai/eval. | red: `AssertionError: src/ai/eval.ts: expected { sameBytes: false, ... } to deeply equal { sameBytes: true, ... } (tools/plugin-worker-boundary.test.ts:102); weights.ts also red` |
| `tools/plugin-worker-boundary.test.ts` | keeps exact enforcement bytes for presentation and evaluator edits, but changes them for mechanics | tools/plugin-runtime-build.mjs: buildWorker hex set to a constant 'a'.repeat(64). | red: `AssertionError: expected 'sha256:aaaa...' not to be 'sha256:aaaa...' (tools/plugin-worker-boundary.test.ts:87)` |
| `tools/plugin-worker-boundary.test.ts` | keeps exact enforcement bytes for presentation and evaluator edits, but changes them for mechanics | tools/plugin-runtime-build.mjs: buildSearchWorker returns a constant string. | red: `AssertionError: src/ai/eval.ts: expected 'stale search bundle' not to be 'stale search bundle' (tools/plugin-worker-boundary.test.ts:103)` |
| `tools/plugin-worker-boundary.test.ts` | keeps exact enforcement bytes for presentation and evaluator edits, but changes them for mechanics | src/match/worker.ts: the source-hash branch runs also in the compiled bundle (condition always true). | red: `Error: Command failed: node compiled-probe.mjs ... ENOENT: no such file or directory, open '.../game.ts' (tools/plugin-worker-boundary.test.ts:137)` |
| `src/presentation-ownership.test.ts` | keeps two design owners names in titles, reads, refusals, speech and move descriptions | src/read.ts pieceTitle: context.nameOf replaced by ambient nameOf from ./rules/engine. | red: `AssertionError: expected 'White Templar.' to be 'White Old Ward.' (src/presentation-ownership.test.ts:21)` |
| `src/presentation-ownership.test.ts` | keeps two design owners names in titles, reads, refusals, speech and move descriptions | src/read.ts pieceTitle: calls setRules(context.rules) first. | red: `AssertionError: expected { archerChecks: true, ...(98) } to deeply equal { archerChecks: true, ...(98) } (src/presentation-ownership.test.ts:27)` |
| `src/presentation-ownership.test.ts` | keeps two owners mark meanings in read states, refusals, legal reach and frost | src/render/frost.ts: context.markKind replaced by ambient markKind from ../rules/engine. | red: `AssertionError: expected [] to deeply equal [ { sq: 27, turns: 2 } ] (src/presentation-ownership.test.ts:40)` |
| `src/presentation-ownership.test.ts` | keeps two owners generated check and capture paths outside the ambient rules | src/move-text.ts checkersOf: context.genPiece replaced by ambient genPiece from ./rules/engine. | red: `AssertionError: expected [] to deeply equal [ { sq: 19, king: 12, ...(1) } ] (src/presentation-ownership.test.ts:57)` |
| `src/presentation-ownership.test.ts` | keeps each owners designed rails with its generated move marks | src/marks-model.ts railsOf: keeps the first design it gets and uses it for each later call. | red: `AssertionError: expected [] to deeply equal [ +0, 48, 6, 63 ] (src/presentation-ownership.test.ts:73)` |
| `tools/install-guard.test.ts` | node_modules is no link to packages of a different lock file | scratch package-lock.json: one space added after "lockfileVersion" (node_modules links to the owner checkout). | red: `AssertionError: node_modules links the packages of the main checkout, but package-lock.json differs from that checkout's. (tools/install-guard.test.ts:32)` |
| `tools/test-lock-guard.test.ts` | stops a run with no lock mark and no docs mark, and names npm test | tools/test-lock-guard.ts: setup returns at once. | red: `AssertionError: expected [Function setup] to throw an error (tools/test-lock-guard.test.ts:9)` |
| `tools/test-lock-guard.test.ts` | lets a run through tools/test-lock.sh or npm run test:docs start | tools/test-lock-guard.ts: \|\| changed to && (both marks needed). | red: `Error: This vitest run has no test lock and no type check: run npm test ... (globalSetup stops the whole run before the test; EXIT 1)` |

Notes of the scout (guards-a): Every guard claim in the six files went red on its injected fault. No guard is 'cannot-fail'. Six focused runs (one lease each, about 1 minute each), 09:41 to 09:50 PST. The faults are not in the test files. The scratch worktree is reverted and removed. Logs: (a scratch file, not kept), b2.log, b3.run.log, b4.run.log, b5.run.log, b6.log. Fault script: (a scratch file, not kept) Where one run held several faults, each red line names its own fault. In batch 1 the presentation faults also added game-boundary violations, and the run listed each one by file.

Weak points I found (not cannot-fail):
(1) game-boundary files() scans only .ts files. src/ also holds .js and .mjs product files (src/interface/ui/kit.js, src/render/painted/*.mjs). Today none of them imports rules/engine or ai/search, but if one did, the guard would not see it. Repair: also scan .js and .mjs, and give parseSync the file name so it uses the right language. The test file is not protected.
(2) The same guard skips specifiers that do not start with '.'. This is safe today because no tsconfig paths or vite aliases point into src.
(3) The 'four shared cards' / 'five feature switches' test uses the literals 4 and 5 in the test. If the code and the text change together, the test fails even though they agree. That is a false red, not a hole.
(4) install-guard checks only when node_modules is a link. In CI node_modules is a real folder, so the test passes there by design.
(5) One case could not show the fault: with my first railsOf fault (design ignored, null passed), the rails test stayed green. The result was the same because rails follow the owner's marked squares, so the design is not used for d4 in that position. A stale-owner design fault (P6) went red. If the claim is 'a design-less rail', the test does not catch it. That fault is only a weak form of the claim, so I record the guard as red.

| Test file | Guard | Injected fault | Result |
|---|---|---|---|
| `tools/lib/error-forms.test.ts` | reads source error literals and replaces template holes without reading tests | tools/lib/error-forms.mjs: removed the !/\.(?:test\|d)\.(?:ts\|mjs)$/ file filter | red: `AssertionError: expected [ [ 'bad FEN ', '' ], …(5) ] to deeply equal [ [ 'bad FEN ', '' ], …(4) ]` |
| `src/platform.test.ts` | sends iOS app calls in stage "staging" to https://kingdown-staging.vercel.app | src/platform.ts: staging origin changed to https://kingdown.dev | red: `AssertionError: expected { inApp: true, …(1) } to deeply equal { inApp: true, …(1) }` |
| `src/interface/platform.test.ts` | accepts the public new page and rejects unknown paths, without treating online links as solo | src/interface/platform.ts: added '/play' to the home path list | red: `AssertionError: expected 'home' to be 'missing' // Object.is equality` |
| `src/interface/platform.test.ts` | marks a fresh player as seen when home opens, so the notice never shows to that player | src/interface/platform.ts: replaced localStorage.setItem(NOTICE_KEY, '1') with a no-op | red: `AssertionError: expected "vi.fn()" to be called once with arguments: [ 'kingdown.solo-launch-seen', '1' ]` |
| `tools/lib/changed-files.test.ts` | lists additions, edits, deletions and both sides of a rename between two commits | tools/lib/changed-files.mjs: '--no-renames' replaced with '-M' | red: `AssertionError: expected [ 'edit.txt', 'gone.txt', …(2) ] to deeply equal [ Array(5) ]` |
| `tools/lib/test-select.test.ts` | gives the full suite for a wide file, an unplaced file, a deleted file or no change (rule b) | tools/lib/test-select.mjs line 188: the outside-src/tools rule replaced with if (false) | red: `AssertionError: expected { mode: 'full', …(1) } to match object { mode: 'full', …(1) }` |
| `tools/lib/test-select.test.ts` | follows imports, CSS imports and import.meta.glob, and selects a changed test (rule c) | tools/lib/test-select.mjs: removed the \|@import\s+(?:url\()?... branch of importForm | **cannot-fail**: Not a guard gap: the first branch \b(?:from\|import\|require)\s*\(?\s*['"]... also matches @import './x.css' because @ is a word boundary. Only url(...) and unquoted @import forms need the second branch. Add a fixture line with @import url(./base.css) (no quotes) so the second branch has a case that only it matches, or delete the second branch as dead code. |
| `tools/lib/model-names.test.ts (and tools/model-names.docs.test.ts, tools/git-hooks/commit-msg.test.ts)` | finds "<name>" as a whole word ... / no Markdown file outside the exempt files holds a model name | tools/lib/model-names.mjs: removed '<name>' from MODEL_NAMES; also added 'a review by <name>' to docs/RULES.md | **cannot-fail**: The tests start from MODEL_NAMES, the table that they check (MODEL_NAMES[0], for-each over MODEL_NAMES). Only the three split role aliases (<name>, <name>, <name>) are pinned. Add a pinned list of split words in tools/lib/model-names.test.ts, for example ['op'+'us','son'+'net','hai'+'ku','fab'+'le','myth'+'os','gp'+'t','gem'+'ini','deep'+'seek','ki'+'mi', ...], and expect(MODEL_NAMES).toEqual(expect.arrayContaining(pinned)). A removed name then makes the test red. |
| `tools/model-names.docs.test.ts` | no Markdown file outside the exempt files holds a model name | docs/RULES.md: appended 'a review by <name>' | red: `AssertionError: expected [ 'docs/RULES.md:350: "<name>"' ] to deeply equal []` |
| `tools/docs-index.docs.test.ts` | docs/INDEX.md has a line for each top-level entry of docs/, and each of its links names a file | new untracked docs/ZZ-NEW-FAULT.md; second round: INDEX link MATRIX.md -> MATRIXX.md | red: `AssertionError: expected [ Array(1) ] to deeply equal [] (round 2: expected [ …(2) ] to deeply equal [])` |
| `tools/public-tree.docs.test.ts` | finds no bare path in a tracked file outside the kept records | docs/RULES.md: appended docs/claude-recovery/x/README.md | red: `AssertionError: expected [ Array(1) ] to deeply equal []` |
| `tools/steering.docs.test.ts` | line citations: no tracked file outside the tasks archive, the specs folder and the revision 3 file cites a tracker by line | docs/RULES.md: appended TASKS.md:12 | red: `AssertionError: expected [ Array(1) ] to deeply equal []` |
| `tools/steering.docs.test.ts` | relative links: no live file holds a broken relative link | TASKS.md: (docs/specs/ios-app/map.md) -> no-map.md | red: `AssertionError: expected [ Array(1) ] to deeply equal []` |
| `tools/steering.docs.test.ts` | lesson headings: each topic file holds its lessons under one dated heading ... (and LESSONS.md index) | docs/lessons/agents-and-tools.md: second heading made equal to the first | red: `AssertionError: expected [ Array(1) ] to deeply equal []; LESSONS.md index: expected [ …(2) ] to deeply equal []` |
| `tools/steering.docs.test.ts` | TASKS.md is small, holds Open items first, then the links, with no model name | TASKS.md: added 'ask <name>' to an open item | red: `AssertionError: expected [ Array(1) ] to deeply equal []` |
| `tools/steering.docs.test.ts` | AGENTS.md holds the twelve sections, each short, with its fixed phrases, no model name and no date | AGENTS.md: added 'Ask <name> first.' under the first section | red: `AssertionError: expected [ Array(1) ] to deeply equal []` |
| `tools/steering.docs.test.ts` | MATRIX.md holds the D.1 row, the D.2 row and the Workshop heading one time each | docs/MATRIX.md: duplicated the 'Material behind (own side)' row | red: `"docs/MATRIX.md § D.1 Conditions (triggers) (count 2, lines 215, 216): the D.1 row \"Material behind (own side)\" must occur one time"` |
| `tools/steering.docs.test.ts` | no run id occurs two times in a live run table of QUEUE.md | docs/QUEUE.md: duplicated the rage-q row under 'Running and queued, 2026-10-06' | red: `"docs/QUEUE.md § Running and queued, 2026-10-06 (count 2, lines 297, 298): run id \"rage-q\" occurs 2 times in one table"` |
| `tools/steering.docs.test.ts` | no handoff holds a model name or a trailer line, and each archived handoff opens with the archive line | new docs/HANDOFF-zz.md with a Co-Authored-By line | red: `"docs/HANDOFF-zz.md § Handoff (line 3): a handoff must not hold a `Co-Authored-By:` line"` |
| `tools/parked.docs.test.ts` | docs/PARKED.md links to its ticket | docs/PARKED.md: (specs/park-lean/spec.md) -> (specs/park-lean/other.md) | red: `AssertionError: expected '# Parked features\n\nThe web build is…' to contain '(specs/park-lean/spec.md)'` |
| `tools/cron-mvp.docs.test.ts` | the private release schedules only tick, daily and history, and removes old alert jobs | docs/specs/chatgpt-mvp/release/cron-mvp.sql: appended cron.schedule('kingdown-outbox', ...) | red: `AssertionError: expected [ 'kingdown-cron-history', …(3) ] to deeply equal [ 'kingdown-cron-history', …(2) ] (the second test also red: expected [ …(4) ] to deeply equal [ …(3) ])` |

Notes of the scout (guards-b): Start 09:41 PST, end 09:49 PST. I made the scratch worktree at origin/main 80b855489. I reverted all faults and removed the worktree. I made no commit and no push.

Result: 20 of 22 faults go red. 2 stay green.

1. Real cannot-fail: model-name lists. tools/lib/model-names.test.ts, tools/model-names.docs.test.ts and tools/git-hooks/commit-msg.test.ts all start from MODEL_NAMES (MODEL_NAMES[0] and for-each loops). When you remove one name ('<name>') from tools/lib/model-names.mjs, all tests stay green. A doc that holds '<name>' then also passes the docs lint. Only <name>, <name> and <name> are pinned. Repair: put a pinned list of split words in tools/lib/model-names.test.ts and check expect(MODEL_NAMES).toEqual(expect.arrayContaining(pinned)). None of these files is protected.

2. Fault with no effect, not a guard gap: tools/lib/test-select.mjs. When you remove the @import branch of importForm, the tests stay green, because the first branch also matches @import './x.css'. Add a fixture with an unquoted @import url(./base.css), or delete the second branch as dead code.

3. Scope note: public-tree and the line-citation lint read tracked files only (git grep). An untracked file with a transcript path or a TASKS.md:N citation stays green until someone commits it. This is by design.

Docs lints that I checked (12): model-names, docs-index (missing entry and broken link), public-tree, parked, cron-mvp, and these parts of steering: relative links, lesson headings, LESSONS index, TASKS index, AGENTS rules, MATRIX guard, QUEUE run tables, handoffs and line citations. No docs test checks the Status line of each ticket. Only parked.docs.test.ts checks one Status line.

Log problem: the first unit log (scratchpad/run1.log) had the same name as a log of another scout (scout-piece-power-card), and that scout wrote over it. I ran the tests again with unique logs: (a scratch file, not kept) and (a scratch file, not kept) The docs logs docs1.log to docs4.log in the scratch folder have short names, so other scouts can write over them too. I read them right after each run. All lease runs were focused (KINGDOWN_TEST_FILE), 3 in total (one was lost to the log problem).


## ios-store (a guard that fails with no fault)

- Source: the lead, 2026-11-25. `npm run ios:check` failed in each worktree except the worktree that made the cache.
- Cause: `ios:check` sets `KINGDOWN_TEST_OUT=node_modules/.cache/store-checks`. `node_modules` of a worktree is a link to the main checkout, so all worktrees share one folder. `swiftc -module-cache-path` got a different path text in each worktree, and swiftc refuses a precompiled module that has other path text.
- Red, in the worktree `change-guards` at `d781512ed`, with a cache that the worktree `infra-ci` made: `error: precompiled file '…/worktrees/change-guards/node_modules/.cache/store-checks/ModuleCache/18CET8Y8NFAU8/SwiftShims-2IMTS4WWRU7VJ.pcm' was compiled with module cache path '…/worktrees/infra-ci/node_modules/.cache/store-checks/ModuleCache/18CET8Y8NFAU8'` and `error: missing required module 'SwiftShims'`. 1 failed, 4 passed.
- Repair (`ios/store.test.ts` only, commit `8b3252662`): swiftc gets the real path of the folder, so each worktree gives the same text. The cache folder has a new name, `swift-modules`, because `ModuleCache` holds modules with the path text of one worktree.
- Green: `change-guards`, 5 passed, 3.39 s (the first run makes the cache). A second worktree (a scratch worktree at `8b3252662`, with the linked `node_modules`), 5 passed, 1.22 s: it reuses the modules that `change-guards` made.
- Known limit: the old folder `ModuleCache` stays in `node_modules/.cache/store-checks`. It is not used.

## guards-a

Kind: guard checks of six existing test files (fault injection by the scout), and repairs of the weak points that the scout found. Branch guard-guards-a, worktree worktree guard-guards-a, base origin/main 0ab6284a4. Not pushed. No PR.

### Places and their guards today
- Web piece names, Guide notes, power lines, plugin hand size and switch count: tools/forms-drift.test.ts. Red on each injected fault.
- Ambient engine imports in product files, and the imports of src/game-rules.ts: tools/game-boundary.test.ts. Red on each injected fault. Weak points: the scan read only .ts files; it did not see '/src/...' root paths or './x.js' specifiers; it did not see an alias. The first three are now repaired (see below); an alias now stops the test.
- Bytes of the enforcement worker and the search worker: tools/plugin-worker-boundary.test.ts. Red on each injected fault.
- Owner names, mark meanings, check paths and rails in presentation: src/presentation-ownership.test.ts. Red on each injected fault, but not on a railsOf that drops the design (the piece stands on d4, a capital square). Now repaired by a new test (see below).
- node_modules link against a different lock file: tools/install-guard.test.ts. Red on the injected fault. In CI node_modules is a real folder, so the test passes there. This is the design; no ticket.
- A bare vitest run: tools/test-lock-guard.test.ts. Red on each injected fault.

### New guards
1. Boundary scan reads .js, .mjs, .ts and .mts product files, and './x.js' specifiers name the .ts module.
   - File: tools/game-boundary.test.ts. Kind: behaviour test on the real file list (plus two unit cases and a check that files() lists src/interface/ui/kit.js and src/render/painted/scene.mjs).
   - Fake: src/render/painted/zz-fake.mjs imports legalMoves from '../../rules/engine.ts'; src/zz-fake.ts imports legalMoves from './rules/engine.js'. The old test (a copy in the same run) stayed green.
   - Red: "src/render/painted/zz-fake.mjs: legalMoves from src/rules/engine.ts", "src/zz-fake.ts: legalMoves from src/rules/engine.ts" (AssertionError: expected [ …(2) ] to deeply equal [], tools/game-boundary.test.ts:105).
   - Green: Tests 4 passed (4), Duration 456ms.
   - Commit: 2e1f24681.
2. Boundary scan resolves '/src/...' root paths, and a test stops on a tsconfig path map or a Vite alias.
   - File: tools/game-boundary.test.ts. Kind: behaviour test (root path), and a config check (tsconfig.json as JSON; vite.config.ts as text).
   - Fake: src/render/painted/zz-fake.mjs imports legalMoves from '/src/rules/engine.ts'; tsconfig.json gets "baseUrl": "."; vite.config.ts gets the comment line // alias: { "@": "/src" }.
   - Red: "AssertionError: tsconfig.json maps bare names into src: teach check() in tools/game-boundary.test.ts to resolve them first: expected [ undefined, '.', undefined ] to deeply equal [ undefined, undefined, undefined ]"; "AssertionError: vite.config.ts has a resolve alias: teach check() in tools/game-boundary.test.ts to resolve it first: expected '// alias: { "@": "/src" }' to be undefined"; "src/render/painted/zz-fake.mjs: legalMoves from src/rules/engine.ts".
   - Green: Tests 5 passed (5), Duration 462ms.
   - Commit: 9cfb6e654.
3. Rails of a designed piece off the capital come from its owner design.
   - File: src/marks-model-owner.test.ts (new). Kind: behaviour test over the rook and bishop presets on c3.
   - Fake: src/marks-model.ts railsOf calls linesOf(null, ...) in place of linesOf(design, ...). src/presentation-ownership.test.ts stayed green (4 passed) in the same run.
   - Red: "AssertionError: rook design on c3: railsOf in src/marks-model.ts must take the lines from the design it gets: expected [] to deeply equal [ 16, 2, 23, 58 ]" (src/marks-model-owner.test.ts:17).
   - Green: Tests 1 passed (1), Duration 196ms.
   - Commit: 5daf88f18.

Each fake is reverted; git status is clean. npm run typecheck passes after each guard.

### Holes that stay
- forms-drift fixed numbers 4 and 5 (a false red, not a hole): ticket draft [44](44-guards-a-forms-drift-number-words.md).
- The Vite alias check of guard 2 reads source text: a comment with 'alias:' gives a false red, and a resolve plugin or an alias in a different form is not seen. The scan still skips bare package names. Ticket draft [45](45-guards-a-boundary-scan-limits.md) (one draft for this group).

### Not a hole
- install-guard does not run its check in CI, because node_modules there is a real folder. This is the design.

### Notes
- The task named origin/main 80b855489. The worktree starts at origin/main 0ab6284a4, because origin/main moved before the worktree was made.
- Guards 1 and 2 change the existing tools/game-boundary.test.ts (a repair in place). gh pr list showed no open PR that changes it. A local lane that is not pushed can still change it.
- Guard 2 reads vite.config.ts, which the seam-guards lane changes this week. If that lane writes 'alias:' in a comment or in code, the test goes red at merge. The red proof of the alias check used a comment line.
- Guard 2 has two parts: the root-path repair (a behaviour repair) and the tsconfig and alias tripwire (kind 3, source text). The lead can drop the tripwire and keep the rest.

## guards-b

Kind: guard repair. Two guards could not fail (the scout report for guards-b). This lane makes each guard fail on the injected fault. No product file changes. No protected file changes.

Branch: guard-guards-b, from origin/main d781512ed (merge of PR 473). The scout used 80b855489. This lane did not run the 20 red faults of the scout again. Worktree: worktree guard-guards-b. Not pushed. No PR.

### Places and their guards today

| Place | Guard today | Result of the fault |
|---|---|---|
| tools/lib/error-forms.mjs (file filter) | tools/lib/error-forms.test.ts | red |
| src/platform.ts (staging origin) | src/platform.test.ts | red |
| src/interface/platform.ts (home paths, NOTICE_KEY) | src/interface/platform.test.ts | red (2 faults) |
| tools/lib/changed-files.mjs (renames) | tools/lib/changed-files.test.ts | red |
| tools/lib/test-select.mjs (rule b) | tools/lib/test-select.test.ts | red |
| tools/lib/test-select.mjs (CSS @import url) | none before this lane | green (hole) |
| tools/lib/model-names.mjs (MODEL_NAMES) | none before this lane: the tests take their cases from the list | green (hole) |
| Docs lints (model-names, docs-index, public-tree, steering parts, parked, cron-mvp) | their docs tests | red (12 faults) |
| Ticket Status lines | only tools/parked.docs.test.ts:15 (one file) | no guard |

### New guards

1. tools/model-names-pinned.test.ts
   - Kind: behaviour test with a pinned list (split words) outside MODEL_NAMES.
   - Fault: remove one name from MODEL_NAMES in tools/lib/model-names.mjs.
   - Red line: `AssertionError: tools/lib/model-names.mjs: put these names back in MODEL_NAMES (or remove a name from PINNED in tools/model-names-pinned.test.ts only by decision): <name>: expected [ '<name>' ] to deeply equal []`
   - The red line holds a placeholder <name> in place of the real word, so that this record passes the model-name lint. The exact line is line 16 of (a scratch file, not kept)
   - The old tests (tools/lib/model-names.test.ts) stay green with the same fault. This shows the hole.
   - Green line (head 327219fb2, with the old tests of both modules): `Test Files  4 passed (4)` / `Tests  47 passed (47)`.
   - Time: 6 ms for the test (from the red log); 201 ms for the head run of 4 files.
   - Commit: 77b6a2461.

2. tools/test-select-css-url.test.ts
   - Kind: behaviour test with a small fixture tree (`@import url(./base.css);` and `@import url( "./theme.css" ) screen;`).
   - Fault: remove the `@import\s+(?:url\()?...` branch of importForm in tools/lib/test-select.mjs.
   - Red line: `AssertionError: tools/lib/test-select.mjs importForm: the @import url(...) branch must find the CSS file, so its test is selected: expected { mode: 'full', …(1) } to match object { mode: 'selected', …(1) }`
   - The old test (tools/lib/test-select.test.ts) stays green with the same fault.
   - Green line (head 327219fb2, with the old tests of both modules): `Test Files  4 passed (4)` / `Tests  47 passed (47)`.
   - Time: 10 ms for the test (from the red log); 201 ms for the head run of 4 files.
   - Limit: the red run stops at the first expect (the form without quotes). The quoted url( "..." ) case is not proved red alone.
   - Commit: 327219fb2.

Checks on the guard branch: `npm run typecheck` EXIT 0; `npm run test:docs` EXIT 0; tools/ci-shards.test.ts 11 passed (CI shards find tests by glob, so no list must name the new files).

Logs:
- (a scratch file, not kept)
- (a scratch file, not kept)
- (a scratch file, not kept)
- (a scratch file, not kept)
- (a scratch file, not kept)
- (a scratch file, not kept)

### Holes that stay

- Ticket Status lines: no docs lint checks them. It needs a decision on the status words and on old tickets. Ticket draft: [46](46-guards-b-ticket-status-lint.md).
- Scope note, by design (no ticket): the public-tree lint and the line-citation lint read tracked files only (git grep). An untracked file stays green until someone commits it.


## Review

Not started.

## Work record

See the sections above.
