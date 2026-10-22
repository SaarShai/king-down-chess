# Complete host interruption and account-switch evidence

Status: actual ChatGPT interruption and retry pass within the limits below. A second-account switch remains blocked by the available identities. Parent: U11; follows ticket 28.

## Plan and pass criteria

Use the accepted staging release and existing test game evidence. First inspect available actual-host and sign-in controls. The Codex panel has no lifecycle API; try the existing ChatGPT browser host, where ordinary tab reload and browser network controls may expose the required interruption. Do not bypass the native Codex restriction.

1. Use a disposable staging operation. Interrupt only when Sending is observed. Record whether the server accepts before the reply is lost. Reopen through normal controls, resolve the same command and check one authoritative effect. A completed reply followed by reload is not this test.
2. Inspect the normal staging sign-in flow for a second available identity. Use existing authorized sessions, without new credentials or altered auth boundaries. Verify old private state clears across the switch; prove access refusal for the other account's private game. Restore the original staging connection.
3. Reuse accepted compiled recovery and privacy tests. If an actual-host boundary remains inaccessible, record that exact limit and complete any distinct missing controlled check without relabeling it as actual-host proof.
4. Keep request bodies, tokens and credentials out of artifacts. Save concise receipts and relevant visible state. Change product code only for a demonstrated defect. Production and unrelated accounts stay untouched.

## Alternative interruption boundary

Browser throttle settings do not produce a confirmed lost reply. Remove the temporary profile and close developer tools. Use the authorized staging SQL editor to hold only the disposable game's row in a bounded transaction, if the existing service waits on that row. Send from the actual host while the row is held; reload during Sending, then let the transaction release. Check the resulting game and command receipt. The lock must expire automatically, must change no stored data, and must never touch production or the preserved feature game. No new endpoint or altered host request is needed.

## Accepted host evidence

The live source remains `5ac73cc9`, deployment `dpl_CtN33YipFC2U7etN9tC8FrJkahfD`. The only database is staging project `puhspsyjyzaghmgtkzqd`. The test uses disposable Casual computer game `02207813-587c-867d-99be-7d448c5e30b0`. The preserved eleven-action feature game stays unchanged.

The SQL editor runs one bounded `DO` statement. It locks this game row only, checks the creator and expected revision, sleeps, then releases with no data write. A separate read counts requests blocked by that transaction. The 35- and 45-second calibration holds exceed the deployed function's 30-second limit. Both functions time out and roll back. An early inference that the first request did not reach the server is withdrawn: the runtime logs show the timeout. These attempts do not pass lost-successful-reply recovery. Use a 20-second hold on this deployment; never extend its execution limit to make the test pass.

The valid interruption starts at 08:09:08 UTC on 21 October 2026. ChatGPT shows Sending for the March move a3–a5. PostgreSQL observes one blocked request at 08:09:16. The client reaches its normal ten-second timeout and retains Retry. The operator reloads at 08:09:23, before the row releases at 08:09:29.397. The move then commits once: revision 5 becomes 6, command `8cb9df8a69a743c59a1ee60d72e55015`, actions `["a3-a5"]`. Thus the reload occurs after the client timeout while server work remains pending, not while Sending is still visible. On return the game resumes; the computer moves b5–c4 once.

A separate actual-host retry uses the Maester swap c1–d1. The same 20-second hold makes ChatGPT time out. Before Retry, a read proves the move has committed at revision 8, command `be72dd6975e9428c925666c2fc98ba7b`. The existing Retry control resends the saved command. It recovers successfully, with one row and one effect for that command. The website then supplies the computer's c4–d3 response. Both actual clients display all seven history actions; the final row is revision 9, White to move. No stale revision error or second Maester swap appears. The command-count evidence and existing saved-command implementation support the same-ID result; no authenticated request body is captured.

## Account boundary

The staging auth table contains one account, backed by GitHub. ChatGPT's normal Connect another account flow opens staging consent. Use another account clears the displayed identity and presents sign-in controls. Continue with GitHub restores the original account through its existing session. GitHub's account switcher contains only Add account, with no second signed-in identity. The new connection flow is closed before adding a duplicate connector account. The existing connection continues to work.

This is a real consent sign-out and return check. It is not an A-to-B account switch, private-game refusal for B, or proof that old host state clears after B connects. Those checks require another existing identity to sign in. Reuse the accepted compiled identity, draft ownership and private-view tests; do not create credentials, bypass auth or claim those tests as actual-host evidence.

## Reopen limit and cleanup

The browser-control-attached ChatGPT tab shows Couldn't display King Down Staging after fresh navigation and after each full-page reload. Try again mounts the app. The test therefore passes transaction safety and recovery after explicit host retry, not reliable first readiness without Try again. This is consistent with the open attached-tab limit in ticket 10. Prior native first opens remain distinct evidence. Captured console entries show the induced SDK timeouts and host cache warnings; they do not identify a new product root cause. No speculative game or CSP patch is made.

All row holds release automatically. The temporary throttle profile is removed and normal networking is confirmed. The consent session returns to the original identity. The disposable friend calibration game is cancelled normally; the computer fixture remains as evidence. The setup preference is restored through normal Ranked controls, with its empty waiting game cancelled. Production, live source, rules and deployment settings do not change.

Evidence lives in the parent workspace's `evidence/staging-host-recovery/`: timestamped UI receipts, before/after command rows, bounded runtime-log metadata and screenshots. The report maps each claim to its receipt. Prior roster, privacy and recovery tests are reused. `npm run test:docs` passes all 161 checks in 13 files. Receipt assertions confirm revision 9 and one row for each interrupted or retried turn. This is a documentation-only change; no unchanged gameplay suite is rerun.
