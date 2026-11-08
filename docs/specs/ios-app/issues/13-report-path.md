# Add a report path in the app

Type: task
Status: claimed
Blocked by: none
Parent: [iOS app map](../map.md)
Labels: wayfinder:task

## Question

How does a player report another player from the app? App Review guideline 1.2 requires a report mechanism for an app with user content, and player handles make King Down one (https://developer.apple.com/app-store/review/guidelines/#user-generated-content).

## Context

The server takes reports (`POST /api/reports`, `src/online/safety.ts:20-22`), and the transport already sends one (`src/online/runtime.ts:78` dispatches `kingdown_report` to `src/online/client.ts:91`), but no screen calls it. Use that transport as the seam. Reports go by email through `public/support.html` today. Blocking works (`src/plugin/screens/board-actions.ts:57`). Details: [store answers](../store-answers.md), section 6, item 2.

## Steps

1. Put a report control where the redesign shows the opponent's handle or the game menu. It calls the existing `POST /api/reports` with a category and an optional note.
2. Until the redesign has that screen, a working in-app link to the report email (`mailto:` or an absolute https URL to `support.html`) is the minimum.
3. Test it in the app on a device.

## Progress

2026-11-08:

- Steps 1 and 2 (branch `ios-report`): "Report player" is next to "Block player" in the board Menu, the seat Menu and the end card, with the same guard: a human opponent (not solo, the computer or a deleted account). It opens a board sheet with a required Reason (one label for each of the seven server categories), an optional Note (up to 1000 characters), Cancel and Send. Send calls `kingdown_report`, which sends `POST /api/reports` with the game id: target `handle` for "Offensive handle", `player` for the other reasons. The result is "Report sent. Reference <id>."; an error shows in an alert and keeps the fields. The fields use 16 px text. `support.html` names the menu row. Message reports and the intimate-image flag are left out.
- Tests: `src/plugin/screens/board-model.test.ts` (the guard, the labels, the payloads, the reply, the error); the plugin-ui browser check, board Menu (a refused send keeps the fields and shows the alert, then a send to the fixture server shows the reference; Shift+Tab goes from Note back to Reason); typecheck.
- Independent review of `72b050e7b`: ship, no must-fix. `6516a24f2` applies its should-fix items: the textarea in the sheet's Tab trap, the browser check, the alert stays in the accessibility tree, the reference only when the reply has an id, and store-answers item 2 marked fixed. Accepted risk: when a send times out after the server stored the report, a second send stores a duplicate.
- Step 3, open: at 13:44 UTC the simulator app (staging build of this branch) showed "Log in": it had lost the P3 sign-in from the ticket 07 test, but its local game was still there. An agent cannot sign in a test account (it has no password), so the in-app test waits: the owner signs P3 in again in the simulator, or tests Report in the next TestFlight build.

## Done when

A player can send a report about an opponent from the app, and the report reaches the server or the report mailbox.
