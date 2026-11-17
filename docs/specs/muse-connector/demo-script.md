# Muse demo script

Status: draft for the owner. Ticket: [16](issues/16-submission-packet.md), step 5.

This script shows the six tasks of the review demo: start a game, an ambiguous move, a refused move, a move by words, resume, and resign. Each scene gives the words to say or type, the tool call that Muse makes, and the shape of the answer. The tool contract is [spec.md](spec.md); the fields are in [tool-docs.md](tool-docs.md).

The answers come from the tool code (`src/muse/tools.ts`, `src/muse/match-words.ts`) and its tests (`src/muse/tools.test.ts`, `src/muse/match-words.test.ts`). The examples are real results of the in-memory fixture on 2026-11-08.

Two things change from game to game: the back rank (the fairy pieces) and the replies of the computer. The tools have no seed for them. Thus scenes 2 and 3 come before the first move: in the start position each pawn stands on its second rank, and their answers are the same in each game (eight fixture games gave the same text). After the first move, the answers have the shape shown here, and `<...>` marks each part that changes.

Muse can say the answer in its own words. To check a scene, read the tool result: the first line is the sentence for speech, and `structuredContent` gives the fields.

## Before the demo

- On Muse: link King Down in Settings > Connectors and sign in with a review account ([ticket 15](issues/15-review-accounts.md)). Muse asks before the first use of each tool; choose Allow.
- To practise without Muse: run `npm run muse:dev` and connect the MCP Inspector ([docs/MUSE.md](../../MUSE.md)). Send the tool calls of each scene by hand.
- Start with no unfinished game in the account, so that "my game" names the demo game.
- Voice and text use the same words. Voice mode in Muse is not tested yet ([spec.md](spec.md), capability matrix).

## 1. Start a game

Say: "Start a new King Down game against the computer. Beginner level. I play White."

Muse calls `kingdown_new_game` with a new `request_id`, `level: "beginner"` and `colour: "white"`. Each new game is casual, with fairy pieces; `classic: true` gives classic chess pieces.

Answer:

- First line (fixed): "New game against the computer. You are White. Your move."
- Then: "Back rank from a to h: `<eight pieces>`.", "You are White. Move 1. Your move.", the pieces of each side, the letter grid, "Letters: `<the fairy pieces>`.", and "Revision 0. `<n>` legal moves. `<link>`".
- `structuredContent`: `against: "computer"`, `colour: "white"`, `your_turn: true`, `computer: []`, `level: "beginner"`, `revision: 0`, and `back_rank`.

Example:

```text
New game against the computer. You are White. Your move.
Back rank from a to h: knight, queen, ogre, beast, rook, maester, bishop, king.
You are White. Move 1. Your move.
White: king h1; queen b1; rook e1; bishop g1; knight a1; maester f1; beast d1; ogre c1; pawns a2, b2, c2, d2, e2, f2, g2, h2.
Black: king h8; queen b8; rook e8; bishop g8; knight a8; maester f8; beast d8; ogre c8; pawns a7, b7, c7, d7, e7, f7, g7, h7.
8 n q o s r m b k
7 p p p p p p p p
6 . . . . . . . .
5 . . . . . . . .
4 . . . . . . . .
3 . . . . . . . .
2 P P P P P P P P
1 N Q O S R M B K
  a b c d e f g h
Letters: M maester, S beast, O ogre.
Revision 0. 26 legal moves. https://kingdown.dev/g/<game id>
```

When you play Black, the first line also gives the first move of the computer: "New game against the computer. You are Black. Computer: White `<move>`. Your move."

## 2. An ambiguous move

Say: "Move a pawn."

Muse calls `kingdown_move` with the `game_id`, `expected_revision: 0` and `said: "Move a pawn."`.

Answer (fixed):

```text
That fits 16 moves. Here are 4. Which one?
1. White pawn a2 to a3.
2. White pawn a2 to a4.
3. White pawn b2 to b3.
4. White pawn b2 to b4.
```

