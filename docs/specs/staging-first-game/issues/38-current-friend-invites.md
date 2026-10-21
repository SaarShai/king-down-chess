# Keep friend codes current across hosts

Status: in progress. Parent: U07.

## Plan and acceptance

A code can remain in page memory after another host replaces it. The page can then show and share a code that cannot join. The expiry repair does not detect replacement.

1. Prove that an accepted game read must invalidate a replaced code, including a retained Share handler. Preserve current codes and ignore reads that do not carry invite state.
2. Return a non-secret invite identifier on the existing invitation, waiting-game and inbox paths. Use the existing token hash as this identifier; it cannot redeem an invite. Invalidate page codes only from accepted reads. Run invitation writes through the existing command lane so older reads cannot invalidate their result. Keep renewal explicit.
3. Extend the compiled web and embedded journeys: replace a page code through the other transport, refresh the page, hide the old code, reject its join, then explicitly renew and join the replacement. Preserve the existing expiry and gameplay checks.
4. Run focused source/database tests, both compiled journeys and the exact staging artifact check. Publish only to staging. Verify replacement on one disposable live game and cancel it. Reuse unchanged mechanics, archived engines and account evidence.

No new table, migration, invitation service, polling loop, gameplay rule or artwork is needed. A server read must never renew a code. Second-account and host first-load gates do not block this slice.

## Source checkpoint

Three missing-behavior tests fail before implementation. The repair passes 178 selected tests across invite, lifecycle, app, HTTP and hall modules, plus typecheck and 54 art checks. The source cases cover a same-revision poll, an accepted Play list, a retained Share/Copy action and a pre-renewal read that arrives late. Three selected real PostgreSQL cases pass: replacement identity, seven-day lifetime and competing joiners. The other 23 cases in that file are outside this selection.

The identifier is the existing 256-bit token hash. A database test proves that it cannot redeem or preview the invitation, another account cannot read the game, reads do not rotate the invite, and a new code changes the identifier without changing the game revision. No schema change is needed. The existing command lane discards pre-renewal reads.

Compiled journeys and staging publication remain pending.
