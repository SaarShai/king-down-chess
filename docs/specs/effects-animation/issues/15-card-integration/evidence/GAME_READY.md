# Game ready

Production PaintedView runs Burn through its real scene clock. The legal rook capture ends on d5. One contact fires.

Viewport: 430 px. Board: White at the bottom.

FEN: `4k3/8/8/3R4/8/8/8/3QK3 b - - 0 1 u1.0`

- [Action](430-white-burn-action.png)
- [Legal result](early-burn-result.png)
- [Production board sample](game.html)

The full capture output is `/tmp/effects-card-game-evidence`. It has 36 completed real card turns, 430 px and 390 px, with both board directions. It covers Burn, Freeze, Firewall, Earth Quake, Morph, Salvation, Mirror and both actions of Haste/Rally. Final scene boards match the legal engine boards. Contact counts match the capture actions. The browser has no page error and no horizontal overflow.

This is a local integration sample. It is not owner approval. Root still merges the shared state layer and plugin drop gates. The sample uses production PaintedView, not the workshop player.
