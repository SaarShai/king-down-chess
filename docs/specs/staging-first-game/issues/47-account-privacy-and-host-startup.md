# Close account privacy and host startup gaps

Status: in progress. Parent: U09/U11. Follows tickets 10, 34 and 46.

The owner asks to solve second-account privacy and the existing host-startup issue. Keep all work in staging. At ticket entry, product source is `25978776`; its game artifacts match the accepted mechanics and cross-host evidence.

## Plan and pass criteria

The owner now asks for a staging-only password login for the approved test account. Add it to the website account entry with the existing Supabase client. Require the staging build and the isolated staging origin; fix the email to the approved account. Keep the server allowlist and auth hooks unchanged. Check successful and failed sign-in, route return, duplicate submission and exclusion from other builds. Publish through the guarded staging path, then use normal credentials for the actual A-to-B website check. Do not copy a connector session. Reuse the completed game and native-host checks. Narrow the plain iframe reproducer with same-site and cross-site controls; close new test tabs and stop its local server.

Normal B password entry succeeds on `ef0d54f7`, but return to A's private route shows only the shared closed-panel notice. The owner reports that sign-in seems not to finish. Keep the privacy teardown and add a website access-loss message with a link to the signed-in account's own games. Check that the compiled normal password flow gets a real 403 for A, clears the board, offers this exit and opens B's own game. The host adapter owns this navigation; the embedded host keeps its existing close notice.

1. Reuse the prior attached/native startup controls. Reproduce the current attached-path failure before changing product code. Record the first missing boundary and distinguish it from the separate game-list Internal error. Use supported browser/native diagnostics, fixed method/status data and no tokens or account payloads.
2. Inspect the normal staging identity and account-switch paths. Use an existing authenticated second identity if available. A provisioned staging test account must use normal auth, never an injected actor or relaxed production policy. Identify any exact user-only credential or consent step.
3. Verify A-to-B disposal of private board, draft, invite, history and late replies; B must be refused A's private game. Keep source/compiled checks distinct from actual website and ChatGPT evidence. Fix only demonstrated gaps at their shared boundary.
4. A cause-specific startup fix must turn the original red path green. Require ten fresh opens of the formerly failing attached path and ten native controls on one exact artifact, without Try again or a hidden retry. If no application defect is found, record the exact external boundary and the verified supported-path limit without calling it fixed.
5. Run only affected checks, publish only through the guarded staging path if product changes, restore the original account connection and remove probes. Reconcile the report and blueprint; no production release.

## Remaining verification plan

Follow-up: keep source `4d734b2f` fixed. Inspect native Chrome child-frame diagnostic UI during one controlled failure; compare its paused/loaded state with the existing network trace. Check the website's normal sign-out and sign-in in two open tabs, including private history and draft disposal. Check for a supported second-account sign-in path without copying a session or changing credentials. Current connector metadata lists A as Primary and B as a separate connection; correct the earlier sole-connection inference. Record each host boundary separately and close every new test tab.

The live website cross-tab sign-out clears the private board, Ice Wall a5 draft, handle and open seven-action Moves sheet. Local play remains. Normal GitHub sign-in then returns to `/play/`, although the player was at `/g/02207813-587c-867d-99be-7d448c5e30b0`. The entry captures its initial route before the game opens. Fix this proven return-path defect by reading the current validated route when sign-in starts. Check the red/green entry case and existing PKCE/route cases, then repeat the normal hosted sequence on a guarded staging release. No new login method, credential, auth grant or game change is needed.

Keep the deployed artifact fixed while testing these ranked causes:

1. Browser control holds a new child frame before its document starts. Inspect the extension's native diagnostic UI or child target state; a child-target error would narrow the existing stalled-request proof.
2. The host binds a panel to one connection rather than switching it when a different tool result opens. Use native ChatGPT account controls on one open document and record the frame identity and visible contents before and after.
3. A host result can change the actor without teardown. Inspect the SDK adapter and run the compiled HTTP harness at that boundary if the actual host behavior supports this path.

Reuse the completed server privacy checks and ten native controls. A host-state observation must distinguish a new panel from an in-place transition. Do not call a timeout a privacy leak or a startup repair. Add product code only for a demonstrated defect, then rerun its original reproducer.

Native reconnect now reproduces a real in-place defect on `f27694f7`. Keep A's Moves sheet open, reconnect its existing link as the already-signed-in B account, then return to the original tab. The same sandbox init ID remains. A tool call through the reconnected link lists B's zero games. The old panel receives `Board unavailable for this account` but keeps A's board, handle, cards, powers and seven-action history visible. No teardown occurs. Add a compiled HTTP regression for this refusal path; clear private content at the access-loss boundary and repeat this exact live reconnect after a staging-only release. Restore A through its existing GitHub sign-in.

## Evidence to reuse

