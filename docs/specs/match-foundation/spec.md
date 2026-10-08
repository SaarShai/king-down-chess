# Match service and private ChatGPT test

Status: private service live; desktop acceptance in progress

## Purpose

Use the game's existing engine and painted board in a private ChatGPT plugin. Keep match state on the server. Let a player play the computer, invite a friend and resume a game.

## Scope

The existing local preparation includes the match worker, PostgreSQL store, authenticated MCP service, consent page, board resource and checks. It is recorded in the [module guide](../../match-foundation.md) and [setup guide](../../plugin-preparation.md).

A submitted move names its game, expected revision and retry ID. The server checks the user's seat and the actual turn. A transaction saves the move and its receipt together. An identical retry has no second effect. Browser roles cannot write match tables.

The server uses a separate database login with the [reviewed grants](../../../plugin-deploy/runtime-role.sql). The administrator connection applies the schema and grants. It is not the service credential.

## Current ticket

[01 — Check the real account and ChatGPT host](issues/01-external-host-check.md) holds the approved setup and release evidence. The private service, OAuth client and website consent route are live. The test accounts pass a full computer game, two-player moves, seat isolation, automatic updates, host disconnect/reconnect and normal selected-game reopening. [06 — Complete the live checks](issues/06-live-acceptance.md) records passing consent denial and controlled live lost-result retry. It tracks recovery after the released provider revocation fix, immediate full-page reload timing and the remaining real-client checks. The owner defers the actual phone check until desktop checks finish.

## Checks

Run `npm test` with the disposable PostgreSQL database. Run the three named plugin browser checks through `npm run check:browser`. Check the compiled server outside the source tree, worker startup and MCP protocol. Then test the real account and host flows after live setup.

The game rules, new visual work, card mode, ratings, matchmaking, public plugin submission and compute runs are outside this task.
