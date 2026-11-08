# Muse demo script

Status: draft for the owner. Ticket: [16](issues/16-submission-packet.md), step 5.

This script shows the six tasks of the review demo: start a game, move by words, an ambiguous move, a refused move, resume, and resign. Each scene gives the words to say or type, the tool call that Muse makes, and the shape of the answer. The tool contract is [spec.md](spec.md); the fields are in [tool-docs.md](tool-docs.md).

The answers come from the tool code (`src/muse/tools.ts`, `src/muse/match-words.ts`) and its tests (`src/muse/tools.test.ts`, `src/muse/match-words.test.ts`). The examples are real results of the in-memory fixture on 2026-11-08. The back rank and the moves of the computer change from game to game; the words of King Down do not.

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

- First line: "New game against the computer. You are White. Your move."
- Then: the back rank, the status line, the pieces of each side, the letter grid, the letters of the fairy pieces, and "Revision 0. <n> legal moves. <link>".
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

When you play Black, the first line also gives the first move of the computer: "New game against the computer. You are Black. Computer: White <move>. Your move."

## 2. Move by words

Say: "Pawn to e four."

Muse calls `kingdown_move` with the `game_id`, `expected_revision: 0` and `said: "Pawn to e four."`.

Answer:

- First line: "You: White pawn e2 to e4. Computer: Black <piece> <from> to <to>. Your move." The computer replies in the same call.
- Then the new board, and "Revision 2. <n> legal moves. <link>".
- `structuredContent`: `result: "played"`, `you: ["White pawn e2 to e4."]`, one sentence in `computer`, `your_turn: true`, `revision: 2`.

Example: "You: White pawn e2 to e4. Computer: Black pawn a7 to a5. Your move."

Other words for the same move: "e4", "pawn e4", "echo four", "e 4" (`src/muse/match-words.test.ts`).

## 3. An ambiguous move

Say: "Move a pawn."

Muse calls `kingdown_move` with `said: "Move a pawn."` and the revision of the last result.

Answer:

- First line: "That fits 15 moves. Here are 4. Which one?" (after 1. e4: fifteen pawn moves are legal).
- Then four numbered lines: "1. White pawn a2 to a3.", "2. White pawn a2 to a4.", "3. White pawn b2 to b3.", "4. White pawn b2 to b4."
- `structuredContent`: `result: "choices"`, `choices` (each with `number`, `words` and `move_ids`), and the same `revision`. Nothing plays.

Then say: "Number two."

Muse calls `kingdown_move` with the `move_ids` of choice 2 and the same revision. Answer: "You: White pawn a2 to a4. Computer: ... Your move." (`result: "played"`).

The words never play a guess. When only one move fits a misheard target, the answer asks first: "Only this move fits. Is it the one you mean?" (`src/muse/match-words.test.ts`, "never plays the piece on a misheard target square").

## 4. A refused move

Say: "Pawn from d2 to d5."

Muse calls `kingdown_move` with `said: "Pawn from d2 to d5."`.

Answer:

- First line: "The pawn cannot reach d5." The reason names the rule; it never repeats the words that you said.
- Then "Some legal moves:" and at most six numbered moves.
- `structuredContent`: `result: "refused"`, `reason`, `choices`. Nothing plays, and the revision stays the same.

Words that are not move words get a fixed reason. Say: "Banana." Answer: 'Some words are not move words. Say a piece and a square, for example "knight to f3".'

## 5. Resume

Open a new chat in Muse.

Say: "What King Down games do I have?"

Muse calls `kingdown_games`. Answer:

- First line: "You have 1 game. Your turn against the computer, move 3."
- Then one line for each game: "1. Your turn against the computer, move 3. You play white, level beginner. <link>"
- `structuredContent`: `games`, your turn first. A game against a person shows its turn status and link, with no opponent name and no position.

Say: "Show me the board."

Muse calls `kingdown_view` with no `game_id`: the most urgent game against the computer. Answer:

- First line: "You are White. Move 3. Your move. Last move: Computer: Black pawn h7 to h6."
- Then the pieces, the grid and "Revision 4. <n> legal moves. <link>".
- `structuredContent`: `found: true`, `last_move`, `revision`, `fen`.

Open the link: kingdown.dev shows the same game, because it is a game of the account.

A move with an old revision plays nothing. An example is a resend from the old chat. Answer: "The game changed, so nothing was played. You: White pawn a2 to a4. Computer: Black pawn h7 to h6." (`result: "changed"`, with the current board).

## 6. Resign

Say: "I resign this game."

Muse calls `kingdown_end` with `action: "resign"` and the revision of the last result. The listing marks this tool as destructive.

Answer:

- First line: "Resignation. You lose."
- Then the final board and "Revision <n>. 0 legal moves. <link>".
- `structuredContent`: `result: "ended"`, `status: "finished"`, `ending: "Resignation. You lose."`.

Then say: "What King Down games do I have?" Answer: "You have no unfinished games."

Abort is possible only before each side has played a turn. In a new game, say "Abort this game." Answer: "Game aborted. No result." After the first turns, the answer is "Abort is possible only before each side has played a turn. You can resign." (code `NOT_ALLOWED`).
