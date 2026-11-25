# Platform seam: what the four forms share, and what keeps them equal

Status: needs-triage. The owner has not approved this spec. No ticket starts before that.

Source: [the retro of 2026-11-24](../retro-2026-11-24/retro.md), item 9

## Problem

The game has four forms ([FORMS.md](../../FORMS.md)): the web app, the iOS app, the ChatGPT plugin and the Muse connector. The retro said that the forms have no platform seam, and it proposed one platform object with a web adapter and an app adapter, and one route table.

Five readers read how each form is built and started. Five checkers tried to refute them. Three designers then wrote designs from different rules: guards only, the seam of the retro, and removal first. All three came to the same result: the code does not need the platform object. The cost is in other places.

## What the code shows

The retro counts were wrong, and three of its premises do not hold.

| The retro said | The code shows |
| --- | --- |
| No platform seam. | `src/platform.ts` is the seam between the website and the app: two values, `inApp` and `apiOrigin`. A second seam exists for accounts and games: `AccountGameHost` (`src/account-game/host.ts`) with a ChatGPT adapter (`src/plugin/bootstrap.ts`) and a browser adapter (`src/online/runtime.ts`). |
| 9 `inApp` branches in 5 files. | 12 uses in 6 files, tests and imports apart. Each use decides a different behaviour: 5 for sign-in, 3 in the game screen, 1 for the film format, 1 for the invite link, 2 on the old page. |
| The plugin and the Muse connector are two more environments. | They are one server bundle and one function. The board screen gets its environment through a host object, not through `inApp`. Of the build values, it reads only the stage (`VITE_KINGDOWN_STAGE`). |
| 11 build flags. | 12 define names (9 `__KINGDOWN_*__` names and 3 `import.meta.env` values), and about 21 build inputs in all (an estimate). The one that costs is `KINGDOWN_SOLO_LAUNCH`. |
| The route list exists three times. | The page route pattern has four copies, and at least three more lists have other shapes. Only one pair has a comparing test. |
| A fifth environment comes. | No plan names one. Android is out of scope ([the iOS app map](../ios-app/map.md)). |

The cost that the readers found, with the evidence:

1. **A fault in the app, most likely live.** The sign-in sheet sets relative Privacy and Terms links with `target="_blank"` (`src/interface/people/screens/sign-in.ts:72`). [IOS.md](../../IOS.md) says that such a link opens nothing in the app. Commit ead375fa8 repaired the same fault on the old page; it came back in 5db7875b7, which is in build 1.0 (8) and in version 1.1 (build 9), the build in TestFlight. Not verified on a device.
2. **Every shipped form builds with the launch switch on, and most of CI tests the build with the switch off.** `tools/release/profile.sh` and `tools/ios-sync.sh` export `KINGDOWN_SOLO_LAUNCH=1`. The build step of CI (`.github/workflows/plugin-checks.yml:85`) and the check runner (`tools/check.mjs:183`) do not set it. In CI, only the two release checks build the launch tree. A release run builds it too, because its scripts read `profile.sh`. So no form ships the tree that the pull request checks test, and a fault of the launch tree shows at the release. A direct run of `tools/deploy.sh` does not read `profile.sh`: it builds with the value of the caller's shell.
3. **The switch keeps about ten fork points alive.** Three source rewrites by exact text (`tools/solo-launch.mjs`), the swap of `next.html` (`vite.config.ts:194`), two service workers (`public/sw.js`, `tools/solo-launch/sw.js`), four forked legal pages, an error-forms filter, and branches in the deploy checks. Each of the three service-worker changes after the fork was made two times by hand.
4. **The rollback that the switch exists for does not work on the release path.** `profile.sh` sets the switch to 1 with no condition, so `tools/release/live.sh` cannot build with 0. [HOSTING.md](../../HOSTING.md) names a runbook that is not at that path.
5. **The route copies differ now.** For `/j`, the host sends the page to `join.html` (`tools/plugin-server-build.mjs:41`); the Vite preview (`vite.config.ts:198`) and the app router (`ios/App/App/SceneDelegate.swift:62`) send it to `index.html`. The one comparing test (`tools/ios-app.test.ts:12`) uses 11 sample paths and skips `/j` by hand. The list for fault reports (`src/diagnostics/data.ts:83`) lacks three routes, so their reports show `/other`.
6. **Rules that only a doc holds.** IOS.md gives these rules, and no test fails when a change breaks them: a site link and an `/api` call use `apiOrigin`; the app origin does not change; the lowest iOS equals the web build target. The checks of `ios/store.test.ts` that need no Swift run only on a Mac, not in CI. `tools/ios-sync.sh` does not clear `KINGDOWN_TEST_PAGES` or the Apple sign-in switch, so a value in the caller's shell goes into a store archive.

