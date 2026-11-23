# Repair the swap count and the waiting-Guard draw

Status: resolved

Class C. Owner decision, 2026-11-23. Repair findings 5 and 6 of the engine-faults review.

- A swap that moves a pawn resets the 50-move count (`resetsHalfmove`). This covers a Maester swap and a FirewallB swap, both colours. Rally copies an ordinary move and uses the same check. SkyLift and MorphS never move a pawn. Morph does not take a pawn; MorphP changes a pawn on its square and is not a swap.
- Under a lab Guard reserve, a Guard that may still enter counts as a blocker beside a minor piece, so `G@a7`, `Ba6-b7` from `k7/2K5/B7/8/8/8/8/8 b - - 0 1 g0.1` plays on to mate. With no minor piece, a waiting Guard cannot help to mate, and the material draw stays.
- Engine `5f64e34a…` gets its archive pair. Engine `3643657…` stays. Its old Maester-swap save replays its `draw50`; a new match plays on at count 0.

## Review repair

Finding 7. The plugin replay uses the archived count for a Maester or FirewallB pawn swap and checks the full server FEN. A history with an Ogre pawn push and a Maester swap checks the two count rules together. The web replay uses the same fallback to recover the history and the opponent's last turn.
