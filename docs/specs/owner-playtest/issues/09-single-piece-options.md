# One copy of a pool kind

Status: resolved

## Scope

Decision 124 item 3 and the lane D brief approve an optional `options.single` list.
Each entry names a selected kind with two copies in the base pool.
That kind contributes one copy to the deal. The pool still needs seven pieces.
With Fairy pieces off, the list must be absent or empty.

Keep old draws, stored options, setup admission and engine identity unchanged.
Keep the shared tool schema optional. Do not change the interface or rules engine.

## Checks

The new server file has 27 cases. The service and engine workers are real; a memory
store replaces the database. Create and Find each refuse unknown kinds, repeats,
kinds with one copy, kinds outside the selected pool, fewer than seven pieces,
nonempty lists with Fairy pieces off, and malformed lists with `INVALID_INPUT`.
All five eligible kinds deal one copy. Empty lists disappear before storage.

The base fixture comes from `59843005f`, before the field exists. Twelve option
sets keep their validation results. Six valid sets keep their exact deals at
seeds 1, 7 and 124. This includes a card deal. The base save loads and plays.
A stored online setup starts, reloads and plays with its original options,
admission, draw and deal. Its engine save matches the base before the first move.

The source engine stays
`sha256:dc67b7208b596c8d3f2fcc55a9999943c54abdbcc372b57b47239a34b0ce401d`.
The compiled worker stays
`sha256:e58d7d379d0dad5ddde1c4e34e984923e856e4b3f702e7beeaee22db62d7a9b4`.
No running-game value or setup admission changes. No migration is needed.

The full `npm test` run has 7,355 passes, 387 skips and one failure. Only the
unchanged disk case in `tools/anim/promote-painted-moves.test.ts` fails. It needs
31 GiB free; the disk has 12.1 GiB at the queue check before the run. The shell
stops before the separate renderer stage. A focused `npm test` runs that stage
with `{docs/2d-first-pieces,src/render/painted}/**/*.test.mjs`: all 114 cases pass.
Both type projects pass `npm run typecheck`. The build passes with 482 modules.
The documentation check passes 197 cases with one existing skip in 19 files.
No browser work runs in this lane. PostgreSQL suites keep their existing skips;
no test database is configured. No interface, dependency or engine file changes.

## Panel contract

`options.single?: string[]` lists selected kinds that contribute one copy.
Its entries can be `R`, `B`, `N`, `A` or `M`. The shared letter helper keeps the
base pool order. Both the minimum count and the deal use it.

The panel adds a kind to `single` when x1 is on and 2nd is off. It removes that
entry when 2nd goes on. It removes the kind from both lists when x1 goes off.
The panel keeps this field in its saved options and game requests.
The shared settings and tool schema accept the field without requiring it.
Ranked keeps its fixed family and refuses a nonempty override.
