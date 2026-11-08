# Choose the game backend

Type: grilling
Status: resolved
Blocked by: 01, 03
Parent: [Muse connector map](../map.md)
Labels: wayfinder:grilling

## Question

Where do connector games live, and where does the engine run?

## Answer

The existing match service, decided 2026-11-08.

- `GameService` (`src/match/service.ts`) on Postgres is the one write path. Connector games are account games, so they show on kingdown.dev too. That account access is the value beyond the browser.
- The engine runs in Node workers per command (`src/match/index.ts`); saves are replayable and pinned to an engine fingerprint. The rules core has no DOM.
- The computer replies in the same `kingdown_move` call (one `computer` command per action), so a turn needs one tool call.
- Commands record `surface: 'muse'` (migration 0023).
- Rejected: guest games in a signed token (Muse support for tools without sign-in is unknown, and a token in model hands is fragile); an in-process engine (it loses the engine pinning and the worker isolation of the global rules object).
