# Keep the URL game while a prior command completes

Type: task
Status: resolved

## Authority and evidence

The owner authorizes this repair and staging deployment on 23 October 2026. The exact request is in the parent spec. This is an exception to the playtest's prior read-only product boundary, limited to F-077.

The parent workspace has the confirmed finding at `playtest/reports/tickets/F-077.md`. A computer move is submitted. About 1.5 seconds later, the same tab opens a friend URL. The old computer game stays visible for more than 30 seconds and receives the computer reply. Reload opens the friend game. Two different test players repeat the fault in different browsers. The simpler repeat uses one tab and no offline step.

## Plan and verification

1. Trace explicit entry routing, durable command recovery and late replies. Add a deterministic failing regression that keeps a pending command for game A while the URL selects game B.
2. Make the smallest runtime change that keeps game B selected, preserves game A's exact command identity and avoids duplicate commands or lost recovery.
3. Run the selected tests through `npm test`. Run the registered browser check that covers account game routing and pending recovery. Have a separate reader review the diff.
4. Build and check the isolated staging artifact. Use the guarded staging deploy and alias path. Record the source and deployment identity.
5. Use the saved test accounts to repeat the original UI sequence after a fresh load. Check the correct opponent, colour, last move and URL before and after the computer reply. Return to the source game and verify its saved move. Continue the four-player playtest.

Pass criteria: the regression fails on the original code and passes with the repair; related checks pass; staging loads the checked build; the original sequence no longer shows the wrong game; recovery retains the source move; production does not change.

## Scope

No new dependency, account, rule, schema or authentication change. Do not change the unrelated disk-storage work. A draw-offer delay is a separate playtest finding.

## Results

The source cause is in the browser host startup. It applies the URL, then lets the durable move receipt replace the selected board. The shared mount keeps that saved selection. A later reply can keep the old board visible under the new URL.

The repair keeps an explicit different game selected for saved player moves and computer replies. Create, Find and setup steps keep their existing continuation and selected board. This avoids changing start-flow behavior. The web host also declares that its one durable receipt locks commands across the account. The existing Retry stays visible on the selected game after a failed recovery; a new retained command cannot replace the saved command. The destination routes by its own status while another game's receipt waits. Plugin command locks keep their current per-game scope.

Checks so far:

- Before the repair, both new move/computer route regressions fail: expected target B, received source A (20 other tests pass).
- Initial related run: 76 of 77 pass. The plugin R10 remount check hits an undefined harness app; its isolated rerun passes. No harness change is made.
- After review changes: 96 selected tests in four files and 54 artwork checks pass, including exact Create/Find recovery through the page client and account-wide Retry/lock selectors.
- The first compiled check stops before running because the local disposable database is offline. That test service is restarted. Queued checks are stopped before edits; no interrupted result counts as a pass.
- The independent review finds three gaps in the initial patch. Scope is narrowed to move/computer selection, account-wide recovery controls are added, and destination setup routing is checked. The second review finds no remaining blocking app-code defect. Its check-driver finding is corrected: all four automatic recovery attempts fail before the explicit Retry succeeds.

Evidence lives in the parent workspace at playtest/reports/f077-fix. The final registered `web-game` check passes in 50.8 seconds. It proves that a different game opens its setup screen while the old command waits; a failed recovery keeps Retry usable and the new Ready control locked; the retry sends the exact original payload; the target revision stays unchanged; and the source move is saved once. The proof is in `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/app-1MX24l/`.

The full 44-case plugin race suite also passes after the final app changes. In total, 140 selected source tests and the 54 artwork checks pass. The test fixture is corrected to provide required piece/card pools and account for the deliberately failed network attempts and their one connection diagnostic. All other browser errors remain failures.

Staging deployment and saved-account verification pass. Source f1cc5037 is published to isolated preview dpl_53ikro8xtHYp3QMhXmgHpmqZEH2e, then assigned to the staging alias. The artifact check passes. After alias propagation, the public page and service-worker hashes match. The server bundle equals a fresh build of the parent source; consent and all 11 engine archives match the verified baseline. For release comparisons, use a recorded source build, not an arbitrary pre-existing artifact.

The original navigation sequence passes on Chromium and Firefox. The selected friend game stays correct without a recovery reload. Returning to each source shows one submitted move and one computer reply. Firefox also passes the two-tab/prior-offline sequence, with the same source history in both tabs. The phone and WebKit accounts reopen their correct saved games. Root checks the action timestamps, saved snapshots and screenshots. Evidence: parent workspace playtest/reports/f077-fix/verification.md and rounds/02/p1-f077-check.md / p4-f077-check.md.

One source-command 503 in Chromium delays its computer reply until return. It recovers without lost or duplicate moves. This remains a separate observation in the ongoing playtest; its cause is not established. Production, account security and game rules do not change. All four player agents continue round 02 under the existing heartbeat. No stop condition is met.
