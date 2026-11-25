# The docs say what the code does

Status: done on branch seam-docs; waits for the review

Class: B (a doc of a rollback path gets an independent read). Size: S.

## Problem

- [HOSTING.md](../../../HOSTING.md) says that `/j` keeps the old page; on the site it goes through `join.html` to the new page. For the cutover and the rollback it points to a runbook at a path where no file is (line 172). It does not say that every release builds with the switch on.
- The comment in `next.html:37` ("no manifest and no service worker until cutover") is stale.
- [IOS.md](../../../IOS.md) calls `src/platform.ts` "the one seam" and gives its rules as text only.
- [FORMS.md](../../../FORMS.md) says that the web game screen and the plugin board screen are separate code. That is true for the new game screen. The account pages of the website (`/play`, `/g/<id>`) run the plugin screens through `src/online/runtime.ts`.
- The retro still lists item 9 as open.

## Change

- HOSTING.md: the true `/j` route; the runbook pointer goes or points at the file; the rollback that decision 1 leaves.
- `next.html`: the comment, if ticket 07 has not replaced the file.
- IOS.md: beside each rule, the test that holds it (tickets 01 to 03).
- FORMS.md: one line on the account pages.
- The retro: item 9 is "decided, not built", with a link to this spec.

## Checks

`npm run test:docs`.

## Known limits

- No tool or doc holds a rollback to an earlier deployment of the host. Ticket 07 names one under "Known limits" ("or an earlier deployment of the host"), but `tools/deploy.sh`, `tools/release/` and the spec give no step for it, so HOSTING.md does not name it. The lead decides if ticket 07 writes that step or removes the words.
- HOSTING.md gives the rollback of today and one sentence on ticket 07. When ticket 07 lands, its own HOSTING.md change replaces the text of today.

## Work record

Each changed sentence, with the code that proves it.

