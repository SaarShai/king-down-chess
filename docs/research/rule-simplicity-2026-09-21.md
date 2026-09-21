# Rule simplicity screen — 2026-09-21

Model jev-1.13.0, 3 runs, controls in every run (simple 0.05/0.04/0.04, beast-7 1.34/1.34/1.31, lifetime 1.03/1.04/1.03).
Score 0-3: 0 = as simple as a chess rule: one shape or one condition; 1 = one extra clause a player keeps in mind; 2 = needs a diagram to learn; 3 = needs a table or list to apply during play. Clauses = deterministic count (separators + exception words).
This rates wording only. It is not a measurement and does not adopt or reject anything. Calibration 2026-09-21: the controls separate (0.05 vs about 1.0-1.3), but several shipped rules score above the 'one capture per lifetime' control, so the screen does not yet tell an owner-rejected rule from an accepted one. Advisory column only until the owner labels these sentences.

| rule | status | simplicity (median) | spread | clauses | text |
|---|---|---|---|---|---|
| catapult | lab | 1.55 | 0.04 | 5 | The catapult captures by lobbing along a rank or file: the first piece in the line must be an enemy, and the catapult takes the first piece beyond it, at any distance, landing on that square. |
| ogre | lab | 1.35 | 0.02 | 6 | The ogre may, instead of moving, shove one adjacent piece one square straight away from itself onto an empty square; kings cannot be shoved. |
| ctl_beast7 | control_cumbersome | 1.34 | 0.03 | 5 | The beast's first capture may be on any of the seven neighbouring squares that are not straight ahead; straight ahead it may move but not capture. |
| archer_shots | shipped | 1.22 | 0.01 | 3 | The archer shoots the four diagonal neighbours and, on each forward diagonal, the square two steps away. |
| squire | proposed | 1.21 | 0.02 | 4 | The squire begins in hand and may be placed on any empty home-rank square instead of moving, including to block a check. |
| reaver | lab | 1.14 | 0.00 | 3 | The reaver moves like a knight and, after a capture, may step one square orthogonally to an empty square as part of the same move. |
| maester_swap | shipped | 1.13 | 0.02 | 2 | The maester may swap places with its king across the home rank; the swap is illegal if the king would be in check. |
| draws | shipped | 1.06 | 0.09 | 2 | Draws by threefold repetition, the fifty-move rule and insufficient material are on. |
| ctl_lifetime | control_cumbersome | 1.03 | 0.01 | 1 | The guard may capture one pawn per lifetime. |
| paladin | shipped | 0.97 | 0.01 | 2 | A paladin that captures anything except a pawn is removed from the board after the capture. |
| beast_chain | shipped | 0.94 | 0.01 | 1 | The beast captures on any adjacent square and may keep capturing from the square it lands on. |
| archer_check | shipped | 0.56 | 0.04 | 2 | The archer may shoot the king, which gives check. |
| one_guard | shipped | 0.47 | 0.02 | 1 | Each army has at most one guard. |
| promotion | shipped | 0.47 | 0.22 | 3 | Pawns promote to queen, rook, bishop or knight. |
| bishops | shipped | 0.14 | 0.05 | 1 | Bishops start on opposite colours. |
| ctl_simple | control_simple | 0.04 | 0.01 | 1 | The archer steps one square in any direction. |