- [Original startup diagnosis](10-first-chatgpt-load.md): minimal widget also fails before its HTML appears; debugger detachment releases navigation in controlled comparisons.
- [Interrupted request and account-switch checkpoint](34-host-recovery-and-account-switch.md): transaction retry is proved; only one staging/GitHub identity is available at that checkpoint.
- [Available-provider proof](46-available-sign-in.md): GitHub-only staging choices, PKCE, account switch and local/offline continuity pass. No provider credentials change.

## Demonstrated privacy repair

The compiled SDK panel keeps its private board visible after host teardown on `26bc317c`. The same HTTP service refuses the other disposable actor with `FORBIDDEN` and no view. The new registered `plugin-privacy` check isolates these two boundaries.

Product `f27694f7` clears the document at the shared close boundary, makes repeated close safe and ignores late tool results. The regression passes with a successful private read held until after teardown, another old result and repeated teardown. No board, page, draft field or dialog remains. The test uses real compiled code and HTTP with local disposable actors. It is not a claim of an actual host account switch.

Validation: 467 selected source tests in 24 files pass, plus the test command's 54 artwork checks. Compiled `plugin-privacy`, `plugin-ui-http` and `web-game` pass. The initial source-test invocation selects no files because it supplies a space-separated string where the runner expects one glob; the corrected selection is `src/{account-game,plugin}/**/*.test.ts`. No product failure is hidden by that correction.

The guarded staging release publishes preview `dpl_JAQTqSSJPjZrLDtYHPZS43Qkdwsz` from clean source `f27694f7`. The staging alias points to this preview. Public HTML and service-worker hashes match the build; account access is open. The embedded board changes; the backend, engine runtime and all eleven archives stay byte-identical. Compiled artifact checks pass. Production is untouched.

## Startup boundary trace

Native DevTools supplies a new trace on the preceding live source `25978776`. A native open and reload reach the game. Its sandbox document returns 200 in 2 ms from disk cache. Attach browser control to that same tab and reload: the sandbox document stays pending, then the Timing panel records 20.00 seconds in Stalled before ChatGPT removes the frame and offers Try again. No game document is observed on this failing path.

This supports the earlier minimal-widget and detach controls. It does not establish the precise debugger event or fix the browser-control integration. The separate old Internal error after the game list remains unexplained. No game retry, CSP relaxation or startup rewrite is added. Ten full-page native navigations of `f27694f7` reach enabled controls with ten distinct sandbox init IDs and no Try again or Internal error. The tenth shows a longer Loading games phase before it becomes usable without intervention. These are warm-profile readiness checks, not measured cold-load timings or a repair of the attached path.

## Actual second identity

The owner approves one restricted staging login, `privacy-check@kingdown.example`. Existing Email and both auth hooks are enabled. The password allowlist starts empty; one matching row is added after the owner's action-time approval. The owner creates the account and enters its password through the normal UI. The staging user list now has two identities. No password is read or generated by the agent.

Normal consent signs the new identity into ChatGPT and the connector lists both accounts. The original account remains primary at this checkpoint. Real connected tools select each account explicitly. A lists ten active games; B lists none. B is refused A's private game `02207813-587c-867d-99be-7d448c5e30b0`. A is refused B's new private game `606bd786-e1f0-42d8-9c12-f4bb1e724dac`. The actual website, signed in as A, also refuses B's game without a private board. Both owners can open their own game. The native ChatGPT B panel lists only B's game, shows its own classic board and has empty Moves, with none of A's seven actions, cards, powers or handle. The disposable B game is then aborted normally at move one, with no result or rating effect.

The Codex panel shows A's seven-action Moves sheet before an explicit B open. The B tool returns its correct game, but subsequent panel reads time out twice, including after tab inventory recovery. Thus this turn does not verify visible in-place disposal under a live host account transition. The compiled SDK teardown and late-reply repair remain separate evidence. Website password entry is not present; no session is injected to simulate a web A-to-B login. The original account stays connected and marked Primary.

Detailed receipts and screenshots are in the parent workspace's `evidence/staging-account-host-privacy/verification.md` and its sibling files.


## In-place reconnect follow-up

Source `4d734b2f` repairs the live reconnect defect above. Six product lines at the shared current-board read boundary clear saved state and invoke the existing close path on `FORBIDDEN`. Foreground and polling source cases pass; transient errors retain normal recovery. Compiled `plugin-privacy` changes the HTTP actor in the unchanged iframe, receives the real refusal, verifies empty saved private state and no private DOM, then rejects an old successful reply. Its clean red and green runs prove the exact defect. The prior teardown test remains.

Verification: 469 selected source tests in 24 files plus 54 artwork checks; compiled privacy (9.4 s), HTTP panel (246.784 s) and website (46.554 s) pass. A first broader attempt was interrupted by the local database shutting down; it is excluded. A dedicated loopback test database at port 55447 replaces that stopped test service, with migrations 0001–0018. Only the affected browser checks are rerun. The serializer assertion correction and invalid dirty-run attempt are retained in the evidence ledger, not counted as passes.

