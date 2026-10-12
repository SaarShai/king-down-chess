# 13 · Lobby and friends

Status: resolved
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

The four screens are built. The source-page checks pass: 15 tests. They cover code creation, both copy paths, preview and Decline, Accept, the 25-second offer, default seat choices, Switch, Not now, refused Abort, the 5-to-15-second wait poll, the 15-second lobby poll, hidden pages, teardown, return reads, the second-Find guard, code errors and remount recovery. A long handle stays visible beside Accept and ends with an ellipsis on a phone.

The wait clock stays in place through Play and the computer handoff. Hidden-clock checks use fastForward: runFor repeats painted frames that the check does not need. The local screen comment records the wait-clock rule.

Delegated choices: Find uses last_setup, else DEFAULT_OPTIONS and White. The computer offer uses the open game's options and colour, the saved level or Club, and default ready seat choices. These are delegated choices, not an owner's yes.

GAP: the shared resend path checks the board's bound game for each call other than Create or Find. Accept targets another game. The same path adds game_id to Join, which accepts no game_id. Accept and Join therefore use the client directly and keep their retry through handle Save in page memory. Back clears that retry. A remount needs a new tap on Accept or the code again. No shared client, router or server file changes.

The full suite passes after the setup-screen merge: 153 test files, 2,333 tests, 8 skips, 50 art tests and the type check. The HTML merge keeps ticket 12's setup section and all four ticket 13 sections. The lobby clock first fails its 15-second test, then passes with the runner's live own-turn schedule.

The compiled checks pass: plugin-ui in 177.0 seconds and plugin-ui-http in 143.1 seconds. Both cover the code field and chat path, both copy paths, Decline with no seat taken, Accept, the wait, computer play, Switch and remounts. They check the 5-second and 15-second gaps, hidden pages and the background watch with no board ID. They check 390×844, 1440×900 and 400×900: no sideways scroll, handle ellipsis and controls above the composer zone.

All 24 default browser checks have a passing result. The full run passes 23 of 24; verb-marks first fails with no selected squares after its phone resize, then passes in 2.4 seconds on repeat. The first compiled fixture run fails the shared board's threat-arrow pixel check; the final run passes it. No game check or board-check block changes.

The page build passes: 596,876 HTML bytes and 599,279 JSON bytes through the MCP resource. The old-selector scan finds 17 uses; all remain valid.

Sample comparisons for Play, friend-code, lobby, lobby-wait, opponent-found and handle are in `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-look/13`. Each state has a phone and desktop pair, with the sample on the left. Join and side-panel captures are there too. Code lettering uses the sample's size rule. Names, codes, features, pictures, counts, ages and end dates use the server data.

Kept look differences: the check host has a 24-pixel Remount control and an empty composer zone; the sample has a mock host bar and composer. Each page has the required “‹ Play” head control. GAP: the shared phone frame fills the width; the sample has a 24-pixel right gutter. Ticket 11 owns that frame. The board behind Opponent found uses the shared board screen; ticket 15 owns that screen. This ticket adds no frame or board override.

The old local PostgreSQL cluster lacks its version file and file map. A new disposable cluster runs at `127.0.0.1:55432`, in `/tmp/kingdown-mvp13-pg-8vmlww4u`. It holds `kingdown_mvp13_test`. The full suite and HTTP check pass on that cluster. Other ticket databases need creation there before use.

Open items: the shared handle-retry and phone-frame GAPs above. The four screens need no further change here.
