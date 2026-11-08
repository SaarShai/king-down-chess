# Add a report path in the app

Type: task
Status: open
Blocked by: 11
Parent: [iOS app map](../map.md)
Labels: wayfinder:task

## Question

How does a player report another player from the app? App Review guideline 1.2 requires a report mechanism for an app with user content, and player handles make King Down one (https://developer.apple.com/app-store/review/guidelines/#user-generated-content).

## Context

The server takes reports (`POST /api/reports`, `src/online/safety.ts:20-22`), but no screen sends one. Reports go by email through `public/support.html` today. Blocking works (`src/plugin/screens/board-actions.ts:57`). Details: [store answers](../store-answers.md), section 6, item 2.

## Steps

1. Put a report control where the redesign shows the opponent's handle or the game menu. It calls the existing `POST /api/reports` with a category and an optional note.
2. Until the redesign has that screen, a working in-app link to the report email (`mailto:` or an absolute https URL to `support.html`) is the minimum.
3. Test it in the app on a device.

## Done when

A player can send a report about an opponent from the app, and the report reaches the server or the report mailbox.
