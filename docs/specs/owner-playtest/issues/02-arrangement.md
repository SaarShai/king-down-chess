# Manual arrangement and online seat choices

Status: resolved
Type: task

The owner's playtest feedback (section 2) asks for the Manual arrangement. The lead's decisions 90 and 91 set the design. Lane S2 adds the board step and the online seat choice. Lane S1 owns the New game controls and invite options.

## Result

Use the same board, reader, marks and finish row. Tap two back-rank pieces to swap. Arrow keys keep focus on the own row. Enter and Space pick and swap. An illegal order stays in the draft. The existing warning rings mark the pieces at fault. The reader names each broken rule. Ready requires a legal order.

The engine already accepts two different rows through FEN. The player changes only the own row. The computer row stays as dealt. An unfinished solo save starts the step again from its legal deal. A marker links the step to that saved position. The shared save fields stay the same, and no illegal draft enters them.

Each online seat uses its own stored king when the setup admits it. Each seat confirms its own order. In Manual, either seat can confirm first. A stale confirmation retries once with the same choice. A confirmed seat keeps its server choice and waits. Random keeps its prior ready order.

## Checks

- `npm test`: 7,000 pass, 5 base failures, 385 existing skips. All 16 new unit cases pass. The failures are the two saved-game type cases, the two old online cards expectations, and the engine-boundary check of `new-game.ts` (`randomBackRank`). The five failing assertions stay unchanged.
- The normal Node phase, selected through `KINGDOWN_TEST_FILE` and `npm test`: 114 pass, no failures or skips.
- `npm run test:docs`: 195 pass, 1 existing skip. Type checking and the production build pass.
- `npm run check:browser next-arrange`: 1 pass. The local stack runs at port 5442 with two browser contexts. The check covers pointer, touch, keyboard, faults, Ready, a saved restart, Undo, Menu, Resign, the first solo turn and reply, stored online kings, both online orders, Black first, the wait, and the first online turn. A 409 must be a stale Ready revision; the check verifies its code and command type.
- Twelve settled captures show legal setup, faulty setup and the online wait at 390x844, 360x640, 844x390 and 1440x900. They are in the lane output folder, `s2-shots/`.
- The local online stack is stopped. No push or deploy occurs.

## Scope notes

`saved.ts` must recognise an unfinished setup with no move, so Continue can open it. The check runner can use an existing local stack. The local stack accepts an assigned page port. These small helper changes keep this lane on port 5442. The New game panel, invite controls, layout and history stay with their lanes.

The browser check creates the Manual invite through the local REST client. The S1 controls and invite wiring are not checked here. The browser proof uses Chromium; WebKit is not checked. The base cards-only save fault still prevents that saved-game case from passing.