Guarded preview `dpl_8Wgf4XApWe8s2taCVs4r2mt5aiao` from clean `4d734b2f` is live only at the staging alias. Artifact checks pass; public HTML and service-worker hashes match. Backend, runtime workers and eleven archives remain unchanged.

The actual native green check keeps B’s feature-enabled board, uncommitted Ice Wall a2 draft and Moves sheet open. Normal reconnect through the existing GitHub session restores A. The same init ID `6d6aff97-7ac1-459f-814f-44a0bdc7cce2` then displays only the closed-panel notice on the first denied read, without a reload. The board, draft, cards, powers and sheet disappear. This repeats the red access-loss path with the two identities reversed. A again lists its original ten games and is refused B’s private fixture. The website retains A’s seven-action history. The casual B game `ed1d277d-7d76-4d68-ae6d-d9eb6907ffc5` is retained for privacy checks; its card draft was never submitted as a turn. No rating changes occur.

The final normal reconnect restores A as Primary. Later connector metadata and native Settings show both A and B connected; the earlier sole-connection inference is incorrect. The approved B staging user remains provisioned. No password is read or re-entered. Actual website login switching to B remains unverified because the public website exposes GitHub only. Existing real website refusal and compiled account-switch checks are distinct evidence.

Chrome NetLog adds a network-layer trace of the attached-path failure: the sandbox iframe request receives 304 after 248 ms and completes after 250 ms, while ChatGPT still removes the blank iframe and offers Try again. Thus the older 20-second DevTools Stalled view does not show an origin/network failure. The fault remains after response completion and before the game document is observed. The exact debugger command is unknown; the earlier minimal-widget and detach controls remain relevant. Only staging event metadata is retained; the raw log is removed, none is sent externally, and no browser protections or settings are changed. This is diagnostic progress, not a claimed startup fix.

Current receipts and screenshots: parent workspace `evidence/staging-account-reconnect/verification.md`. Ten fresh native full-page navigations of this artifact reach enabled controls with ten distinct init IDs, without Try again or observed failure UI. One observation is interrupted by another foreground window; returning to the existing frame confirms readiness without reload. The tenth has a longer disabled-controls phase before it becomes ready. These are warm-profile readiness checks, not latency or cold-load measurements. Original A’s seven-action history matches in native ChatGPT and the website. The attached-path acceptance gate remains open.

## Website return and isolated browser follow-up

Source `7f214a30` fixes the stale sign-in return route. The sign-in button now parses the current address through the existing route boundary. A red entry regression receives `/play/` where it expects the open game; the green entry/PKCE/route selection passes 113 tests in three files, typecheck and 54 artwork checks. Compiled `account-discovery` passes in 8.8 seconds. No new login method or auth authority is added.

Guarded preview `dpl_CLhpy4o9AkiAvvwc4qSmTmu5JDTG` is live only at the staging alias. The artifact gate and hosted HTML/service-worker hashes pass. Backend, embedded board, consent, runtime workers and eleven engine archives remain byte-identical. The actual website sign-out in a second tab removes the private board, handle, card-draft controls and open Moves sheet from the first tab. Local play remains available. Normal GitHub sign-in returns directly to the same game. The owner's account-scoped draft resumes after sign-in; Undo removes this diagnostic draft before cleanup. All seven committed actions remain unchanged. A browser-control read timeout is resolved by native inspection, without reloading the game.

A plain loopback page now reproduces the startup failure with only a button and a cross-site iframe pointing at the staging privacy document. It has no ChatGPT host, SDK, auth or game code. Under control, the child remains about:blank. Cancelling the debugger attachment lets the same frame display the document without reload. A fresh native open also works. This isolates the fault to the attached browser path. Installed controller source enables Document-response Fetch interception, ignores child-session events at that handler and discards handler errors; ordinary iframe auto-attach does not request a paused start. These are specific diagnostic leads, not a captured failing command or a repair. The next useful trace is the paused response and its release result with the child session identifier. Do not repeat game startup rewrites or infer a JavaScript pause from the blank frame.

Both staging connections are available: A lists ten games, B its one retained fixture. Actual website A-to-B login is still unverified: the website has GitHub only and B is password-only. Connector consent uses separate session storage. Complete this only through a supported website login for B and normal credential entry, or a second GitHub identity. No session is copied or injected. Existing real website refusal, compiled identity checks and native reconnect remain separate evidence.

All five test tabs are closed, all 24 original tabs remain, and the loopback probe process is stopped. The original website identity is signed in. Production is untouched. Full receipts, source observations and the minimal reproducer are in `evidence/staging-browser-followup/verification.md` in the parent workspace. This follow-up closes the proven return-path defect and adds a smaller external reproducer; it does not close the controlled-startup or actual website A-to-B gates.
