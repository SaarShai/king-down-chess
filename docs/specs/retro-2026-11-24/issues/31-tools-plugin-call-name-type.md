# Type the tool name of the plugin page client call

Status: ready-for-agent
Source: the change rehearsals and guard checks of 2026-11-25 ([ticket 10](10-change-rehearsals.md), [ticket 11](11-guards-that-cannot-fail.md), [ticket 12](12-lessons-and-checks.md))

## Problem
- src/plugin/client.ts:53 `call(name: string, ...)`. The board page calls each app tool by a string name. A misspelled or renamed name passes typecheck.
- The guard-tools branch adds `PluginTool` (src/plugin/tool-names.ts) and uses it in `register` (src/plugin/server.ts:66), `BOARD_ID_TOOLS` (src/plugin/client.ts:7) and the receipt NAMES (src/interface/people/receipt.ts:19). The call itself stays `string`.
- A rehearsal with `call(name: PluginTool)` gives 4 type errors: src/account-game/runtime.ts:263 (the queue job name is `string`), src/online/runtime.test.ts:244 (class C), src/plugin/client.test.ts:33 and :73. The job name comes from page state (`Pending.name` in src/account-game/types.ts), so the change goes through the account-game queue types.

## Change
1. Set `call(name: PluginTool, ...)` in src/plugin/client.ts:53.
2. Type the job name in src/account-game (the `Pending.name` field and the queue job) as `PluginTool`. Parse a stored name with one guard function at the point where the page reads saved state, and drop an unknown name there.
3. Type the transport (`GameTransport`, src/account-game/host.ts) name as `PluginTool`.
4. Change the casts in src/plugin/client.test.ts:33 and :73. src/online/runtime.test.ts:244 is class C: ask its owner, or cast at that line.
Product change: type-only, plus one parse guard at the saved-state read (a behaviour change for a bad saved name only).

## Test that fails first
Rename `'kingdown_lobby'` to `'kingdown_lobbies'` in src/plugin/client.test.ts:72. `npm run typecheck` must fail at that line with "not assignable to parameter of type 'PluginTool'". Today it passes.

## Known limits
- The saved-state guard is a behaviour change. It needs a test for an old saved board with an unknown tool name.
- src/online/runtime.test.ts is class C.

## Work record
Not started.
