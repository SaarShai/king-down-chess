# Remove the same-device entry

Status: ready-for-agent
Type: task
Blocked by: P1
Spec: [Online friend invitations](../README.md)

## Scope

Own the local entry in `index.html`, `src/new-game.ts` and the related `src/main.ts` paths. Remove the visible two-human start choice. Keep old saves and the hidden URL fixture. Do not change the online setup.

## Acceptance checks

- No menu, New game action or local rematch starts a new two-human game.
- An old two-human save loads and finishes with the same position and players.
- New game from an old save defaults to the computer. Opening online play preserves the local save.
- The two existing literal URL fixtures still work.

## Tests to add

- Extend `src/new-game.test.ts` for old setup decode and new start defaults.
- Add a saved-game browser case. Check the affected mode selectors.
- Run the their-turn and card-detail browser checks that use the URL fixture.
