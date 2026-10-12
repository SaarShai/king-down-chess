# 13 · Lobby and friends

Status: needs-info
Type: AFK
Size: M
Blocked by: 11

## Scope

- Friend: after create, the code with a Copy button (clipboard permission with a selectable-text fallback) and "Waiting for your friend".
- Join with a code: an input on the Play menu; the features shown before joining, with Join and Decline.
- Random: the open-games list (features, handle, picture, Accept), Find an opponent, the wait ("Looking for an opponent · 0:23", Cancel), "Play the computer while you wait" after 25 s, and "Opponent found. Switch now?" while a computer game runs.
- The poll schedule of research part 01 §6.5 (waiting: 5 s for 2 minutes, then 15 s; none while hidden).

## Acceptance

- Browser check with two personas in the harness: invite and join by code; accept from the list; the wait, the computer offer and the switch.

## Plan and checks

1. Check the base and the shared screen interfaces.
2. Build friend, join, lobby and wait in separate test-first steps.
3. Check the tool flows, poll times, remounts and control bounds. Compare each screen with the approved sample.
4. Run the full tests, page build and all browser checks. Sync the integration tip, test and push.

Use the screen actions through the tool client and the browser fixture as test boundaries. Use a disposable ticket 13 database for database checks.

## Result

The build stops at the base check. No screen code changes.

- The worktree is `claude/mvp-13-lobby`. Its base is integration tip `1a2b0eccfd96e52c1a8307606e0b07eaaa33b463`.
- All 3 required base results are present: ticket 07, ticket 10 and both parts of ticket 11. The shared screen stubs, client background option and poll runner are present. Clipboard write permission and its server test are present.
- GAP: `tools/plugin-ui-check.mjs:118-123` opens Lobby and Join, then requires the tool-call count to stay the same. This ticket requires a Lobby read on entry and a Join preview from the Play code field. Each required read changes that count. Both plugin checks use this assertion.
- The brief permits additions only in this ticket's check block. The conflicting assertion is in the shared shell block. A change there needs the shared check owner's action or a scope change. No screen workaround can keep both the required entry reads and the zero-call assertion.
- Tests, the page build and browser checks do not run. No runtime code changes. Page size and look renders do not apply to this checkpoint.

Open item: change the shared navigation check to allow the Lobby and Join entry reads. Keep its checks that navigation creates no game and that codes stay out of widget state. Then return this ticket to `ready-for-agent`.
