# 03 · Classic chess in the engine: castling and en passant

Status: ready-for-agent
Type: AFK
Size: M
Blocked by: none

## Scope

A rule flag (off by default) that adds the two chess rules King Down leaves out. Only the plugin's Classic setup sets it (spec Q7, Q30, Q31).

- Castling, both sides, by the FIDE rules: king and rook unmoved, the squares between empty, the king not in check and not passing through or landing on an attacked square. The move is a king move of two squares (LAN `e1g1`, `e1c1`).
- En passant, by the FIDE rules: only right after an enemy pawn's two-square advance from its start rank; only by a pawn whose capture is diagonal. With Darkness (pawns take straight ahead) a side takes no en passant; a pawn's March double step away from its start rank gives none.
- Castling rights and the en-passant square in the FEN (fields 3 and 4), in the position hash and in the threefold-repetition test.
- Castling with powers and cards: rights end when the king or the rook leaves its start square for any reason (a move, a swap, a push, Strike, Flight, Sky Lift) or the rook is taken. A piece that comes back (Salvation) has no right.
- The search plays both moves; `describeMove` and the move text name them ("castles short", "takes en passant").
- The match worker accepts the castling and en-passant FEN fields when the flag is on.

## Acceptance

- With the flag on, from the chess start position, perft gives 20, 400, 8,902, 197,281, 4,865,609 (depths 1–5), and the usual test positions ("Kiwipete" and positions 3–5 of the Chess Programming Wiki perft page) give their published numbers at depth 3 or more.
- With the flag off, every existing perft and rules test gives the same numbers.
- Tests for: castling through check refused; rights lost after a king or rook move, a capture of the rook, and a Maester swap; en passant only on the next move; no en passant with Darkness or after March; repetition differs when rights differ.
- `npm test` passes.

## Notes

- The engine says "No castling" at `src/rules/engine.ts:4`; RULES.md §1 lists both as off. Update RULES.md §1 with a "Classic" column.
- Lessons: `docs/lessons/engine-and-tests.md` (fairy pawn movement and repetition, helpers outside the engine after a new move kind).
- Explorer note C §3.