`structuredContent`: `result: "choices"`, `choices` (each with `number`, `words` and `move_ids`), `revision: 0`. Nothing plays.

To pick a choice, say its number, for example "Number two." Muse then sends the `move_ids` of that choice, and the move plays (`result: "played"`). For a repeatable demo, do not pick here: go to scene 3.

The words never play a guess. When only one move fits a misheard target, the answer asks first: "Only this move fits. Is it the one you mean?" (`src/muse/match-words.test.ts`, "never plays the piece on a misheard target square").

## 3. A refused move

Say: "Pawn from e2 to e5."

Muse calls `kingdown_move` with `expected_revision: 0` and `said: "Pawn from e2 to e5."`.

Answer (fixed):

```text
The pawn cannot reach e5.
Some legal moves:
1. White pawn a2 to a3.
2. White pawn a2 to a4.
3. White pawn b2 to b3.
4. White pawn b2 to b4.
5. White pawn c2 to c3.
6. White pawn c2 to c4.
```

`structuredContent`: `result: "refused"`, `reason: "The pawn cannot reach e5."`, `choices`, `revision: 0`. Nothing plays. The reason names the rule; it never repeats the words that you said.

Words that are not move words get a fixed reason. Say: "Banana." The first line is: 'Some words are not move words. Say a piece and a square, for example "knight to f3".' The six moves after it depend on the back rank.

## 4. Move by words

Say: "Pawn to e four."

Muse calls `kingdown_move` with `expected_revision: 0` and `said: "Pawn to e four."`.

Answer:

- First line: "You: White pawn e2 to e4. Computer: `<the reply of the computer>`. Your move." The computer replies in the same call.
- Then "You are White. Move 2. Your move.", the new board, and "Revision 2. `<n>` legal moves. `<link>`".
- `structuredContent`: `result: "played"`, `you: ["White pawn e2 to e4."]`, one sentence in `computer`, `your_turn: true`, `revision: 2`.

Example: "You: White pawn e2 to e4. Computer: Black pawn a7 to a5. Your move."

Other words for the same move: "pawn e4" (`src/muse/tools.test.ts`), "echo four" and "e 4" (`src/muse/match-words.test.ts`).

## 5. Resume

Open a new chat in Muse.

Say: "What King Down games do I have?"

Muse calls `kingdown_games`. Answer:

- First line: "You have 1 game. Your turn against the computer, move 2."
- Then one line for each game: "1. Your turn against the computer, move 2. You play white, level beginner. `<link>`"
- `structuredContent`: `games`, your turn first. A game against a person shows its turn status and link, with no opponent name and no position.

Say: "Show me the board."

Muse calls `kingdown_view` with no `game_id`: the most urgent game against the computer. Answer:

- First line: "You are White. Move 2. Your move. Last move: Computer: `<the reply of the computer>`."
- Then the pieces, the grid and "Revision 2. `<n>` legal moves. `<link>`".
- `structuredContent`: `found: true`, `last_move`, `revision: 2`, `fen`.

Open the link: kingdown.dev shows the same game, because it is a game of the account.

A move with an old revision plays nothing. An example is the call of scene 4 again, from the old chat. Answer: "The game changed, so nothing was played. You: White pawn e2 to e4. Computer: `<the reply of the computer>`." (`result: "changed"`, with the current board).

## 6. Resign

Say: "I resign this game."

Muse calls `kingdown_end` with `action: "resign"` and `expected_revision: 2`. The listing marks this tool as destructive.

Answer:

- First line (fixed): "Resignation. You lose."
- Then the final board and "Revision 3. 0 legal moves. `<link>`".
- `structuredContent`: `result: "ended"`, `status: "finished"`, `ending: "Resignation. You lose."`.

Then say: "What King Down games do I have?" Answer: "You have no unfinished games."

Abort is possible only before each side has played a turn. In a new game, say "Abort this game." Answer: "Game aborted. No result." After the first turns, the answer is "Abort is possible only before each side has played a turn. You can resign." (code `NOT_ALLOWED`).
