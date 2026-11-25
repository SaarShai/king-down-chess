# Eight checks that run by name are red on main

Status: done on branch seam-checks. `workshop` stays red: the lead decides how its docs lint leaves the script.

Class: B (check scripts only). Size: M.

Source: ticket [06](06-ci-launch-tree.md), "Red and green".

## Problem

- These checks run only by name, not in CI: `layout-title`, `stratus-registration`, `lessons`, `link-game`, `lesson-return`, `workshop`, `workshop-cast`. Each is red on the off tree and on the launch tree, with the same assertion or time-out at the same line. The logs of ticket 06 show this.
- `stratus-idle-exit` is red too. On the off tree it stops at `tools/verify-stratus-idle-exit.mjs:36`. On the launch tree it passes line 36 and stops at line 121. No run proves that the fault at line 121 is old.
- Five of them test parked features: `lessons`, `link-game`, `lesson-return`, `workshop`, `workshop-cast` ([PARKED.md](../../../PARKED.md)).
- A check that is always red tells an agent nothing, and each run of it costs minutes ([the retro](../../retro-2026-11-24/retro.md), item 1).

## Change

For each check, one of three results, with the evidence in this ticket:

- The page has a fault: write the ticket of that fault. The check stays.
- The check is stale: repair the check.
- The feature is parked: decide with PARKED.md if the check stays for the return of the feature. If it goes, it goes with a `Removed-check:` trailer that gives the reason.

## Test that fails first

Each check is red today: `npm run check:browser <name>`.

## Checks

- Each of the eight is green, or is gone with its trailer, or has a ticket for the fault of the page.
- `KINGDOWN_TEST_FILE=tools/checks.lint.test.ts npm test` and `npm run test:docs`.

## Known limits

- `recovery-consumers` did not run in ticket 06: it needs `KINGDOWN_WEB_RECOVERY_OUTPUT` from outside. It is not a part of this ticket.
- `workshop` stays, and stays red, so it does not meet the Checks line above. `src/workshop/review.docs.test.ts:17` reads the script, and this lane does not edit `src/`. One way out: a later class A change points that lint off the script; then the script and its registry entry go with a `Removed-check:` trailer. The lead decides.

## Results (first builder)

The second builder did `stratus-registration`, `stratus-idle-exit`, ticket 09 and the `next-menus` cases ("Second builder" below).

| Check | Result | Evidence |
| --- | --- | --- |
| `lessons` | Parked: removed (`063ac65ee`). Its live Guide assertions moved first (`ad92b6583`). | Red at `tools/verify-lessons.mjs:28` ("Guide opens on the shelf"). Commit 50c492f19 removed `#lesson-shelf` from `index.html`; `docs/PARKED.md:12` parks Lessons. |
| `lesson-return` | Parked: removed (`063ac65ee`). | Red at `tools/app-ui.mjs:82` (`startLesson`): no `#lesson-shelf`. It also opens a `?moves=` link, which round 3 parks. |
| `workshop-cast` | Parked: removed (`063ac65ee`). | Red at `tools/app-ui.mjs:72`: no `[data-go="extra"]` in the Menu (`index.html:185-190`). `docs/PARKED.md:11`. |
| `link-game` | Parked: removed (`063ac65ee`). | Red at `tools/verify-link-game.mjs:35`: `src/main.ts:28-34` drops `?moves=`, so no "Previously" line shows. `docs/PARKED.md:34`. |
| `workshop` | Parked: stays, and stays red. | Red at `tools/app-ui.mjs:72` (no Extra row). It cannot go in this lane: `src/workshop/review.docs.test.ts:17` reads its groups, and this lane does not edit `src/`. With the file gone, `npm run test:docs` is red (ENOENT). The lead decides if a later change moves that lint off the script. |
| `stratus-registration` | Stale: repaired (`6e1600e82`). Art fault: ticket [12](12-stratus-nw-join.md). | Red at `tools/verify-stratus-registration.mjs:21` for black NW: `black-turn-W-NW` f-1 and `black-turn-NW-N` f0 differ in one colour patch since 10dc57004. The runtime turns only from the SE rest (`src/render/painted/character-runtime.mjs:415`, `:477`), and no route from SE plays `*-turn-W-NW`. The static half now compares the joins of the routes from SE and the idles against each route start. It no longer compares the W and NW ring joins (three `Removed-check:` trailers). |
| `stratus-idle-exit` | Stale: repaired (`3b329e47d`). | Red at `tools/verify-stratus-idle-exit.mjs:121` on the launch tree. Since a54a6003a the selection asks for each file of a quiet move (`src/render/painted/scene.mjs:1380`), so the blocked turn endpoint stops the idle load (`character-runtime.mjs:212-213`, `:452-454`) and the king stays at rest. The case now waits for the hold at the selection, then moves and cancels. It no longer covers the exit from a raised idle during a held preparation; the cases at `:11-100` cover that exit with no hold. |
| `account-discovery` (ticket [09](09-account-discovery-launch.md)) | Stale: repaired (`03a0ac991`, `232ae66a7`). | Red at `tools/lib/account-discovery-check.mjs:81`: "Play on this device" opens the new page at `/` (`src/online/entry.ts:67`). The work record of ticket 09 has the steps and runs. |
| `layout-title` | Stale: repaired (`f5ca2b00d`). | Only the `pieces` widths were red, at five sizes. Commit c28aea3a7 changed the piece pictures (pawn-b 254 × 320 to 284 × 244), and the image keeps its height with `width: auto` (`src/style.css:600-601`). The new widths come from the red log; heights, hero, text and the 0.02 tolerance stay. A note on how the wide pictures draw is ticket [11](11-title-lineup-clamp.md) (needs-triage). |

