# First staging game

Status: first real web–ChatGPT game and five fresh native ChatGPT opens verified. The test procedure avoids confirmed debugger-associated interference. That tooling interaction remains unresolved.

Owner request: develop in this separate project, reuse the reconciled work, fix integration faults and demonstrate the first web–ChatGPT game in staging. No production deploy.

## Boundaries

- This repository is an independent copy under the new project. The source project is read-only and its push remote is disabled here.
- Use the existing engine, painted art, account service and clients. Keep production accounts/data/deployments unchanged.
- The integration task owns shared client, plugin and GUI files. Delegated writers use separate worktrees and named files.
- Use fresh local test data and isolated staging configuration. Never copy or print credential files.

## Plan

1. Import the integrated base and the reviewed web/GUI work in small increments; retain source references and fix known regressions.
2. Reconcile migration numbering and run the ordered schema on a disposable database.
3. Wire the existing account screens through the web client and host adapter. Preserve request identity, privacy and local saves.
4. Build and test one staging friend game across HTTP and MCP: hidden setup, complex turn, lost reply/reload and authoritative result.
5. Review the changes independently and fix confirmed faults. Exercise the real ChatGPT host when staging access is available; distinguish that from the harness.

## Acceptance

- Independent application repository; original checkout unchanged.
- Required tests/builds pass against the integrated source. No skipped required database test.
- Same account/game continues on both surfaces. Stable command retries have one effect; changed input under the same ID fails.
- No hidden opponent setup or human-game board in model responses.
- Local game/learning routes remain usable.
- Staging is isolated from production. No production deployment, migration or account mutation.
- Exact preview address, source, checks and any host-access limits are recorded.

## Integration checkpoint

- Imported the preserved web branches through web-08, both regression patches and approved GUI work. Resolved shared art paths and the coin paint/focus rules.
- Integrated migration, HTTP, shared runtime and isolated staging configuration changes. The source project remains read-only.
- Fresh loopback database `kingdown_new_staging_test`: migrations 0001–0016 each apply twice.
- Integrated broad run: 4,187 tests pass; six failures then found in draft preservation, deploy fixtures, privacy text and a secret-scan fixture. All six are fixed. The follow-up run passes all 399 selected tests plus 53 artwork checks. Eight optional balance-drift checks stay off; no required database test is skipped. Documentation checks pass all 161 tests.
- Focused HTTP/database tests: 67 pass, including a game shared by HTTP and MCP, hidden setup and a duplicate move with one stored receipt. Runtime route checks: 9 pass. Artwork checks: 53 pass.
- Independent review found and fixed the UI command-ID format mismatch and a stale invitation preview that replaced newer navigation. Configuration review also changed the staging connection guard to require the restricted runtime role.
- The built browser proof passes with a disposable database: friend game, hidden setup, visible painted board, Flame/Haste choice, two-step atomic turn, lost reply, identical retry after reload, direct-link resume, same account through MCP, and a shared final result. Cleanup leaves no test users, games or outbox rows. Evidence is in the new project's `evidence/staging-local-browser/` folder. This is not a real ChatGPT host test.
- Integration fixes also restore imported setup styles and root asset URLs. Independent review finds no remaining confirmed defect in the setup styles or draft preservation fix. Pending move IDs and input remain unchanged.
- Real staging resources now exist: Supabase `kingdown-staging` (`puhspsyjyzaghmgtkzqd`, Free) and Vercel `kingdown-staging` (`prj_6iNibe34pA8ZSblH8DPAHyDTuz3j`). No production resources changed.
- Staging schema, restricted grants and account switch applied. Public OAuth client `001472fe-cd83-4a73-b0e5-87edc54b0713` maps to `https://kingdown-staging.vercel.app/mcp`. Preview-only database and internal secrets are held by Vercel. No secrets are in this repository.
- Explicit staging build and dry-run publish guards pass. `check:vercel` passes against that artifact: 187 offline URLs, seven account entry routes, 116 board art files, 22 closed API probes with no database call, 28 enabled API probes, three provider-refused writes with no game effect, MCP open/move, OAuth, internal jobs and five archived engines. The checker now tests the current web routes and removed email job.
- Resume now routes inside the shared queue before it releases the controls. A held-response regression fails before the fix and passes after it. Saving a newly selected plugin board also removes a draft with the previous ownership scope. Obsolete unscoped drafts are discarded. Browser account scope and pending command identity stay intact. Independent review finds no remaining defect in these fixes.
- The full compiled HTTP plugin browser check passes in 245.5 seconds, including game and GUI journeys, remounts, duplicate command handling, and strict private-draft scope checks. The final legacy-draft cleanup then passes 27 client tests, typecheck and 53 artwork checks. Its focused regressions fail before the fix. The log is saved in `evidence/staging-checks/plugin-ui-http-final.log`.

