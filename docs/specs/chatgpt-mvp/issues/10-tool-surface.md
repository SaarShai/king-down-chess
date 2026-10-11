# 10 · The ChatGPT tools, profile and settings

Status: ready-for-agent
Type: AFK
Size: L
Blocked by: 06, 07, 08

## Scope

- The tool list of the spec's "API contract", on the branch's `src/plugin/server.ts` pattern: app-only actions; model tools with short summaries; the view in `_meta`; only `kingdown_open` carries the page; `kingdown_open` takes `screen` and `game_id`.
- Handle and picture: `kingdown_handle` (the branch's handle rules and the 17 `ICONS`).
- Settings: a server table for each account (symbols-only look, Show threats, the last setup choices); `kingdown_settings` read and write.
- `kingdown_profile`: handle, picture, rating, totals, badges, a history page (ticket 08); `openai/profile` stays.
- Page metadata: `openai/ui` entrypoints `thread` (side panel) and `global` (sidebar), whose tools accept `{}`; available display modes inline and fullscreen; the CSP of ticket 09.
- Tool descriptions start with "Use this when…" and cover "play King Down", "is it my turn?", "join King Down game K7QX2M", "show my King Down profile".
- `DEFAULT_SETUP` goes; `next()` with no game opens the home screen, not a new game.

## Acceptance

- Seam 1 tests through an in-memory MCP client: each tool, its hints and visibility; hidden data never in `content` or `structuredContent`; the opponent's choice hidden until ready.
- `npm run plugin:check:protocol` updated and passing (the tool count changes), `plugin:server:check`, `npm test` pass.

## Notes

- Explorer note F §4, §6, §7; note B §3.3.