The diagnosis of `lessons` said that the old board is only a rollback path. That is not correct: account solo games open the old board (`src/online/launch.ts:53-56`).

### Where the live Guide assertions of `lessons` went

- `tools/verify-menu-extra.mjs`, in the Guide step of its four sizes (320 × 568, 390 × 844, 844 × 390, 1440 × 900): Close is 44 × 44 px with a 24 px font, the first rule line is in view, and the head stays when the rules scroll. The old check ran these at 390 × 844 and 1440 × 900 only.
- `tools/verify-read-piece.mjs`, at 390 × 844: All rules keeps the full Guide head and outlines the focused card, and Menu Guide then opens at the top (`src/ui/guide.ts:88`). The old check also ran these at 1440 × 900; that size is not moved.
- The last assertion (`tools/verify-lessons.mjs:140`) is not in the list of the brief. It moved because `src/ui/guide.ts:88` is live code, not the shelf.
- Each moved assertion is green on the page of today, so none needed a repair.

### Removed helpers and docs

- `tools/app-ui.mjs`: `lessonPath`, `workshopCopyLink` and `seeAgain` lost their last user. A search of `tools/`, `docs/` and `src/` finds no other import. `startLesson`, `keepWorkshopCopy`, `openExtra`, `openTricks` stay (the samples in `docs/specs/web-redesign/samples/` import them). `waitForLinkSave` stays (`tools/app-ui.test.ts` tests it). The Workshop branch of `pressMenu` stays (`workshop` and the samples use it).
- The two tests that use `tools/verify-workshop.mjs` as an example path need no change, because `workshop` stays in the registry. With `workshop` out of the registry, three cases of `tools/git-hooks/commit-msg.test.ts` were red: its temporary repository copies the real registry. `tools/lib/removed-checks.test.ts` passes its own paths and was green.
- `docs/PARKED.md`, `docs/WORKSHOP.md`, `docs/painted-game/README.md` and the comments of `tools/verify-painted-game.mjs` follow the removal.

### A guard for checks that a CI step runs by name

- A new registry field, `ciStep`, names the CI job whose own workflow step runs the check by name. `next-menus`, `next-skylift` and `next-rule-text` have `ciStep: 'play-scenes'`. The CI plan does not read the field: `checkShards()` gives the same plan with and without it.
- `tools/workflow.lint.test.ts` holds the workflow steps and the marks in agreement, in both directions.

## Work record