History: the iOS work started on 2026-11-07. In the 18 days after it, 3 commits repair a seam fault (a link, the `/j` route, and the check lists after the route change) and 5 more repair a wider difference between forms. The count is a floor. No commit repairs an `/api` call without `apiOrigin`.

## Solution

Three steps, each smaller than the platform object.

1. **Repair, then guard.** Repair the links of the sign-in sheet and the list for fault reports. For each rule that only a doc holds, add the narrowest test that fails. `src/platform.ts` keeps its two values and gets no new export.
2. **One page route table.** The host list is the table. The Vite preview reads it, and its own copy goes. A test compares each other copy with it: the Swift router, the launch service worker, the page-side parsers.
3. **Remove the fork.** First, CI and the checks build the tree that ships. Then the launch switch, the off build and its fork points go. This step ends the switch as a rollback path, so it needs the owner's decision.

## Tickets

| Ticket | Class | Size | Needs |
| --- | --- | --- | --- |
| [01: site links in the app](issues/01-site-links.md) | B | S | An iOS build to reach the app |
| [02: one page route table](issues/02-route-table.md) | B | M | Nothing |
| [03: the iOS rules as tests](issues/03-ios-rules.md) | B | S | Decision 3 |
| [04: the worker tests run on the worker that ships](issues/04-worker-tests.md) | B | S | Nothing |
| [05: the routes of fault reports](issues/05-fault-report-routes.md) | C | S | A staging pass; a publish |
| [06: CI builds the tree that ships](issues/06-ci-launch-tree.md) | B | M to L | Nothing |
| [07: remove the launch switch and the off build](issues/07-remove-off-build.md) | C | M | Decision 1; ticket 06; a staging pass; a publish |
| [08: the docs say what the code does](issues/08-docs.md) | B | S | Decision 1 for the rollback text |

Size: S is less than one hour of agent work, M is half a day, L is more. No ticket edits `src/interface/play/main.ts`, a turn module or an engine fingerprint file. Tickets 01 to 06 are independent of each other. If decision 1 is yes and ticket 07 comes soon, ticket 04 is not necessary: ticket 07 leaves one worker.

## Not in this spec

- **The platform object with a web adapter and an app adapter.** None of the 12 `inApp` uses becomes simpler behind an adapter: each field would have one to three users. Haptics already uses feature detection in one module (`src/interface/play/fx/pulse.ts`). The sign-in rule is in accounts code (`src/account/client.ts`); two callers in `src/interface/people/host/index.ts` branch on it. Look at this again only when a fifth form is planned.
- **A helper for site links.** Four places build `apiOrigin + '/<page>.html'`. Scan 1 of ticket 01 holds the rule, so `src/platform.ts` gets no helper.
- **A required origin for `onlineClient`.** Five call sites pass `apiOrigin` by hand. A required argument edits `src/online/client.ts`, which is class C, and no fault came from it. Ticket 01 guards the rule with a scan.
- **The invite link of a staging app.** `src/interface/people/host/index.ts:29` gives a `kingdown.dev` link in a staging app too. The app opens links of `kingdown.dev` only, so a staging link cannot open the app in any case. Known limit of staging.
- **The move of `/play`, `/g/<id>` and `/j` to the new page, and the end of the old board.** The live site still sends account solo games to the old board (`src/online/launch.ts:53`). This is part of the groundwork in decision 6 of [the change classes spec](../change-classes/spec.md) ("the end of the old page"). It is class C and gets its own spec.
- **One tool set for the plugin and Muse.** The two sets are written by hand, as FORMS.md states, on two versions of the protocol library. No fault came from it.
- **A test of the request bodies of build 8.** `src/api/ios-build-8-replies.test.ts` keeps the reply fields only. The archive commit of build 8 is not recorded, so a fixture would guard a guess. Add it with the next change of a request schema.
- **`/j` in the app router.** In the app, `/j` arrives only through a universal link, which `UniversalLink.swift` sends to the new page. A change needs a new iOS build. Ticket 02 names the difference in its test.

