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

## Solo evidence

Continue the existing test-account game in Chrome on macOS, in the real ChatGPT host, from White's fifth move. The assistant plays every player move through the visible board and requests each computer action. The game ends after Black's 23rd move with "Black wins · Checkmate".

- Haste: d4-d5 keeps White to move at move 5; d5-d6 completes the extra action and changes the turn to Black. Both complete and pass options are visible for the second action; this game uses complete.
- Ogre: h1 shoves the pawn from g2 to f3 and steps to g2. The rendered position matches the choice.
- Archer: d4 shoots the pawn on b6 without moving. The pawn disappears, the Archer stays on d4 and the turn changes.
- Check: only legal king escape choices are offered. A piece with no legal moves offers no move button. The computer's extra action at move 10 keeps Black to move until its next action completes.
- Recovery: reload the full chat immediately after requesting Black's move 14. All boards restore White in check at move 15 with one reply saved. This covers a reload during a request, not a controlled lost-response retry.
- Terminal: select the king after checkmate; no move choices appear and no computer button remains. Reload the full chat; all three views still report Black wins by checkmate.

The owner has a second test account available and wants mobile testing later, after desktop checks. The second account has not yet signed in. The current account is the previously confirmed dedicated test account.

## Account checks

Connect another account reuses the first consent login and returns "This account is already connected" twice. The consent page follows Supabase's existing-grant redirect before it shows the account switch. [Ticket 07](07-consent-account-choice.md) fixes this cause and owns its release check. Two-player testing waits for the second sign-in through that path.

Supabase audit logs show `token_refreshed` for the dedicated test user at `2026-10-08T09:11:12.961015549Z`, with user agent `openai-connectors-oauth/1.0`. The computer game continues to its terminal result after this event. This is real ChatGPT session-refresh evidence. The paired `token_revoked` event occurs in the same refresh request; it is not evidence of the separate revoked-access case. A browser-session refresh appears at 09:16:59 UTC and is kept separate from the ChatGPT event.

The board's Games menu creates a friend game and shows "Waiting for your friend. Share an invitation." A chat request for that new friend game first reopens the completed solo game. [Ticket 08](08-explicit-new-game.md) fixes the launch-tool cause.

Both fixes are released and checked in the real ChatGPT host. The fixed launch tool creates a new friend game from an explicit chat request. Its board remains at the starting position after a full chat reload, waiting for the second player. No invitation is issued before the second account is ready.

## Handoff

The owner has not yet completed the second-account sign-in. Chrome has an Authorize King Down tab at the sign-in screen. Sign in with the second test account and stop at the account choice before Continue; the next check denies consent, then reconnects. Continue with account access, friend joining and both players' moves, then disconnect/reconnect and revoked access. Keep a controlled lost-response retry separate from the completed reload-during-request check. The actual phone check stays deferred at the owner's request.

Use the existing test chat, Start King Down game (`https://chatgpt.com/c/6ac75478-8988-83eb-81a1-96d5040d8320`), and private plugin `plugin_asdk_app_6ac737b6924c8191b0c77b5f5a2981a4`. The first test account is still the primary connection. Restart an expired authorization request from Connect another account; do not reuse an expired consent URL.
