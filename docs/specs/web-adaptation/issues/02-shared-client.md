# Find the smallest shared client boundary

Type: research
Status: resolved
Blocked by: 01
Parent: [Web adaptation map](../map.md)
Labels: wayfinder:research

## Question

Which existing modules can serve both account-play clients without a second UI implementation?

## Evidence

- `src/plugin/screens/*.ts` import `../app` for calls, state, and navigation.
- `src/plugin/state.ts`, `queue.ts`, and `poll.ts` hold the mature state, write, and polling rules.
- `src/plugin/screens/board-model.ts` keeps a server view apart from an unsent turn.
- `src/plugin/client.ts` couples transport and saved state to the host.
- `src/main.ts` and `src/screen/play.ts` run local play. The engine uses global rule state.

## Answer

Move the account-play state, queue, screen logic, and content CSS into common modules as each slice needs them. Remove the old definitions when each move is complete. Both clients import the same modules. Keep the game engine, renderer, rule text, and account services where they already belong.

Use two small, explicit boundaries. The game client returns typed views and records. The page host supplies startup, navigation, saved page state, viewport data, and teardown. The plugin implements these with its existing MCP and widget code. The browser implements them with the existing HTTP client, browser history, session storage, and browser lifecycle.

Start with the operations that both clients already need. Do not add a provider registry, dependency container, event bus, new UI framework, or support for a third host. Do not build a fake ChatGPT host in the web page. Keep raw tool envelopes in the plugin adapter.

The local app retains its controller. It runs in a different page lifetime from the account app. This prevents two boards from changing global engine rules together. Shared display helpers can serve both. No replacement of the local save or Workshop is required.

## Sequencing (merged from the session plan)

The moves edit `src/plugin/app.ts`, `client.ts`, `state.ts`, `queue.ts`, `poll.ts` and the screens. The approved later-update branches (`claude/od-home`, `claude/od-board`, `claude/od-look`, `taste/b2-row-preview`, `taste/c5-seat-reveal`) edit the same files. Start the first move only after the PR 61 merge and after those branches land or are parked. One writer edits these files at a time. Each move keeps the plugin checks green (`plugin-ui`, `plugin-ui-http`, the state and queue tests) before the web uses it.

## Limit

This resolves the source seam. The owner still chooses the product entry in [Choose the web play boundary](09-web-play.md). The browser sample confirms that the common UI fits.