- Item 1, green run: `npm run check:browser read-piece menu-extra`, 11:07:28 to 11:07:57: read-piece ok 1.9 s, menu-extra ok 9.1 s, 2 passed (folder seam-checks-DLReDI).
- Item 2, red run: with `workshop` removed, `npm run test:docs` failed (`src/workshop/review.docs.test.ts`, ENOENT on `tools/verify-workshop.mjs`), and `KINGDOWN_TEST_FILE='tools/{git-hooks/commit-msg,lib/removed-checks,lib/checks,checks.lint,check,workflow.lint,app-ui}.test.ts' npm test` had 3 failed of 156 (`commit-msg.test.ts`, story 8 and two more). So `workshop` came back.
- Item 2, green runs: `npm run test:docs` 199 passed, 1 skipped; `npm run typecheck` exit 0; the same seven test files 156 passed (24.6 s).
- Item 2, search: no file in `tools/`, `src/` or `docs/` imports a removed script or helper. The only hits are the paths in the old record `docs/painted-game/continuation-checks-2026-09-29.json`.
- Item 3, green run: `npm run check:browser layout-title`, 11:11:13 to 11:18:39 (most of it a wait for the machine lease): ok 4.2 s, 1 passed (folder seam-checks-6knpbN).
- Item 4, red first: `KINGDOWN_TEST_FILE=tools/workflow.lint.test.ts npm test`, 1 failed of 9: the workflow steps give `next-menus play-scenes`, `next-rule-text play-scenes` and `next-skylift play-scenes`, and the registry gave none.
- Item 4, with the marks: 9 passed of 9.
- Item 4, mutation: with the mark of `next-skylift` removed, 1 failed of 9 (`+ "next-skylift play-scenes"`); the mark is back.
- Last run: `npm run typecheck` exit 0; `npm run test:docs` 199 passed, 1 skipped; `KINGDOWN_TEST_FILE='tools/{checks.lint,check,workflow.lint,ci-plan,ci-shards,app-ui,git-hooks/commit-msg,lib/removed-checks,lib/checks}.test.ts' npm test` 8 files, 168 passed (25.4 s). The glob names `ci-plan.test.ts`, which does not exist.
- The diagnostic runs of item 4 used `KINGDOWN_TEST_NO_TYPECHECK=1`; the last run did the type check.

Not verified:

- No full `npm test` and no run of all browser checks.
- The moved All rules assertions do not run at 1440 × 900.
- The commit-msg hook most likely counts no removed lines for the four deleted scripts, because it reads the registry of the work tree and their entries left in the same commit. The hook took the commit; it has one trailer for each check.

### Second builder

- `account-discovery`: repaired, `03a0ac991` and `232ae66a7` (a second green run at 12:03, ok 18.5 s). Green: `npm run check:browser account-discovery`, 11:36, ok 19.0 s, 1 passed (folder seam-checks-ZfGeWM). Three red runs before it, each with its cause: ticket 09.
- `stratus-registration`: repaired, `6e1600e82`. A probe of the pixel compare (a scratch script) shows that each join of each route from SE is pixel-equal for both armies, and that of the 16 ring joins only black NW differs; W and NW are not played. Green: `npm run check:browser stratus-registration`, 11:37 to 11:38, ok 50.4 s, 1 passed, "16 game route cases" (folder seam-checks-HFYfuH). The browser half ran for the first time since 2026-10-30 and passed.
- `stratus-idle-exit`: repaired with repair (A) of the lead, `3b329e47d`. Green on the first run: `npm run check:browser stratus-idle-exit`, 11:39 to 11:43 (most of it a wait for the lease), ok 148.1 s, 1 passed, "28 actual-game idle exits and Undo cases" (folder seam-checks-oISCoT). Line 36, red on the off tree, passes in this run. The fault at line 121 is old, from a read of the code only: the chain (`scene.mjs`, `character-runtime.mjs`, `PaintedView.ts`) has no launch flag, and `tools/solo-launch.mjs` changes neither file.
- `next-menus` (a task of the lane notes): `c09dcfbda`. On the launch tree `next.html` installs the worker (`src/interface/platform.ts:46`), and it answers the board code and the Home pictures from its cache, so the held or failed routes of the case never see the request. `code_fault`, `result_reload` and `home_resize` test network faults, so their contexts block service workers. Run: `KINGDOWN_TEST_PAGES=1 MENUS_CASES=code_fault,result_reload,home_resize npm run check:browser next-menus`, 11:43 to 11:46, 67.4 s: `result_reload` passes at its two sizes (390x844, 1280x720) and `home_resize` at its one size (1280x720); at the other sizes these cases return at once. `code_fault` fails at 6 of 17 sizes (folder seam-checks-RoqjCC).
- `code_fault` is a page fault: ticket [13](13-result-reload-boot-fault.md), needs-triage. A diagnostic run (11:47 to 11:48, folder seam-checks-aCFUru, then removed from the script) shows that Home opens, and that the boot fault of `next.html` also shows at 10 of 17 sizes. The case stays red. The red count of `code_fault` goes from 9 (the lead run, worker on) to 6 and 10 (worker blocked), so it is a race. No run separates the worker and the boot fault as causes of the lead run; the block for `code_fault` comes from a read of the code. CI runs only `notice` of `next-menus`, so CI does not see it.