## Hosted checkpoint

- Preview `dpl_FtPtUzjWoYNbtzvMLXUgRhrGVW3E` is READY, with product source `01cbe379`. Its generated URL is `https://kingdown-staging-mfymq2kf9-saars-projects-2c777ec5.vercel.app`. The alias `https://kingdown-staging.vercel.app` points to it. Hosted worker version is `b97b6c1cdd0b`.
- Anonymous hosted checks pass: website and deep game entry return 200; account status reports open; protected MCP and account reads return 401; OAuth metadata and consent return 200. The runtime connects to the isolated database. Vercel protection settings did not change.
- Vercel makes a new project's first deployment production even with the CLI preview flag. The first staging attempt, `dpl_GBEDmDAsvanmYySWG2EyDoqeMawn`, is removed after the preview takes the alias. No original production project changed. The deploy helper now refuses empty project history and verifies the returned project, READY state and preview target. Four guard tests pass.
- The owner saved the GitHub provider. Public settings confirm GitHub enabled; Google remains disabled. Website sign-in and the separate ChatGPT OAuth connection complete.
- Website sessions now accept the exact `authenticated` audience as a string or a one-element array. Other audiences and OAuth-client tokens remain rejected. The signed-token regression fails before the fix and passes afterward: 56 API tests, 53 artwork checks and typecheck pass. An independent review finds no defect. The hosted session works after reload; its raw token was not inspected.
- Public cache installation now uses eight fetch/write slots and keeps complete-cache validation before takeover. An unavailable entry offers Try again. The focused cache, access, entry and client checks pass 222 tests, typecheck and 53 artwork checks; independent review finds no defect. The final staging build, compiled artifact check and 161 documentation checks pass.
- A new in-app browser visit still exceeds eight seconds during first installation; Try again reaches sign-in. The follow-up now allows up to 60 seconds only for a confirmed first install with no controller or active worker. It then requires a fresh eight-second proof. Existing active-worker deadlines remain unchanged. Delayed install, failure, timeout and late-event regressions pass: 219 focused tests, typecheck and 53 artwork checks. Independent review finds no defect. Final build, compiled artifact and documentation checks pass again.
- At this checkpoint, an already installed worker's update can exceed the normal eight-second limit and show Try again. The later [cache release repair](issues/09-cache-release-transition.md) resolves that observed path: known installations share one bounded installation budget before fresh proof. The [current U05 record](../shared-game-coverage/issues/01-mechanics-and-sessions.md) contains the accepted source, compiled and live website evidence, with fresh native ChatGPT verification still open.
- Hosted evidence is in the independent project's `evidence/staging-hosted/` folder. The extended first-install timing is verified by deterministic delayed-install tests; hosted screenshots distinguish the observed retry path from that proof.

## Real-host verification

Status: the game round trip passes. See [the real-host record](issues/09-real-host-proof.md) for the game, steps, evidence and remaining fresh-load issue.

1. Website sign-in and separate ChatGPT consent complete.
2. Website game `1e34ff0e-5f7b-84f0-8cc6-22268129d986` resumes inside ChatGPT with the exact website move history.
3. The widget commits a move and resignation. Fresh website reloads show the matching four moves and final result.
4. Screenshots record both surfaces. The live solo game supplements the hidden friend setup, complex turn and lost-reply harness evidence.
5. Browser-API page opens can fail before observed game HTML. [First-load controls](issues/10-first-chatgpt-load.md) isolate debugger-associated interference: attachment stalls navigation, and detachment releases the pending load in two tabs. Five distinct native first opens pass without retry or debugger attachment before readiness, including plugin-page entry; one is the control later reused for the attachment test. The actual saved board resumes with matching history. The application blocker is closed for this native workflow; the exact debugger interaction stays open as a tooling limitation. The product preview is unchanged and temporary diagnostics are removed.
