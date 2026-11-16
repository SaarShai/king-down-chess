# Close sign-out writes and stop an old board

Status: ready-for-human

## Scope

Close the removed session under the auth storage lock. Refuse later writes for that session. Revoke its current token. Remove all indexed sign-in verifiers in that operation. Keep a later sign-in and later sign-in flows.

Stop the old page on a session change or a refused save. Use its existing message screen and reload action on both account routes. Remove the unused old deletion-mark branch. Check the saved position on the home mini-board before resume.

Keep the five prior repairs. Add no dependency or migration. Leave the changes uncommitted for the lead.

## Checks

Move the five review cases to source tests. Use the current JSON deletion mark in the new-sign-in case: no released client has the old literal mark. Check each repair with the repair removed in a scratch copy. Keep call signatures and require failed assertions.

Run focused tests, the full suite, docs tests, type checks, the launch build and the next-save browser check. The external report holds logs, counts and limits.

## Result

The storage adapter records closed session IDs under the auth lock and refuses their later writes. Bound removal returns the current token and clears the indexed sign-in verifiers. The revoke reply is checked. API errors 401, 403 and 404 mean the user or session can already be gone. Other errors reach the caller. Local credentials stay removed on every reply.

The old page compares session IDs and refuses the replacement session's token. A failed page or route save calls its existing close path. The page then shows the existing entry message screen with a reload line and retry action. No stale draft moves to the new generation.

The unused literal deletion-mark branch is removed. No migration is added. The home save check reads the pawn position and last-move marks before resume. Its comment states that the old game-type and turn-number labels no longer exist.

All 18 new source tests pass. Each has a failed assertion with a corresponding repair removed in the scratch copy. The 288 focused tests pass. The full suite passes 7,413 tests, with 17 skips. All 114 Node tests pass. Docs tests, type checks, the launch build and the next-save browser check pass. The home check also passes at both other required sizes. All 12 old-page browser cases pass at the three required sizes with local fake services. No console or page error occurs.

The external report holds the test counts, repair-removal logs, browser records and limits. The prior repairs stay in place. The changes stay uncommitted for the lead and independent review.
