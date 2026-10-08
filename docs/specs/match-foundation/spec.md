# Match service and private ChatGPT test

Status: private service live; acceptance and review repairs complete

## Purpose

Use the game's existing engine and painted board in a private ChatGPT plugin. Keep match state on the server. Let a player play the computer, invite a friend and resume a game.

## Scope

The existing local preparation includes the match worker, PostgreSQL store, authenticated MCP service, consent page, board resource and checks. It is recorded in the [module guide](../../match-foundation.md) and [setup guide](../../plugin-preparation.md).

A submitted move names its game, expected revision and retry ID. The server checks the user's seat and the actual turn. A transaction saves the move and its receipt together. An identical retry has no second effect. Browser roles cannot write match tables.

The server uses a separate database login with the [reviewed grants](../../../plugin-deploy/runtime-role.sql). The administrator connection applies the schema and grants. It is not the service credential.

## Acceptance

[01 — Check the real account and ChatGPT host](issues/01-external-host-check.md) holds the approved setup and release evidence. The private service, OAuth client and website consent route are live. [06 — Complete the live checks](issues/06-live-acceptance.md) records passing desktop solo and two-player play, seats, consent denial, refresh, reconnect, immediate reopening, controlled lost-result recovery and unexpired-token revocation. [11 — Repair phone board controls](issues/11-phone-controls.md) records direct ordinary destination taps, stable background refresh and removal of the plugin Fullscreen control. On October 8, 2026, the owner confirms the repaired board and Computer move work in the iPhone ChatGPT app. Layout and selected-game reopening also pass. The original acceptance tickets are resolved. The later [independent review](issues/12-independent-review.md) identifies new repair work, including unintended board actions and recovery after match deletion. The confirmed cases are repaired and released in [ticket 15](issues/15-review-repairs.md). [Ticket 16](issues/16-board-resource-cache.md) records the cache fix and passing fresh ChatGPT check. Public submission remains outside this task.

## Checks

Run `npm test` with the disposable PostgreSQL database. Run the three named plugin browser checks through `npm run check:browser`. Check the compiled server outside the source tree, worker startup and MCP protocol. Then test the real account and host flows after live setup.

The game rules, new visual work, card mode, ratings, matchmaking, public plugin submission and compute runs are outside this task.
