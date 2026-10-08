# Complete the live private-plugin checks

Status: claimed

## Scope and plan

On October 8, 2026 the owner asks: "do these. for solo testing - you play against the computer". This covers the remaining solo, account recovery, two-player, mobile and record checks. Use test accounts only.

1. Continue the current live computer game through a terminal result. Exercise Haste, special moves and saved-position recovery through the real board.
2. Test denied consent, reconnect and revoked access. Observe session refresh without reading or recording credentials. Record any flow that needs a user sign-in.
3. Test invitations, seats, turns and account switching when a second test account is available.
4. Check a real mobile client when the owner has a device ready. Keep browser size checks separate.
5. Update stale plugin setup and release records. Record passes, failures and unavailable checks separately.

## Verification

Use visible UI state for real host results. A full game ends only when the board reports a terminal result. A repeated or failed move must not create an extra saved move. Do not substitute local mocks for real account or device results. Run the doc checks for record edits and the required code checks for any fixes.

## Remaining live verification plan

The owner explicitly asks to verify consent denial, provider revocation and controlled lost-response recovery on October 8. Add temporary controls, tagged `VERIFY-live`, for the second test account and its unused solo match only. The consent control calls the supported Supabase grant API for the approved ChatGPT client; it must check the signed-in user's ID before any revocation. Confirm the grant is absent, check the existing ChatGPT connection, then start a new connection and deny consent. Restore the same account after the denial check.

For the lost-response case, arm one deliberate result discard in the real ChatGPT board for solo match `9aa166ad-f978-487d-b80f-c9a3963b2457`. Let the real server save a move, discard its successful reply at the board boundary, then reload and retry the saved command. Compare the saved revision and command receipt before and after retry. This tests the real host with an injected lost result; it does not claim a physical network interruption. Remove all temporary controls after the checks and release the clean build.

PR 17 adds the scoped controls and merges as `f80cca6adf8b4749c49e20852cb3a2a210e4aed4`. All 1,391 tests, 42 artwork checks, hosted jobs and three browser checks pass. Two release attempts stop on five-second Git-hook test timeouts while other desktop work uses substantial CPU. The third runs the same checks with the supported `VITEST_MAX_WORKERS=2` setting; all checks pass without changing assertions or time limits. Deployment `dpl_5ULGVYtByYCe8Zi2mMXtEGDuoedn` is live. Log: `/tmp/kingdown-live-verification-release-limited.log`.

The live solo-match baseline is revision 0 with no command receipts. Read-only database checks use only the restricted runtime role and filter by both that match and the second test user's ID. They print the revision, FEN, receipt count and a receipt digest, never credentials.

The fresh ChatGPT board arms the one-result discard and plays ordinary e2-e4. It reports the deliberate lost result and offers Retry, while its visible position remains White to move at move 1. A separate read-only database check shows revision 1, one receipt and the pawn on e4 with Black to move. The receipt digest is `635204b367fe39fd891e8abf89d95b98ab653500ba895c6a1a132aaa14d82216` before retry.

After full chat reload, the board restores Black to move at move 1 and retains Retry. Retry clears the pending command. The read-only receipt after retry is byte-identical to the committed receipt: revision 1, one command and the same digest. Controlled lost-result recovery passes in the real ChatGPT host.

The provider revoke control succeeds and the grant list confirms the approved client is absent. The existing ChatGPT connection still reloads and makes a computer move. A read-only check proves revision 2 and two commands. This is a failure, owned by [ticket 10](10-revoked-provider-session.md). Keep that revoked connection in place for the repaired-server check.

A fresh Connect another account flow then presents real consent for the second test account, the approved client and `openid email offline_access`. Deny returns to ChatGPT with `access_denied - User denied the request`. No new connection is approved. Consent denial passes.

## Solo evidence

Continue the existing test-account game in Chrome on macOS, in the real ChatGPT host, from White's fifth move. The assistant plays every player move through the visible board and requests each computer action. The game ends after Black's 23rd move with "Black wins · Checkmate".

- Haste: d4-d5 keeps White to move at move 5; d5-d6 completes the extra action and changes the turn to Black. Both complete and pass options are visible for the second action; this game uses complete.
- Ogre: h1 shoves the pawn from g2 to f3 and steps to g2. The rendered position matches the choice.
- Archer: d4 shoots the pawn on b6 without moving. The pawn disappears, the Archer stays on d4 and the turn changes.
- Check: only legal king escape choices are offered. A piece with no legal moves offers no move button. The computer's extra action at move 10 keeps Black to move until its next action completes.
- Recovery: reload the full chat immediately after requesting Black's move 14. All boards restore White in check at move 15 with one reply saved. This covers a reload during a request, not a controlled lost-response retry.
- Terminal: select the king after checkmate; no move choices appear and no computer button remains. Reload the full chat; all three views still report Black wins by checkmate.

