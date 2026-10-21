# Close account privacy and host startup gaps

Status: in progress. Parent: U09/U11. Follows tickets 10, 34 and 46.

The owner asks to solve second-account privacy and the existing host-startup issue. Keep all work in staging. At ticket entry, product source is `25978776`; its game artifacts match the accepted mechanics and cross-host evidence.

## Plan and pass criteria

1. Reuse the prior attached/native startup controls. Reproduce the current attached-path failure before changing product code. Record the first missing boundary and distinguish it from the separate game-list Internal error. Use supported browser/native diagnostics, fixed method/status data and no tokens or account payloads.
2. Inspect the normal staging identity and account-switch paths. Use an existing authenticated second identity if available. A provisioned staging test account must use normal auth, never an injected actor or relaxed production policy. Identify any exact user-only credential or consent step.
3. Verify A-to-B disposal of private board, draft, invite, history and late replies; B must be refused A's private game. Keep source/compiled checks distinct from actual website and ChatGPT evidence. Fix only demonstrated gaps at their shared boundary.
4. A cause-specific startup fix must turn the original red path green. Require ten fresh opens of the formerly failing attached path and ten native controls on one exact artifact, without Try again or a hidden retry. If no application defect is found, record the exact external boundary and the verified supported-path limit without calling it fixed.
5. Run only affected checks, publish only through the guarded staging path if product changes, restore the original account connection and remove probes. Reconcile the report and blueprint; no production release.

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

Native DevTools supplies a new trace on the preceding live source `25978776`. A native open and reload reach the game. Its sandbox document returns 200 in 2 ms from disk cache. Attach browser control to that same tab and reload: the sandbox document stays pending, then the Timing panel records 20.00 seconds in Stalled before ChatGPT removes the frame and offers Try again. The game document does not execute on this failing path.

This supports the earlier minimal-widget and detach controls. It does not establish the precise debugger event or fix the browser-control integration. The separate old Internal error after the game list remains unexplained. No game retry, CSP relaxation or startup rewrite is added. Ten full-page native navigations of `f27694f7` reach enabled controls with ten distinct sandbox init IDs and no Try again or Internal error. The tenth shows a longer Loading games phase before it becomes usable without intervention. These are warm-profile readiness checks, not measured cold-load timings or a repair of the attached path.

## Actual second identity

The owner approves one restricted staging login, `privacy-check@kingdown.example`. Existing Email and both auth hooks are enabled. The password allowlist starts empty; one matching row is added after the owner's action-time approval. The owner creates the account and enters its password through the normal UI. The staging user list now has two identities. No password is read or generated by the agent.

Normal consent signs the new identity into ChatGPT and the connector lists both accounts. The original account remains primary at this checkpoint. Real connected tools select each account explicitly. A lists ten active games; B lists none. B is refused A's private game `02207813-587c-867d-99be-7d448c5e30b0`. A is refused B's new private game `606bd786-e1f0-42d8-9c12-f4bb1e724dac`. The actual website, signed in as A, also refuses B's game without a private board. Both owners can open their own game. The native ChatGPT B panel lists only B's game, shows its own classic board and has empty Moves, with none of A's seven actions, cards, powers or handle. The disposable B game is then aborted normally at move one, with no result or rating effect.

The Codex panel shows A's seven-action Moves sheet before an explicit B open. The B tool returns its correct game, but subsequent panel reads time out twice, including after tab inventory recovery. Thus this turn does not verify visible in-place disposal under a live host account transition. The compiled SDK teardown and late-reply repair remain separate evidence. Website password entry is not present; no session is injected to simulate a web A-to-B login. The original account stays connected and marked Primary.

Detailed receipts and screenshots are in the parent workspace's `evidence/staging-account-host-privacy/verification.md` and its sibling files.
