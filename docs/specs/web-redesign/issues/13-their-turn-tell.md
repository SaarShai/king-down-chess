# 13 · Their turn: the computer thinks while you decide, then the tell

Status: ready-for-agent (the owner approved [the spec](../spec.md) on 2026-10-09)
Blocked by: 02b, 03, 07 (`tools/verify-their-turn.mjs`)

## Scope

- Owner choice: Their turn A, the tell. Decision D15 (the search before the press). Advisor A: fit the tell into the normal move time. Advisor S: no tell delay.
- Demo: `feat-their-turn-check` (`is-tell`, 274–305; "Their portrait breathes").
- Files: `src/main.ts` (`maybeAi`, the press handler; call lines only); `src/game.ts` (the engine wrapper); a new pure `tellPlan` and its test; a pure lift timing module beside `scene.mjs` (spec rule 8); `docs/2d-first-pieces/board/scene.mjs` and `scene.d.mts` (`setLifted`); `src/render/PaintedView.ts` (an optional `tell`); `src/style.css` (the strip breath and ring); `tools/verify-their-turn.mjs` (part 2).

## Plan

1. [ ] The search before the press (D15): when a person's turn against the computer waits (the turn passed; not mid-way), start the computer's search of the new position, with the level's normal time. It is background work: it sets neither `busy` nor `thinking`, and Undo, reading and the press stay on. It plays nothing. Undo, a rule change and a game change stop it and drop its result.
2. [ ] On the press: when the stored search is still the live one (`Engine.think` ids) and the position is the same, use its result (the blunder rule applies then). Else search again. A search that another `think()` call cancelled never answers, so the press never waits on it.
3. [ ] The tell: the piece that will move lifts about 3 px (0.075 of a square) in 120 ms, with a soft glow mark on its square, then the move plays. `tellPlan(capMs, msSincePress)` gives a tell of 240 ms, cut so that the reply comes no later than the level's time after the press, but never under 160 ms.
4. [ ] A power move with no moving piece (Freeze, Ice Wall, Sacrifice, a pass): their king lifts. Each Haste move gets its own tell. A blunder move lifts the piece that really moves.
5. [ ] Their strip: the portrait breathes once when their turn starts; a thin ring draws once and stays; "thinking…" shows after 1 s (ticket 03).
6. [ ] No tell on one device or in a link game. Motion Off: no lift. Reduced motion: the glow mark only.
7. [ ] The game counter (`gen`) guards the tell wait: New game or Rematch during the tell plays no move. (Undo is off after the press.)

## Verification

- [ ] `tellPlan` test: 240 ms with time to spare; never under 160 ms; the total after the press passes the level's time by at most 160 ms, and only when the press came before the search ended.
- [ ] Node test of the lift timing: it lifts and returns to the rest pose.
- [ ] `their-turn` check (part 2), with `?think=`: no reply before the press; Undo works while the search runs and after its result is stored, and a press after that Undo searches again; the reply comes inside the limit after the press; a press before and after the search ends; the tell lifts the mover (a scene state hook); a mid-way Haste turn starts no search.
- [ ] `npm test`, `npm run check:browser` and `plugin-ui` pass. Record the plugin page size. The plugin session knows before the pull request.
- [ ] Rendered sample: one phone video of three replies (a plain move, a shot, a Freeze) and a still of the strip while it thinks, 390×844 and 1440×900. The owner's yes, with the date, in Comments.

## Risks

- The processor works while the player decides (battery on a phone). The search is one search of the level's normal time, and Undo stops it.
- The one engine worker serves this search, the key moments and the second look (20): one search at a time.

## Does not do

- No king shake, no progress ring, no spinner.

## Comments

Phase 2 build: the actual computer mover lifts 3 px for 200 ms after the press.
A new game cancels the wait. Off, reduced motion and moves with no slide have no tell.
Cut: search before the press, tell timing math, portrait breath and ring.
The turn check proves that the lift comes before the reply and clears after it.
`npm test`: 1512 passed, 13 skipped; 50 motion tests pass. Type check passes.
Plugin checks pass. The page stays at 4,292,611 bytes after the phase 2 merge.
Separate review, the full browser suite and the owner's sample review remain.
