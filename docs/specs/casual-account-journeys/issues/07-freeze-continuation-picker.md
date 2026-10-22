# Refresh ordinary choices after a card step

Type: task
Status: resolved

## Plan and acceptance

1. Reproduce the staging Freeze card followed by an ordinary move through the existing source harness and valid create/setup commands. Use the actual card rules and March king setup; add no fixture endpoint.
2. Trace the picker state after a draft step. Rebuild the Menu picker from current reachable ordinary moves when no piece, power or card is selected. Preserve narrower selected and armed lists.
3. Prove the existing picker offers an ordinary continuation without another piece selection, Freeze stays the first draft action, no move sends early, and one End turn sends both legal actions to the engine.
4. Run only the new focused source regression through `npm test`, then request an independent reader review. The parent owns staging verification and deployment.

## Answer and evidence

`choose()` clears the selected piece, card, power and old choice list after a draft step. `refresh()` computes the new legal moves, but Menu previously reopened that empty old list. The enemy Freeze outline is a mark; this path does not retain that enemy as the selected piece.

Menu now derives current reachable non-pass choices when the board is playable and no piece, card or power is selected. It preserves selected-piece, held-preview, armed-card and armed-power lists. The change does not alter rules or submit a turn.

The regression creates a valid Fairy/cards game through the existing MCP path, selects Mud/March, draws the four-card Freeze/Morph/Vault/Ice Wall pool and uses the actual Freeze card. Before the fix, the reopened picker lacks `e2-e4` (expected one choice, actual zero). After the fix, the same test passes: no early move request, exact staged `!F:a7` and `e2-e4`, then End turn and a full server read retain those first two LANs.

Focused `npm test` evidence: 1 test passes, 133 other plugin-app cases are intentionally excluded by the approved name filter; full typecheck and 54 art checks pass. Logs: `/tmp/kingdown-u05-freeze-red.log` and `/tmp/kingdown-u05-freeze-green.log`. Independent draft-identity review finds no confirmed should-fix. No fixture endpoint, rules change, build, deployment or staging write is part of this slice. The parent owns the next compiled roster check and staging picker proof.