## Decisions for the owner

1. **End the off build.** Rule: one build for all forms; the launch switch goes. Numbers: every shipped form builds with the switch on; about 10 fork points go; the rollback by switch does not work on the release path now, and a direct `tools/deploy.sh --publish` with no switch in the shell publishes the off tree by accident. My pick: yes, after ticket 06 is green. On yes: ticket 07 builds. A rollback is then a revert and a release. The run-by-hand workflow `pages.yml`, which puts the off page on GitHub Pages, goes too.
2. **When ticket 01 reaches the app.** Rule: the app changes only with a new build and App Review. Numbers: version 1.1 (build 9) is in TestFlight and waits for the owner's test and the submission to App Review (TASKS.md); the faulty code is in it (not verified on a device); the repair is one line. The state of build 1.0 (8) is not known here: the release log says "Waiting for Review" on 2026-11-18. My pick: first confirm the fault on the simulator (some minutes). If it is real, build ticket 01 and make one new build before the submission. If the link opens, build 9 goes to review, and ticket 01 keeps only its guard. On yes: the submission waits for the check and, if necessary, for that build.
3. **Pin the Apple sign-in switch off in the production app build.** Rule: a store archive does not depend on the caller's shell. Numbers: 2 values in `tools/ios-sync.sh` (the Apple switch for the production stage, the test pages for each stage); the Apple switch is off in every build today. My pick: yes. On yes: the Apple release turns the switch on with a reviewed change of one line. A staging build for the simulator still takes the switch from the shell, as IOS.md says.
4. **Close retro item 9 without the platform object.** Rule: no abstraction without a second user. Numbers: 12 `inApp` uses, and each field of the object would have 1 to 3 users; 0 planned forms; 3 seam faults in 18 days, and tickets 01, 02, 03 and 06 guard each kind. My pick: yes. On yes: the retro records "decided, not built", and this spec holds the reason.

A publish for tickets 05 and 07 needs the owner's word, as each deploy does.

## Evidence

- The readers and the checkers read `origin/main` at f41b860db. A checker opened each cited file. The lead verified the facts of items 1, 2, 4 and 5 above in the code.
- Review: an agent that did not write the spec read head `215c7ab85`. It confirmed the main claim and most facts. It found four blocking faults, all in tickets 06 and 07: ticket 07 broke the local online stack and did not name ten tests and tools that read the fork; ticket 06 named the wrong file for its first test and missed one site build. One batch repairs these and its sixteen notes.
- Repair check: the same reviewer read `2584f065c`. Each repair holds, and no blocking finding stays open. It confirmed the new design of ticket 02 in the code. The lead then corrected four small notes of that check in tickets 02, 03 and 06 and in decision 4.
- Open findings: none that block.
- The lead tried the check of the sign-in links in the simulator on 2026-11-25. The session had no access to the simulator at that time, so the check did not run.
- Not verified: the sign-in links on a device; the number of checks that ticket 06 moves (an estimate from a search); that the launch tree is byte-equal before and after ticket 07 (no build ran).
