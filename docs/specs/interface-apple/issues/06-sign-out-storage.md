# Keep sign-out safe through errors and full storage

Status: ready-for-human

## Scope

Repair the four faults from the two reviews of PR 361. Keep all prior repairs. Leave changes uncommitted for the lead.

The account screen lets the bound client remove credentials. On an error, it shows a short line and keeps the current session. If the client module cannot load, the screen keeps the signed-in state and lets the player retry. It does not report a successful sign-out.

Under the auth lock, removal clears the matched credentials and all stored flow verifier slots before it writes the closure record. The store scan uses Web Storage length and key. It does not trust the flow index. A flow that starts later stays.

Each closed session has a 24-hour expiry. Each closure write removes expired entries. No count limit drops live entries. If the closure write still fails after removal frees space, the client keeps credentials removed, sends the sign-out event and revokes the token. The event and revoke stay; the stored guard for that closure can be absent.

The account screen binds sign-out to the session that it shows at the click, before the cloud-save wait. It removes only that session. After the reply, it clears the screen and stops the cloud save only if the screen still shows that session or no session. A sign-in from another tab during the waits keeps its credentials, its screen and its cloud save. A corrupt closed record is read as empty, so it cannot block a later sign-in.

The first screen and its Sign out target come from the same stored record, so a click before the first auth event never picks a session that another tab stored later. The screen applies an auth event only when it names the session in storage at delivery; a late event for an older session (a queued sign-out message, a refused refresh) changes nothing, and the newer session's own event follows. After a sign-out or deletion reply, the screen clears its state only when neither the screen nor the storage holds another session. Account deletion and Disconnect Muse bind to the confirmed session: each request first checks that the stored session is still that one, deletion signs out only that session, and Disconnect Muse stops its remaining steps when the session changes.

The client delivers an auth event to every caller (the old account screen, the new account host and the old online page) only when the event names the session in storage at delivery. Deletion and the Muse database requests carry the confirmed session's token, so the request cannot pick a session that another tab stored after the check. The old online page passes its entry session to its Delete and Disconnect Muse controls before the browser confirmation. The new page's Sign out removes only the session it shows, and after the reply it resets only when neither the host nor storage holds another session. The Muse grant removal is ticket 07.

The old account screen's Delete dialog keeps the account that was on screen when it opened. If the screen shows another session at confirmation, it refuses and asks the player to open Delete my account again. The client's own sign-out notice uses the same stored-session check as the auth events.

Log out on `/play/` shows the sign-in screen as soon as this device's credentials go, before the server reply, and opens a fresh `/play/` page after the reply. The website check (`tools/web-game-check.mjs`) proves one logout request across repeated input, no private screen before the reply, a signed-out reload, and unchanged saved games and pending receipt.

## Review cases

The source tests keep both full-store cases, the actual click-handler case for the same account and another account, and the two-client flow-index race. The flow case checks that both old callbacks fail. The live-session refresh control and normal draft-save controls add coverage. The two draft cases cover both old routes, ordered saves, a stable generation through refresh, and restore.

## Checks

The first focused run and the scratch baseline each pass 107 tests in four files. The nine mutation runs each fail at runtime assertions. Their union covers all 11 new source tests. Each run keeps call signatures and passes compilation. The scratch runner restores the repaired sources when it ends.

The required final sequence runs focused tests, the full suite with the local test database, docs tests, type checks, the launch build and the next-save browser check. The account browser cases use local fixtures at all three required sizes. The external report holds the final results, logs, counts and limits. The lead owns the commit and independent review.
