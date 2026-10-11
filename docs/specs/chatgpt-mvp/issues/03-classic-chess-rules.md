# 03 · Classic chess in the engine: castling and en passant

Status: resolved
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

## Result

- The rule flag is `classicChess` (`src/rules/rules.ts`, off by default). Castling is a king move of two squares with the rook's step in `Move.castle`, written `O-O` / `O-O-O` (review finding 1); en passant is a pawn move whose capture square is not its landing square. `Position.castle` and `Position.ep` hold the state; FEN fields 3 and 4 carry it only when the flag is on. The search keeps both in its own make/unmake and in the incremental key (two new key groups appended to `src/ai/zobrist.ts`, so no old key moves). RULES.md §1 has the Classic column and the rules.
- Perft with the flag on: start 20, 400, 8,902, 197,281, 4,865,609; Kiwipete to depth 4 (4,085,603); positions 3 (depth 5, 674,624), 4 (depth 4, 422,333) and 5 (depth 4, 2,103,487). All match the published counts.
- `src/rules/classic-chess.test.ts`: 21 tests (perft, flag off, castling through check, rights lost by king, rook, capture and Maester swap, a frozen rook, en passant only on the next move, none with Darkness or after March, keys differ by rights and by the en-passant square, the search's legal list and keys equal the engine's, the search plays en passant, the move text). All pass.
- `npm test` on the branch: 2,018 passed, 3 timed out (a fixed-depth search test, a Darkness random-board test, a judge random-design test). Load average was 30 to 36 from other agents; an A/B timing of the timed-out search and of perft shows no slowdown (140 ms against 137 to 160 ms). The base had the same Darkness timeout under load.
- After the merge of the `claude/chatgpt-mvp` tip: `npm test` passes, 2,033 vitest tests (56 skipped, no database URL) and 50 node tests; the three timeouts did not come back.
- `npm run plugin:build` asked for a new engine: `engines/797aeca0….mjs` and its save fixture are committed. The merger rebuilds after other engine changes land.

Open items:
- Ticket 05: the match setup has no classic field yet. The worker's FEN check already accepts fields 3 and 4 when `RULES.classicChess` is on; 05 maps its flag and adds the worker test (a classic game castles and replays).
- The web board's tap path (`clickPath`) asks for two taps on en passant (the victim, then the landing square). The plugin board accepts either square. The board ticket (15) may want one tap and a rook slide in the castling animation.

## Review

A reader that did not write the diff reviewed `634f5690...claude/mvp-03-classic`. The merger checked each finding against the code and fixed it in the integration branch after the merge. Each new test failed before its fix (findings 1 to 3), or is a missing test that passes on the code (findings 4 and 6).

1. Must-fix: with a Mercy or Darkness king, castling and the king's two-square step both printed `Ke1-g1`. Correct: 31 legal moves gave 29 move texts. Effects: the worker refused either move as ambiguous, and `Game.playLan` (autosave restore) took the king step and left the rook. Fix: `lanOf` writes castling as `O-O` and `O-O-O` (`src/rules/setup.ts`). The worker, `Game.playLan` and the search all match moves through `toLan`, so they agree. Tests (`src/rules/classic-chess.test.ts`, "castling has its own move text"): for a Mercy king and a Darkness king, the move texts are unique and hold `O-O`, `O-O-O` and `Ke1-g1`; `O-O` moves the rook and `Ke1-g1` does not; the search lists the same texts; `Game.playLan(['O-O', …])` castles. The older tests now name castling `O-O` / `O-O-O`.
2. Should-fix: `rightsAfter` ended a right for any move with `from` or `to` on a king or rook square, also when nothing left it. Correct: a Death Touch shot from e1 and an Earth Quake centred on e1 or h1 ended the rights. Fix: a move in place (`to === from`, no swap and no Morph, or an Earth Quake with its `pushes`) ends a right only through its captures and pushes. A Morph of the rook on h1 still ends the right. Tests: "a Death Touch shot from the king square and an Earth Quake on it keep the rights", "a morph of the rook on its square ends that right".
3. Should-fix: the lab could set `classicChess: true`, but the sim replay (`parseLan`) rebuilds a move from its text alone. Correct. Fix: `RULE_DIMENSIONS.classicChess.allowed` is `[false]` in `src/balance/schema.ts` until the sim replay supports it. Test: `src/balance/schema.test.ts`, "refuses classicChess in a lab rule patch".
4. Should-fix: no worker test for the FEN fields. Partly fixed. The flag-off test is in `src/match/match.test.ts` ("refuses the chess castling and en-passant FEN fields without the classic flag"). The flag-on test cannot run yet: `MatchSetup` has no field that sets `classicChess` in the worker (ticket 05 adds it). Ticket 05's acceptance now names the flag-on test (a FEN with `KQkq` and an en-passant square is accepted) and a castling test with a Mercy king.
5. Nit: the en-passant square stays when the beside pawn cannot take (pinned, frozen, the victim in Holy Light), so threefold repetition can come one occurrence later than FIDE 9.2. Correct. Choice: keep the simple rule; `docs/RULES.md` §1 records it ("Repetition and the en-passant square").
6. Nit: no test played a position three times. Added: "threefold repetition counts a position only with the same rights". After the kings walk out and back, the position after 1. e4 e5 returns with no rights; the first knight loop does not draw, the second does.

Perft numbers stay as they were: the start position, Kiwipete and positions 3 to 5 pass at the same depths and counts.
