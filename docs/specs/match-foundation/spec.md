# Match service and private ChatGPT test

Status: local preparation complete; live setup needs approval

## Purpose

Use the game's existing engine and painted board in a private ChatGPT plugin. Keep match state on the server. Let a player play the computer, invite a friend and resume a game.

## Scope

The existing local preparation includes the match worker, PostgreSQL store, authenticated MCP service, consent page, board resource and checks. It is recorded in the [module guide](../../match-foundation.md) and [setup guide](../../plugin-preparation.md).

A submitted move names its game, expected revision and retry ID. The server checks the user's seat and the actual turn. A transaction saves the move and its receipt together. An identical retry has no second effect. Browser roles cannot write match tables.

The server uses a separate database login with the [reviewed grants](../../../plugin-deploy/runtime-role.sql). The administrator connection applies the schema and grants. It is not the service credential.

## Current ticket

[01 — Check the real account and ChatGPT host](issues/01-external-host-check.md) holds the plan, evidence and exact live proposal. The local code is ready for review. The new test service, OAuth access and website consent route need the owner's approval before release work starts.

## Checks

Run `npm test` with the disposable PostgreSQL database. Run the three named plugin browser checks through `npm run check:browser`. Check the compiled server outside the source tree, worker startup and MCP protocol. Then test the real account and host flows after live setup.

The game rules, new visual work, card mode, ratings, matchmaking, public plugin submission and compute runs are outside this task.
