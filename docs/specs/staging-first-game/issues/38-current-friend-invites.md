# Keep friend codes current across hosts

Status: complete in staging. Parent: U07.

## Plan and acceptance

A code can remain in page memory after another host replaces it. The page can then show and share a code that cannot join. The expiry repair does not detect replacement.

1. Prove that an accepted game read must invalidate a replaced code, including a retained Share handler. Preserve current codes and ignore reads that do not carry invite state.
2. Return a non-secret invite identifier on the existing invitation, waiting-game and inbox paths. Use the existing token hash as this identifier; it cannot redeem an invite. Invalidate page codes only from accepted reads. Run invitation writes through the existing command lane so older reads cannot invalidate their result. Keep renewal explicit.
3. Extend the compiled web and embedded journeys: replace a page code through the other transport, refresh the page, hide the old code, reject its join, then explicitly renew and join the replacement. Preserve the existing expiry and gameplay checks.
4. Run focused source/database tests, both compiled journeys and the exact staging artifact check. Publish only to staging. Verify replacement on one disposable live game and cancel it. Reuse unchanged mechanics, archived engines and account evidence.

No new table, migration, invitation service, polling loop, gameplay rule or artwork is needed. A server read must never renew a code. Second-account and host first-load gates do not block this slice.

## Source checkpoint

Three missing-behavior tests fail before implementation. The final repair passes 238 selected tests across invite, lifecycle, app, plugin HTTP, website API and hall modules, plus typecheck and 54 art checks. The source cases cover a same-revision poll, an accepted Play list, a retained Share/Copy action and a pre-renewal read that arrives late. Three selected real PostgreSQL cases pass: replacement identity, seven-day lifetime and competing joiners. The other 23 cases in that file are outside this selection.

The identifier is the existing 256-bit token hash. A database test proves that it cannot redeem or preview the invitation, another account cannot read the game, reads do not rotate the invite, and a new code changes the identifier without changing the game revision. No schema change is needed. The existing command lane discards pre-renewal reads.

The first compiled run passes embedded HTTP in 254.187 seconds but catches a web-create response that still contains the pre-invite identity. The API now returns the identity of the invitation it just issued. A focused API regression covers that same-response invariant. An unchanged poll also preserves the Copy status. Clean final source `02c2b6a5` passes compiled web in 43.274 seconds and embedded HTTP in 248.935 seconds. The exact artifact check passes. Preview `dpl_DQymf3FYWnrBA5hotuXFKayKCMxj` serves only the staging alias. Engine, runtime and eleven archive bytes match the prior artifact; the 112 accepted mechanics executions remain valid.

## Hosted acceptance

Actual web loads the new artifact without Retry. ChatGPT needs the existing one-time host Retry. On a disposable game, renewal in ChatGPT makes web hide the replaced code and Share/Copy. Renewal in web then makes ChatGPT do the same. Both use their ordinary refresh path. ChatGPT cancels the disposable game; web shows Game aborted, and the same ten original active games remain. No retained game receives a move.

An earlier accessibility-index attempt ends the first disposable game unexpectedly; it is excluded from the proof. The repeat uses the exact controls through nested-frame DOM locators. Use these supported locators for embedded controls, and verify the resulting state before the next action. Do not count ambiguous native clicks as acceptance.

The final review keeps the change in the existing service, command lane and shared client. No new schema, poll loop or gameplay rule is added. Full evidence is in `evidence/staging-current-friend-invites/verification.md` in the parent project. The actual second-account, attached-host first-open, Codex interruption, physical-phone and operator gates remain open. Production is unchanged.
