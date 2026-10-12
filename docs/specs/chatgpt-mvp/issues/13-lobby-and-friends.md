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

The four screens are built. The source-page checks pass: 11 tests, 50 art tests and the type check. They cover code creation, both copy paths, preview and Decline, Accept, the 25-second offer, default seat choices, Switch, Not now, refused Abort, the 5-to-15-second poll schedule, hidden pages, teardown, the second-Find guard, code errors and remount recovery.

The wait clock stays in place through Play and the computer handoff. Hidden-clock checks use fastForward: runFor repeats painted frames that the check does not need. The local screen comment records the wait-clock rule.

Delegated choices: Find uses last_setup, else DEFAULT_OPTIONS and White. The computer offer uses the open game's options and colour, the saved level or Club, and default ready seat choices. These are delegated choices, not an owner's yes.

GAP: the shared call API puts all Join args in pending. A code must stay out of widget state. Join uses the client directly and keeps its retry through handle Save in page memory. A remount needs the code again. No shared client, router or server file changes.

The compiled page, browser checks, size record and sample comparisons remain open.
