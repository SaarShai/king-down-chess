# Sides: side choice, keys and faults on the new page

Status: ready-for-human

Branch: the working copy of lane "menus" (`parallel/menus/game` in the design project). No commit, push, pull request or deploy until the owner says so.

## 1. Source

The lead's launch decisions 10 to 12 (design project, `runs/launch/decisions.md`), the stage scope `runs/launch/sides-lane/scope.md` (with the lead's added item about `#guide` and `#you`), and the plan `runs/launch/sides-lane/plan.md`. The lead accepts each proposal of the plan's table "Decisions that need a precise reading" (2026-11-13 21:10).

## 2. The plan

### Goal

On `/next.html` the person can play Dark as well as Light, from the keyboard and with a screen reader, and each fault has one safe next step.

### Scope

- [Issue 01](issues/01-sides-access-errors.md): decision 10 (the side choice, the Dark view, the Dark save and the kept offer), decision 11 (keys and the live region), decision 12 (the four faults) and the hash routes.

### The precise readings (accepted by the lead)

1. The stored side is the accepted choice for the next game. Cancel keeps the stored choices.
2. An empty save with the computer to move (a Dark game before the computer's first move) resumes. An empty Light save gives no Continue, as before.
3. "You move first" shows only when the person moves first. A new Dark game shows the line of the computer's turn.
4. "Offered once" is for each kept state. An offer that the person does not answer can come back. A failed promotion is not an answer.
5. Open asks before it replaces a game that this page can open. When the current game cannot open here, the offer waits. No copy is exchanged or deleted without a word.
6. "The game stays saved" means the last good save stays.
7. The browser owns the first visit with no HTML. This stage tests the case where the HTML arrives and the page code does not.
8. Rematch swaps the sides.

### What does not change for the old screens

- `index.html`, `src/main.ts`, `src/screen/*`, `src/account/*`, the routes, `public/sw.js` and the manifest.
- Shared modules change only by an option that is off by default: `onArtError` in `scene.mjs` and `PaintedView` (no option: the old fallback stays). `PaintedView.flip` exists already; `board-api` only forwards it.
- The save shape: the field set and the order stay. A Dark game writes `white: 'ai', black: 'human'`, which the old page reads with its own code.

### Checks

- `npm test` and `npm run test:docs` pass. No test is removed or weakened; issue 01 names the changed test cases and why.
- `npm run build` passes. `npm run check:browser next-save` passes.
- The browser run of this stage passes in Chromium and WebKit at the size matrix, with the soft case 320×568.

## 3. Verification

[Issue 01](issues/01-sides-access-errors.md), section "Verification".

## 4. Reviews

- Approval: the owner gave the design and build decisions of this project to the lead. The lead accepted the plan's readings on 2026-11-13.
- The new strings have no entry in the copy table of `runs/learning/learning-spec.md`. They are in `src/interface/play/sides.ts` (`sideText`).
- An independent review comes before a pull request.
