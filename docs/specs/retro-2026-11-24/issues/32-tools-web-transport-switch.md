# Web transport switch: a case for each app tool

Status: ready-for-agent
Source: the change rehearsals and guard checks of 2026-11-25 ([ticket 10](10-change-rehearsals.md), [ticket 11](11-guards-that-cannot-fail.md), [ticket 12](12-lessons-and-checks.md))

## Problem
- src/online/runtime.ts:56-81: the web app and the iOS app run the plugin board page through this switch over the tool name. The default at :81 throws "The game request is not supported: <name>" at run time.
- src/online/runtime.ts:112-120 (`commandAction`) maps the command tools to an `Action`.
- A new app-visible plugin tool that the board calls passes typecheck and npm test, and then fails in the web app and the iOS app only when a player uses it.
- The file is class C, so the guard-tools branch does not change it.

## Change
Cheapest guard: type the switch value as `PluginTool` (src/plugin/tool-names.ts, on the guard-tools branch) and add an explicit set of the tools that the web never calls (for example `kingdown_resume` if it is plugin-only). Put a `never` check in the default:
`default: { const missed: never = name; throw new Error(...) }`, with the type `Exclude<PluginTool, PluginOnly | CommandTool>`. A new app tool then fails typecheck at src/online/runtime.ts:81 with "Type 'kingdown_x' is not assignable to type 'never'". Add a comment there: "Web transport has no case for this tool: add a case or add it to PLUGIN_ONLY".
Product change: type-only (the throw stays for an unknown name from saved state).

## Test that fails first
Add `'kingdown_fake'` to `PluginTool`. Today `npm run typecheck` fails only in tools/plugin-tool-table.test.ts. After the change it must also fail at src/online/runtime.ts:81.

## Known limits
- Class C: the owner of src/online must approve.
- The never check needs the name typed as `PluginTool` at the entry of the transport (see ticket tools-01).

## Work record
Not started.
