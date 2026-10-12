# 13 · Lobby and friends

Status: in-progress
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

The merger resolves the shared navigation GAP in `7a01f5f8`. The check permits screen entry reads and still refuses writes. This branch merges the local integration tip before the build.

The required results of tickets 07, 10 and both parts of 11 are present. The client background option, poll runner, four route stubs and clipboard permission are present.

Work starts with the friend screen. The plan and checks above still apply.