- `docs/HOSTING.md:156-159`: the release tools set the launch option. `tools/release/profile.sh:2` exports `KINGDOWN_SOLO_LAUNCH=1`; it is read by `tools/release/live.sh:22`, `tools/release/release.sh:304`, `tools/release/staging.py:86` and `:88` and `tools/lib/release-browser.mjs:53-54`. `tools/ios-sync.sh:19` exports it before the build. `tools/deploy.sh` has no read of `profile.sh` (a search finds only a comment at line 73), and its build step (`tools/deploy.sh:317`) takes the shell values; `tools/solo-launch.mjs:2-4` reads the option from the shell, off by default.
- `docs/HOSTING.md:161-166`: the routes of a launch tree. `tools/plugin-server-build.mjs:44` (`/j` to `/join.html`), `:45` (`/play…`, `/g/<id>`, `/j` to `/index.html`; the `/j` route before it matches first), `:47-50` (`/` to `/next.html`, the filesystem, the 404 page). `JOIN_PAGE` at `tools/plugin-server-build.mjs:19`; the host build writes it at `:139-140`. Test: `tools/plugin-server-build.test.ts:113` ("gives the host routes of the time before the page route table"), `:134` (the Vite preview), `:178-183` (the join page text and its target).
- `docs/HOSTING.md:164`: `index.html` loads `src/entry.ts` (`index.html:256`), which loads `src/online/entry.ts` for an account route (`src/entry.ts:4`).
- `docs/HOSTING.md:168`: a tree with no marker. `tools/plugin-server-build.mjs:44` and `:47` add the join route and the `/` route only with `solo-launch.json`. Test: `tools/plugin-server-build.test.ts:127`.
- `docs/HOSTING.md:169-172`: the comparing tests. `tools/ios-app.test.ts:14`, `tools/service-worker.test.ts:770`, `tools/platform.test.ts:108`.
- `docs/HOSTING.md`, the old line 172: the pointer to `runs/launch/platform/cutover.md` goes. No file is at that path beside the main checkout, and no file in the repository gives cutover or rollback steps for the launch.
- `docs/HOSTING.md:191-195`: the rollback. `tools/release/profile.sh:2` has no condition. A direct `tools/deploy.sh --publish` with no option in the shell builds the off tree (`tools/solo-launch.mjs:4`, `tools/deploy.sh:317`; spec decision 1 says the same). `tools/deploy.sh:13`: "No ref is accepted"; the script checks a fresh `origin/main` (`tools/deploy.sh:4`). Spec decision 1: "A rollback is then a revert and a release."
- `docs/IOS.md:37`: `tools/ios-app.test.ts:23` (the Swift pattern equals the host route as text), `:24-28` (11 sample paths, the `/j` difference and its reason).
- `docs/IOS.md:38`: `ios/store.test.ts:11-15` runs `ios/Tests/UniversalLinkChecks.swift`, whose native invite checks cover the launch marker on and off (`UniversalLinkChecks.swift:39-54`).
- `docs/IOS.md:39`: `tools/ios-app.test.ts:93-96`.
- `docs/IOS.md:41`: "the one seam" becomes "the seam". `src/platform.ts` exports only `inApp` and `apiOrigin`. The spec names a second seam for accounts and games (`AccountGameHost`), which is not between the website and the app.
- `docs/IOS.md:43`: `src/api/ios-build-8-replies.test.ts` (reply fields); the spec, "Not in this spec", says that no test holds the request bodies.
- `docs/IOS.md:44`: `tools/ios-app.test.ts:15` (`AppViewController`), `:54` (deployment target), `:98-105` (device family, orientations, light style), `:107-117` (colours, link preview); `ios/store.test.ts:24-35` (team), `:38-46` (`ITSAppUsesNonExemptEncryption`). A search of the test files finds no test of `UIRequiredDeviceCapabilities` or of `PrivacyInfo.xcprivacy` in the project resources.
- `docs/IOS.md:46`: `ios/store.test.ts:49-55`.
- `docs/IOS.md:48`: `ios/store.test.ts:38-40`.
- "macOS only" in IOS.md: the default test list has no `ios/` folder (`vite.config.ts:223`); `ios/store.test.ts` runs through `npm run ios:check` (`package.json:50`) and `tools/ios-release.sh:24`.
- `docs/FORMS.md:26`: `src/online/entry.ts:12` imports the plugin page, `:96` makes the browser host (`createBrowserRuntime`, `src/online/runtime.ts:124`), `:121` loads `src/account-game/runtime.ts`, which imports the plugin screens (`src/account-game/runtime.ts:14-29`). The ticket says "through `src/online/runtime.ts`"; that file gives the host, and `src/online/entry.ts` loads the screens. The doc names both. The launch rewrite of `src/online/entry.ts` (`tools/solo-launch.mjs:17-21`) adds two calls and does not change the screens.
- `docs/specs/retro-2026-11-24/retro.md:3`, `:44`, `:68`: the spec Status line (`spec.md:3`), decision 4 ("decided, not built"); PR 472 merged and PR 473 open (`gh pr view`, read on 2026-11-25); the Status lines of tickets 05 and 07.
- `docs/specs/platform-seam/issues/07-remove-off-build.md:29`: the stale comment is at `next.html:37`; `tools/solo-launch/next.html:37` has a different comment, so the comment goes when that page replaces `next.html`.

Where this lane did not follow the ticket:

- `next.html` does not change (the lead's note): tests read this file and `tools/solo-launch/next.html` by their text, and ticket 07 replaces the file. Ticket 07 now names the comment.
- The rollback text names no earlier host deployment (see "Known limits").

Not verified:

- That ticket 06 is in build: only the lead's note says so; its ticket file still says `needs-triage`, and this lane does not edit it.
- The host answer for `/` on a tree with no marker: no route exists, and the doc relies on the default file of the host.
- The kept sentences of "Solo launch preparation" that this lane did not change: the worker cache list, the local Computer controls and the hand-over history. Read and true: the API refusals (`src/api/http.ts:155`, `:172-173`), the quota (`src/plugin/service.ts:17`), `localSolo` off by default (`src/api/http.ts:114`) and from the marker (`tools/plugin-server-build.mjs:103`, `tools/plugin-server.mjs:188`), the release line (`tools/plugin-server.mjs:206`), `errors:daily` (`package.json:37`).
- The kept sentences of the changed IOS.md rules that this lane did not read in code: that both old app deletion controls open You on the new page, the router case with no marker, the empty path of the start address, and the full list of settings changed by hand.
- No build, no route check on the live host, no iOS run.

Tests that read the changed docs: a search of the test files under `tools/`, `src/` and `.claude/hooks/` for the names of the five changed docs and `platform-seam/issues` finds only comments and `tools/steering.docs.test.ts`, which `npm run test:docs` runs. No ordinary test asserts a changed sentence.
