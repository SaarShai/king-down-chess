# Board: draft play, Undo and the turn button

Status: in-progress

Source: owner ticket 12-submit-turn. Scope: design section 8, ticket 03.

## Plan

1. Merge the whole-turn server and the pure draft model. Keep both test groups.
2. Stage moves on the board. Add Undo and the sword turn button. Keep piece and coin reads available while play waits.
3. Change the browser checks and add the six board journeys. Check the types and all unit tests. Run the browser checks on the M1.
4. Get two independent reviews. Fix confirmed faults. Commit the result.

## Checks

- Journeys 1 to 4, 9 and 10 pass through the UI.
- Each new control has a 48 px target. The bar fits at 320 px. Reduce Motion stops the ready pulse.
- A press sends one actions list. Sent moves do not animate twice. The computer waits for the press.
- Type check, unit tests, plugin-ui and plugin-ui-http pass.

## Scope and taste

- T1a: End turn against the computer; Send your turn against a person. The sword is the only visible button content. Its name and title use these words.
- T2a: Undo, turn button, Menu. J7 already puts Resign and Offer draw in Menu.
- T3a: show the off button on their turn. T4a: one ready pulse; colour only with Reduce Motion.
- T5a: no extra unsent mark. T7a: no leave prompt.
- Ticket 04 owns private state restore, refusal codes and draft recovery. Ticket 05 owns submission copy. Ticket 06 owns the unfinished-turn server check. T6 belongs to ticket 04.

## Evidence

- The server merge has no conflict. The model merge has one test conflict. Both draft tests and time-left tests stay.
- Two independent readers find and check three fixes: the off controls keep their Tab place during Send; a read sheet keeps the opener focus; all saved-turn browser flows press the turn button. The saved-turn read check also covers the state after the server saves the turn. Both readers report no open fault after the fixes.
- `npx tsc --noEmit` passes on the first build and after the review fixes. The local model test waits for the shared test lock. The M1 board test waits for another lane's browser lock.
