# 04 · The split, step 3: the table snapshot

Status: ready-for-agent
Blocked by: 03

## Scope

- [Spec §4](../spec.md#4-part-b-the-game-screen-split), order 4. The DOM writes of `refresh()` move to `renderTable(snapshot)` in `src/ui/table.ts`. Last, because today's `refreshTable` reads back the DOM that `refresh()` writes.
- Files: `src/ui/table.ts`; `src/screen/play.ts`.

## Plan

1. [ ] `src/ui/table.ts`: `renderTable(snapshot)` takes the values that the DOM writes of `refresh()` need (help line text, header text, status text, moves html inputs, captured codes, button states, lesson progress) and writes them; `refresh()` builds the snapshot and calls `renderTable`, then `refreshTable` as today, once. One move-only commit.

## Verification

- [ ] After each commit: `npm run typecheck`, `npm test`, and `end`, `their-turn`, `game-screen`, `turn`, `powers`, `special-moves`, `painted-game`.
- [ ] Before the pull request: the full `npm run check:browser` passes.
- [ ] The build compare and the render compare of ticket 02, zero differences.
- [ ] `wc -l src/main.ts` and the `let` count (Comments).

## Risks

- `refreshTable` reads back DOM text that `renderTable` now writes: the order stays, render then refreshTable, both inside `refresh()`.
- A second `refreshTable` call adds a second icon to each move row: `refresh()` stays the one caller.

## Does not do

- No logic change. No change to the Ceremony (`src/game-end.ts`, `src/ceremony.ts`).

## Comments