Results of the nine checks: `layout-title` repaired; `stratus-registration` repaired (ticket 12 for the art); `stratus-idle-exit` repaired; `account-discovery` repaired; `lessons`, `lesson-return`, `workshop-cast`, `link-game` removed; `workshop` stays red (parked, its docs lint reads the script).

Final runs (second builder, 11:49 to 11:59): `npm run typecheck` exit 0; `npm run test:docs` 199 passed, 1 skipped; `KINGDOWN_TEST_FILE='tools/{checks.lint,check,workflow.lint}.test.ts' npm test` 3 files, 62 passed (24.2 s); `npm run test:changed` 417 files passed, 19 skipped, 8,123 tests passed, 387 skipped (480.8 s), and 115 of 115 node tests passed.

Not verified (second builder):

- WebKit for any of these checks, and the hosted staging block of `account-discovery`.
- The off tree: no off-tree run of `account-discovery`, `stratus-idle-exit` or `next-menus` exists, so it is not known if the `next-menus` faults and the boot fault of ticket 13 are on the off tree too. Line 36 of `stratus-idle-exit` on the off tree has no proven cause.
- Each repaired browser check ran green one time only. The `stratus-idle-exit` repair has a timing risk: Undo must come within 1 s of the move, or the preparation falls back.
- The cause of ticket 13 comes from a read of the code; the run shows only the result.

## Review

An agent that did not build the change read head `604b416b5bbe9817907f718f90bf43ebcb2373ea` (tickets 09 and 10). It gave no blocking finding and 14 notes: two gaps in `docs/PARKED.md`, a lost `noSidewaysScroll` call and two Guide assertions that can pass when nothing scrolls, a guard that reads only the first check name, and decisions and runs for the lead.

One batch repairs them:

- `docs/PARKED.md`: the restore step names the helpers that `lesson-return`, `link-game` and `workshop-cast` need from `tools/app-ui.mjs` at `ab67fccc1` (`lessonPath`, `seeAgain`, `workshopCopyLink`). Each other name that the four old scripts import is still there. The design-game sentence says that the steps left with `link-game`.
- `tools/verify-menu-extra.mjs`: the Guide step calls `noSidewaysScroll` at its four sizes, as `tools/verify-lessons.mjs:33` did at `ab67fccc1`. Before the head assertion, the step asserts that the Guide body scrolls (`scrollTop > 0`).
- `tools/verify-read-piece.mjs`: after All rules, the check asserts that the Guide body scrolled to the card (`scrollTop > 0`). So "Menu Guide opens at the top" cannot pass with no scroll.
- `tools/workflow.lint.test.ts`: the `ciStep` guard reads each name of a `check:browser` command up to the first word that is not a check name. A probe: the workflow of today gives the same three names, and `check:browser a b --x c` gives `a` and `b`.
- Ticket 09, "Known limits": the offline console tolerance (the lead decides) and the hosted staging block (no run yet).
- Ticket 10, "Known limits": `workshop` stays red.
- No change: the `layout-title` clamp rows (ticket 11), the `stratus-registration` routes, the `next-menus` worker block, and ticket 13 (needs triage).
- Commit messages: `c09dcfbda` says that `result_reload` and `home_resize` are green "at all sizes". They run at two sizes and one size. `03a0ac991` cites `vite.config.ts:51`; `232ae66a7` corrects it. The `test:changed` run in "Final runs (second builder)" was before `232ae66a7`. A squash message must give the correct claims.
- Open for the lead: one more run of `stratus-idle-exit` to see if it is stable, and one run of the hosted block of `account-discovery`.

Runs of the batch:

- `npm run check:browser read-piece menu-extra`: read-piece ok 1.8 s, menu-extra ok 9.0 s, 2 passed (folder seam-checks-7sULV3).
- `KINGDOWN_TEST_FILE=tools/workflow.lint.test.ts npm test`: 9 passed of 9.
- `npm run typecheck`: exit 0. `npm run test:docs`: 199 passed, 1 skipped.