The owner has a second test account available and wants mobile testing later, after desktop checks. The second account is now connected. Use only the two dedicated test connections.

## Account checks

Connect another account reuses the first consent login and returns "This account is already connected" twice. The consent page follows Supabase's existing-grant redirect before it shows the account switch. [Ticket 07](07-consent-account-choice.md) fixes this cause and owns its release check. Two-player testing waits for the second sign-in through that path.

Supabase audit logs show `token_refreshed` for the dedicated test user at `2026-10-08T09:11:12.961015549Z`, with user agent `openai-connectors-oauth/1.0`. The computer game continues to its terminal result after this event. This is real ChatGPT session-refresh evidence. The paired `token_revoked` event occurs in the same refresh request; it is not evidence of the separate revoked-access case. A browser-session refresh appears at 09:16:59 UTC and is kept separate from the ChatGPT event.

The board's Games menu creates a friend game and shows "Waiting for your friend. Share an invitation." A chat request for that new friend game first reopens the completed solo game. [Ticket 08](08-explicit-new-game.md) fixes the launch-tool cause.

Both fixes are released and checked in the real ChatGPT host. The fixed launch tool creates a new friend game from an explicit chat request. Its board remains at the starting position after a full chat reload, waiting for the second player. No invitation is issued before the second account is ready.

The authorization page left open for the owner reports an unavailable or expired request. A fresh request from ChatGPT works and shows the second account. ChatGPT then lists both test connections. The consent page completes before the attempted Deny click, so this is not a denial pass. The second account opens a separate solo game in the chat Show Playable Board (`https://chatgpt.com/c/6ac76ff9-d468-83eb-864c-1b8410fef2b2`).

## Two-player evidence

The second account cannot open friend match `0c6d9cdd-ae43-4c66-a343-420656581959` before joining. King Down returns "You do not have a seat in this match". After it accepts the invitation through the board, it plays Black. Its board has Black at the bottom. The first account keeps White, and its waiting board updates automatically when Black joins.

White plays e2-e4 and Black plays e7-e5. Both boards update without Reload. White then plays d2-d4 with Haste. Both boards retain White's turn for the extra action. White passes that action, then Black plays e5-d4 and captures the pawn. Both boards show White to move at move 3. Selecting Black's pawn during White's turn offers no moves.

Reloading the second chat returns its board to the original solo game. The friend game is intact. Ticket 09 owns the selected-game recovery fix and release check.

PR 16 releases the saved-state writer repair. A fresh inline board restores the joined Black seat at move 4 after a normal chat reload; the White account also restores move 4. The temporary diagnostics are removed. An immediate full-page reload, within a fraction of a second after Join, can still precede the host's selection save. Ticket 09 keeps this timing boundary open; it does not lose server moves.

Disconnecting the second account in ChatGPT removes its connection and blocks a read from its existing board with "MCP Resource not found". A fresh connection restores the same second account without another provider sign-in. The existing provider consent grant is still present, so this tests host disconnect/reconnect, not provider grant revocation or denied consent.

A fresh tool call after reconnection opens the same friend match at move 3 with the second account still in Black's seat. White plays e4-e5 and the reconnected Black account replies c7-c6. Both boards reach White to move at move 4.

## Handoff

Before the provider revoke test, both test accounts are connected, play after host reconnection passes, and normal selected-game reopening passes on the released board. The immediate full-page reload boundary remains in ticket 09. Consent denial and controlled live lost-result retry now pass. PR 18 fixes and releases the provider-session check. The revoked connection fails after release and the first account still works. The owner restores the second connection, and a fresh ChatGPT board opens the same solo game at revision 2 with no error. Ticket 10 retains the immediate fresh-token live revoke cycle. Do not use account deletion, a ban or a password reset to stand in for this check.

The fixture and compiled HTTP/PostgreSQL board checks drop a reply after a saved move, remount the board and retry the same command ID. The saved revision remains 1. This passes locally. The controlled lost-result check above now also passes in the real ChatGPT host; the completed live reload-during-request check is separate. The actual phone check stays deferred at the owner's request.

Use the existing test chat, Start King Down game (`https://chatgpt.com/c/6ac75478-8988-83eb-81a1-96d5040d8320`), and private plugin `plugin_asdk_app_6ac737b6924c8191b0c77b5f5a2981a4`. The first test account is still the primary connection. Restart an expired authorization request from Connect another account; do not reuse an expired consent URL.
