# Plugin tool counters: a behaviour test against the server rule

Status: ready-for-agent
Source: the change rehearsals and guard checks of 2026-11-25 ([ticket 10](10-change-rehearsals.md), [ticket 11](11-guards-that-cannot-fail.md), [ticket 12](12-lessons-and-checks.md))

## Problem
- src/plugin/server.ts:74-75 selects the TOOL_LIMITS counter (src/plugin/service.ts:16) of a tool by its name, with two special cases: `kingdown_find` uses `kingdown_create`, and `kingdown_rematch` uses `commandLimit`.
- The guard-tools branch adds COUNTER in tools/plugin-tool-table.test.ts: a written decision per tool, as `Record<PluginTool, keyof TOOL_LIMITS | 'none'>`. A new tool fails typecheck until it has a decision. The test checks only that a tool whose name is a TOOL_LIMITS key has its own key.
- The test does not call the tools. If the special cases in server.ts:74 change, or a decision such as `kingdown_find: 'kingdown_create'` is false, the test stays green.

## Change
In tools/plugin-tool-table.test.ts, add a test that makes the server with a stub service whose `toolTry` is a spy and whose other methods throw a known `MatchServiceError`. For each tool, call it with the smallest valid arguments (from a Record<PluginTool, args> table, so a new tool fails typecheck), and expect the spy to get COUNTER[name], or no call for 'none'. Failure text: "Plugin tool <name>: src/plugin/server.ts counts <actual>, COUNTER says <expected>".
Product change: none.

## Test that fails first
Change `kingdown_find: 'kingdown_create'` to `'none'` in COUNTER. Today the test stays green. After the change it must fail for kingdown_find.

## Known limits
- The args table holds 29 rows to maintain.
- `kingdown_join` has its own hourly code limit in the service, outside TOOL_LIMITS. This test does not see it.
- tools/plugin-protocol-check.ts (CI only) keeps a second copy of the hint table. A later change can make it import the rows from a shared module.

## Work record
Not started.
