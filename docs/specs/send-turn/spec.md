# W7: Send your turn, with Undo (the plugin board)

Owner note (decisions file, W7): "there should be a button for 'submitting' a turn once the player finishes. once the player clicks it, they cannot do any actions on the board (they can still touch pieces for information)". Owner go: "w7 ... build."

Code base: `claude/fault-round-2` at `ec044593` (line numbers below). Build base: `claude/owner-decisions` at `d6bad99e`. That branch has fault-round-2, layout B (Back in the opponent row) and the stone controls. Its `board.ts` lines are about 13 to 50 lines lower than the numbers here.

## 1. Decision

- **Base: design A.** It is the smaller correct design (about 150 source lines, against 300 to 450 for design B).
- **The draft lives in the widget only.** A tap moves a piece on the local engine. No tap sends a command.
- **One press sends the whole turn.** `kingdown_move` gets an `actions` list (1 to 4 LANs). The server already applies a list all or nothing.
- **Keep `lan`.** Old boards and 87 test calls still work.
- **Keep the draft across a new revision when the turn start is the same** (same FEN, still your turn, game in play). A draw offer or a "Good luck" preset does not erase a Haste turn.
- **Reuse the website turn rule** (`src/turn.ts`, spec `docs/specs/web-redesign/spec.md` §4.1 to §4.5). A staged end waits for the press, and Undo can take it back. The website spec already decides this, so it is not an owner question.

**Taken from design B:**

1. Fix the in-memory fixture. It applies a turn one action at a time with no rollback (`tools/plugin-protocol-fixture.ts:85`). Browser tests can hide a partial commit.
2. Add a server check that refuses an unfinished human turn. It is a separate, later ticket (06), after the new board ships.
3. Split "can read" from "can play". A tap reads a piece also while a send waits. This is the owner's rule.
4. Keep three facts apart: the server view, the draft, and the pending command. Never write draft values into `view`.
5. Find the end of a turn with the engine (`turnOf`), never with an action count.
6. "Their move" reads the server turn (`view.turn`), not the draft position.

**Not taken from design B, with the reasons:**

| B item | Why not |
|---|---|
| Remove `lan` | 87 calls in `tools/` and `src/plugin` tests use it. Checklist row 55 keeps old tool contracts working. |
| Draft key `game_id` + `base_revision` | `game_id` in widget state breaks commit `13719c65` ("Keep private IDs out of pending widget state"). A revision key erases the draft on a draw offer or a preset (`service.ts:292-296`). |
| Clear the draft on every new revision | Same reason. A friend's "Good luck" at the start of your turn erases your Haste turn. |
| Draft on `Game.play`/`Game.undo` from the full history | Heavier. Only the repetition draw needs the history, and the server finds it at the press. |
| Change the global button pass (`app.ts:58-61`) | Not necessary. The new controls use `aria-disabled` and handler guards. The board moves the focus before the busy lock. |
| Release-notes change | Version 1.0.0 is the first release. Nothing to change. |

**Not taken from design A:** the owner check on a game-ending move (the website spec §4.2 decides it), the Z key as a taste item (website rule §4.4), and Undo motion as a taste item (Undo snaps, as on the website).

## 2. What one turn holds

The engine decides when a turn ends (`holdsTurn`, `engine.ts:412`; applied at `engine.ts:1047`).

| First action | Turn goes on? | What ends the turn |
|---|---|---|
| Ordinary move, capture, promotion, castle, guard drop, Beast chain (one action, all captures in it) | No | That action |
| Power or card that uses the turn (Strike, Flight, Sacrifice, March, Leap, Growth, Morph, Spawn, ...) | No | That action |
| Freeze, Ice Wall, Firewall, Rescue with `markFree` (on in the powers set, `rules.ts:815`; off by default, `rules.ts:718`) | Yes | The ordinary move, or the pass `--` |
| Haste, Rage, RageB first move | Yes | The same piece moves again, or the pass |
| Rally first move | Yes | Another piece makes a quiet move, or the pass |
| GrowthB draw | Yes | The ordinary move, or the pass |
| Lab rule `secondPlayerDoubleFirstTurn` (off by default) | Yes, no pass | Black's second move |

- After a turn goes on, the engine offers no second power (`engine.ts:1969`, `1974-1975`).
- The pass is legal in each mid-way state (`engine.ts:1818`, `1833`, `1975`).
- A normal turn has 1 or 2 actions. The protocol allows 4 (`protocol.ts:24`).
- The plugin deal includes Freeze, Ice Wall, Haste and Rally (`src/match/setup.ts:13-16`).

## 3. Data flow

**Three facts. Keep them apart.**

| Fact | Where | Changes when |
|---|---|---|
| Server view `view` | `board.ts` (`view`), from each read and reply | The server sends a new view |
| Draft `steps: BoardMove[]` | `board.ts` memory. Copy in private widget state: `draft: { game_tag, fen, lans }` | A tap, Undo, a send, a redraw |
| Pending command | `pending` in `app.ts` (exists) | The press, until the reply |

- The turn start (base) is `view.fen` while `view.action === 'ready'` and `view.status === 'playing'`.
- The board position `pos` is `steps.at(-1)?.pos ?? fromFen(view.fen)`.
- `game_tag` is the first 8 characters of the game ID, as `pending` uses (`client.ts:20`). The full game ID never goes into widget state.

**Flow.**

1. **Tap.** `choose(lan)` checks the LAN. At 0 steps it uses the server's legal list (`board.ts:116`, `279-280`). After that it uses the local engine. It applies the step, animates it, pushes it to `steps`, saves the draft, and redraws. It sends nothing.
2. **Undo.** It removes the last step. `pos` becomes that step's `pre`. Card uses, marks and the coin state come back, because they are part of `Position` (`engine.ts:1049-1056`). The board snaps. The draft is saved.
3. **Press (Send).** The board freezes `actions = sendActions(steps, pos)`: the LANs, plus `--` when the turn is mid-way and does not wait (the `pressPass` rule, `turn.ts:108-110`). It moves the focus to the board, then calls `kingdown_move` with `{ game_id, command_id, expected_revision: view.revision, actions }` on the retain path (`app.ts:102-105`). `pending` keeps `actions`, because `client.ts:19` removes only `game_id`, `code` and `handle`.
4. **Reply.** The view comes back with the new revision. `replayLans` finds the sent steps. The board does not animate them again: it skips each replay step whose position equals the sent step at the same index. This replaces the single `optimistic` step (`board.ts:62`, `274`, `286`, `289`). The draft is cleared. In a solo game the computer then plays (`board.ts:93` reads the server turn).
5. **Redraw** (a poll, a read or a reply with a new revision). If the game tag, the base FEN, `action: 'ready'` and `status: 'playing'` all agree, the board applies the steps again with no animation. If not, it drops the draft. A redraw with the same revision returns early and keeps the draft (`board.ts:270`).
6. **Mount.** On the first read of the selected game, the board restores the saved draft by the same test as step 5. Each LAN must also be legal on replay. If not, it drops the draft.

## 4. Server and tool contract changes

**`kingdown_move` (`src/plugin/server.ts:162`).**

```ts
{ ...command, lan: z.string().min(1).max(120).optional(),
  actions: z.array(z.string().min(1).max(120)).min(1).max(4).optional() }
// run: exactly one of lan and actions, else MatchServiceError('INVALID_INPUT', 400, 'Send lan or actions')
//      play(args, { type: 'turn', actions: actions ?? [lan] })
```

- **Description:** "Play the player's whole turn: one to four exact legal moves, in order, all or nothing. Retry with the same command ID and the same input."
- **Hints stay the same:** visibility `app`, `readOnlyHint` false, `destructiveHint` false, `idempotentHint` true, `openWorldHint` false. The tool table in `tools/plugin-protocol-check.ts:10-16` does not change.
- **No change** to `actionSchema`, the store, the database or the receipts. A retry with the same ID and the same `actions` gets the saved result (store receipts compare the full payload).
- **The model never moves.** `kingdown_move` is app-only. `listing.md` and the skill stay true. Resign, abort and draw stay one complete action each. They read a fresh revision (`server.ts:103-104`), so they win against a draft.
- **Deploy order:** server first (it only adds a field), then the board.

**Fixture (`tools/plugin-protocol-fixture.ts:81-86`).** Make a turn all or nothing, as the service does:

- Before each action, refuse it when the game is not in play or the mover changed (`service.ts:91`).
- Keep the engine save before the list. On any refusal, load the save back, then fail with `INVALID_MOVE`.

**Later check (ticket 06), in `play()` (`service.ts:82-100`).** After the list, a human `turn` must end the game or pass the turn. If the snapshot is still `playing` with the mover to move, fail with `INVALID_MOVE`. The computer is not affected: its continuation stays one action for each call. Do the same in the fixture.

**Submission packet.**

| File | Change |
|---|---|
| `docs/submission/test-cases.md:18` (P2) and `docs/submission/package/plugin.json:51-52` | "A move on the board changes the board only. Undo takes it back. End turn sends `kingdown_move` with the turn's moves; then `kingdown_computer` returns the computer reply." Use the T1 words. |
| `docs/submission/checklist.md:102` (row 49, demo video) | "a computer game with one move, then End turn" (T1 words) |
| `docs/submission/package/skills/play-king-down/SKILL.md:12` | Add: "A turn goes to the game only when the player presses End turn on the board." (T1 words) |
| `listing.md`, `release-notes.md` | No change |

## 5. Widget changes

| File | Change | Lines |
|---|---|---|
| `src/plugin/screens/board-model.ts` | Pure draft functions (below) | +40 |
| `src/plugin/screens/board.ts` | Draft play, Undo, the turn button, read/play split, redraw rule, replay skip, keys, words | +65 / −15 |
| `src/plugin/app.ts` | Keep the refusal code and pass it to `rollbackBoardMove` (`app.ts:124-126`, `155`) | +4 / −2 |
| `src/plugin/client.ts` | `PageState.draft?: { game_tag: string; fen: string; lans: string[] }`; restore it at start (`client.ts:7`, `16`) | +3 / −2 |
| `src/plugin/server.ts` | Schema and description | +4 / −1 |
| `src/plugin/index.html` | `#undo` and `#end-turn` in `#table-bar`; the `i-undo` symbol from the website `index.html:23`; T2a removes `#offer-draw` and `#resign` from the bar (Menu has both, `board-actions.ts:25-28`) | +3 / −2 |
| `src/plugin/app.css` | Bar columns (the turn cell wider: `1fr 2fr 1fr`), the ready style (`.primary`), and the comment at `app.css:113` | +5 / −2 |
| `src/turn.ts` | Only with T1b: a label parameter | +6 |

**Pure functions in `board-model.ts`.**

- `draftTurn(steps, pos, mode)`: an adapter to `turnOf` and `turnLine` (`turn.ts:41`, `65`). History = `steps.map(s => ({ pos: s.pre }))`, turn start 0, `status` = engine `status(pos)`, `legal` = `legalMoves(pos)`, `inCheck` = `inCheck(pos)`. It returns `{ staged, midWay, waits, ready, line }`. One extra rule: with 0 steps, a mid-way position and a legal pass, `ready` is true. This covers a half turn that an old board left on the server.
- `sendActions(steps, pos)`: the LANs, plus `--` when mid-way and not waiting.
- `draftChoices(view, pos, steps)`: the server's legal moves at 0 steps; the local legal moves after that; none while the turn waits.
- `restoreDraft(view, saved, rules)`: the steps, or `undefined` when the tag, the FEN, the ready state or a LAN does not agree.
- `mode` is `'computer'` for a solo game and `'link'` for a game against a person. These modes give the website words with no new strings.

**`board.ts` changes.**

- `choose()` (`board.ts:114-124`): no `call`. Push the step and save the draft. Play the move sound as now (owner-decisions branch).
- **Read or play.**
  - `canPlay()` = not blocked, `view.action === 'ready'`, status `playing`, and the draft does not wait.
  - `canRead()` = not animating.
  - `select()` (`board.ts:136-152`) and `coinRead()` (`166-189`) return early only when they cannot read. Each move path and each "Use" button also needs `canPlay()` (`174`, `183`).
  - The coin state passes the seat only when `canPlay()` (`201`).
  - Enter on the board calls `select()`; `select()` decides (`162`).
  - While the turn waits, a tap reads the piece, and the note says `waitNotice(mode)` ("Tap Send your turn, or Undo.", `turn.ts:83-84`).
- **The context line** (`board.ts:233`): `computer: view.turn !== view.seat`; `midWay`, `stagedEnd`, `waiting` and `turnLine` come from `draftTurn`. Remove "Stop here" (`board.ts:243`). The turn button does its job.
- **The trail marks** (`board.ts:222-225`): while a draft exists, mark every draft step.
- **The turn button `#end-turn`.**
  - Label: from T1.
  - It is on, with the ready style, only when `draftTurn().ready` and nothing is open or sending.
  - When off, it shows `aria-disabled="true"`, keeps its place in the Tab order, and its handler does nothing.
  - A double press sends once: the `busy` guard and the frozen `pending`.
- **`#undo`.** On when there is at least one step and nothing is sending or pending. Off otherwise (`aria-disabled`).
- **Keys** (website §4.4):
  - Tab order: board, strips, context actions, Moves line, Undo, the turn button, Menu.
  - A keyboard move that makes the turn wait moves the focus to the turn button. A mid-way turn keeps the focus on the board, so Enter cannot play the pass by mistake.
  - Enter on the turn button sends. Before the busy lock, the focus goes back to the board.
  - Z on the board, or on the bar, is Undo (no global key). After an Undo leaves no steps, the focus stays on Undo.
  - Escape clears the selection, the arming and the sheet. It never clears the draft.
- **Screen reader.** `#context-text` is a polite status region (`index.html:70`). The turn lines are spoken there. Errors stay in the alert region.
- **Reduce Motion.** A draft move uses `animateMove`, which follows the setting. Undo snaps. The press adds no motion. The sent steps do not animate again.
- **Redraw** (`board.ts:262-301`): the keep-or-drop rule of section 3, step 5. `rollbackBoardMove(code)` drops the draft for `INVALID_MOVE` only. Other codes re-read, and the redraw rule decides.

## 6. Edge cases

| # | Case | What happens |
|---|---|---|
| 1 | Partial commit | Not possible. One call, one engine pass before the lock, one write (`service.ts:249-253`, `298`). Never send the actions as one call each. |
| 2 | Double press | The `busy` guard and the off button. One command. |
| 3 | Lost reply or time-out | `pending` keeps the same ID and `actions`. Undo and play stay locked (the board is blocked while `pending` exists). Reading still works. Retry sends the same command (`app.ts:83-95`, `160`). |
| 4 | Remount with a pending send | Mount marks it failed (`app.ts:239`), then Retry. If the send was saved, the server FEN is past the base, so the draft drops. Retry gets the receipt. |
| 5 | `STALE_REVISION` or `WRONG_TURN` at the press | Nothing was saved. The board reads again. It keeps the draft if the base still agrees, and shows the T6 line. It never sends again by itself: a move declines a new draw offer (`service.ts:267`). |
| 6 | `INVALID_MOVE` (the local and saved engines differ, `src/match/index.ts:19-25`) | Drop the draft, read again, show the refusal. |
| 7 | `MATCH_TERMINAL` (deadline passed, opponent claim, resign from the chat) | The redraw sees the end. The draft drops. The end screen opens. |
| 8 | Draw offer during the draft | A new revision with the same FEN. The draft stays. The note shows the offer. A press declines it (game rule). The player sees the note first. |
| 9 | Preset message during the draft | The same as 8, with no note. |
| 10 | The chat model resigns, aborts or accepts a draw | The game ends. The draft drops. The end screen opens. |
| 11 | Poll with the same revision | Only opponent data changes (`app.ts:133-134`). The draft, the selection and Undo stay. |
| 12 | Reload or remount | Restore by tag, FEN, ready state and a legal replay. Otherwise drop. |
| 13 | The host drops widget state, or a new chat result makes a new widget | The draft is lost. The saved board shows. This design makes no promise across devices. |
| 14 | Two boards on one game | The first press wins. The second gets a refusal, its base no longer agrees, and it drops its draft. |
| 15 | Computer game | The computer plays only after the press (`board.ts:93`). "Their move" reads `view.turn`. Solo games do not poll (`poll.ts:6`). |
| 16 | Daily deadline | The draft does not stop the clock. "Your games" still says your move. A late press gets `MATCH_TERMINAL` (`service.ts:44-46`, `301`). |
| 17 | Staged end: mate, king capture, stalemate, 50 moves, material | The turn waits for the press. Undo works. The topple and the end screen come only with the server result. The engine finds these locally (`engine.ts:2065-2071`). |
| 18 | Repetition draw | Only the server finds it (`engine.ts:2064`). It shows after the press. |
| 19 | Half turn on the server (an old board, or a game saved before ticket 06) | 0 steps, mid-way, pass legal: the button is on and sends `--`. Or the player makes the follow-up move. |
| 20 | Lab double first turn | No pass. The button stays off until the second move. |
| 21 | Back, Settings, Menu, sheets | The draft stays in memory and in private state. Another game on this board drops it at the redraw (another tag). |
| 22 | Undo limit | Undo cannot go past the turn start. It is off with no steps and off while a send waits. |
| 23 | Old cached board (sends `lan`) | One action still works. After ticket 06, a lone Haste first move from it gets `INVALID_MOVE`. |
| 24 | Abort, claim, accept or decline a draw, "Next game ›" | No change. These come from the server view. "Next game ›" shows after the press, when `view.turn` is theirs. |

## 7. Test plan

**Unit (vitest).**

- `board-model.test.ts`:
  - `draftTurn`: nothing staged; one move (waits); Haste first move (mid-way, ready, `sendActions` adds `--`); Haste second move; free Freeze then a move; Freeze then the press; Rally follow-up limit; checkmate and king capture as a staged end; a half turn from the server with 0 steps; the lab double first turn.
  - Undo brings back a spent card, a mark and the coin state.
  - A Beast chain is one step.
  - `draftChoices`: server list at 0 steps; local list after; none while waiting.
  - `restoreDraft`: right tag and FEN; other FEN; game ended; not ready; a bad LAN.
- `client.test.ts`: the draft is saved with the tag, never the game ID; it comes back at start; `modelContent` stays empty; the draft and `pending` stay apart.
- `server.test.ts`: `actions` with 1 to 4 pass; `lan` passes; both, neither, an empty list or 5 actions fail with `INVALID_INPUT`; the hints stay the same.
- `server.db.test.ts`: one call with `[Haste, second]` gives one revision and one command row.
- `plugin-protocol-check.ts`: a retry with the same ID and `actions` gives the same reply; a bad second action leaves the fixture revision and FEN unchanged.
- Ticket 06 (`service.db.test.ts`, `setup.db.test.ts:236`): a lone Haste first move is refused; Haste plus `--` and Haste plus a second move pass; a bad second action changes nothing; the computer continuation stays the same.

**Browser journeys (new `tools/plugin-turn.test.ts`, at the real UI, no direct tool calls).**

1. A move sends no tool call and does not change the revision. The press makes one call. `kingdown_computer` comes only after it.
2. Haste: two Undo presses bring the board back to the start, the coin is "ready", and nothing was sent.
3. A mid-way press sends `[first, '--']`.
4. A waiting draft and a sent turn: a tap reads a piece ("All rules" shows); "Use" does not show; drag, Enter and the move list do not move.
5. Remount during a draft restores it. A changed server FEN drops it.
6. Bob offers a draw during a draft: the press gets a conflict, the draft stays, the draw note and the T6 line show, and the second press works.
7. `rejectNextMove = 'INVALID_MOVE'` drops the draft.
8. `dropNextMoveReply`: Retry commits once with the same ID and `actions`. Undo stays off until then.
9. Mate in one: the staged-end line shows; Undo works; the press opens the end screen; the mate does not animate twice.
10. Keyboard: a move by Enter moves the focus to the turn button; Enter sends; the focus goes back to the board; Z undoes.

**Existing checks to change.**

- `tools/plugin-ui-check.mjs:1056-1178`: the Haste words (line 1163), the revision and move-call counts, the lost-reply and refusal loops (now set off by the press), "Stop here".
- `tools/plugin-board.test.ts:221`: 48 px targets for Undo and the turn button; Reduce Motion (line 142).
- `tools/plugin-ios-size.test.ts`: the bar text fits at 320 px.
- `tools/plugin-journeys.test.ts:111`: with T2a, `#offer-draw` comes from Menu.
- Direct `lan` calls stay valid.

**Runs.** On the M1 (`docs/COMPUTE.md`): `npm test`, the database tests, `npm run plugin:check:protocol`, `npm run check:browser plugin-ui`. Do not run the same suite twice at once. Check the page size with `npm run plugin:build:ui` (about +2 KB).

## 8. Build tickets

Folder: `docs/specs/send-turn/` (this design as `spec.md`, tickets in `issues/`). Branch from `claude/owner-decisions`. Each ticket is one agent session.

**01 · Server: whole-turn input for `kingdown_move`.** Type: task. Blocked by: none.
- Do: section 4, the schema, the description and the fixture fix.
- Files: `src/plugin/server.ts`, `tools/plugin-protocol-fixture.ts`, `src/plugin/server.test.ts`, `src/plugin/server.db.test.ts`, `tools/plugin-protocol-check.ts`.
- Done when: the server and protocol tests of section 7 pass, and the hints table does not change.
- Size: about 12 source lines and 70 test lines.

**02 · Board model: the pure draft.** Type: task. Blocked by: none.
- Do: `draftTurn`, `sendActions`, `draftChoices` and `restoreDraft` on `turn.ts`.
- Files: `src/plugin/screens/board-model.ts` and its test.
- Done when: the `board-model.test.ts` cases of section 7 pass.
- Size: about 40 source lines and 130 test lines.

**03 · Board: draft play, Undo and the turn button.** Type: task. Blocked by: 01, 02.
- Do: section 5 except the restore. That is `choose()` with no call, Undo, the turn button, the T2a bar, read or play, the context line, the trail marks, the keys, the press, the reply with no second animation, and no "Stop here".
- Use the recommended taste options as provisional defaults.
- Done when: journeys 1-4, 9 and 10 pass, and the existing checks of section 7 are changed and pass.
- Size: about 70 source lines and 150 changed test lines.

**04 · Board: recovery.** Type: task. Blocked by: 03.
- Do: the draft in private state; the restore at mount; the keep-or-drop redraw rule; the refusal code in `rollbackBoardMove`; the T6 line; Undo locked while `pending` exists.
- Files: `board.ts`, `app.ts`, `client.ts` and their tests.
- Done when: journeys 5-8 and the `client.test.ts` cases pass.
- Size: about 30 source lines and 110 test lines.

**05 · Submission packet.** Type: task. Blocked by: 04, and the owner's T1 pick.
- Do: the table in section 4 (P2 in both copies, row 49, the skill sentence).
- Done when: the copy checks pass, and the two P2 copies agree.
- Size: about 12 lines.

**06 · Server: refuse an unfinished human turn.** Type: task. Blocked by: 03 (merge the new board first).
- Do: the later check in section 4, in the service and the fixture.
- Files: `src/match/service.ts`, `tools/plugin-protocol-fixture.ts`, `src/match/service.db.test.ts` (the Haste test at `:87-106` sends whole turns), `src/match/setup.db.test.ts:236`.
- Done when: the ticket 06 tests of section 7 pass.
- Size: about 5 source lines and 30 test lines.

**07 · Taste samples for the owner.** Type: prototype. Blocked by: 04.
- Do: build each option of section 9 as a small branch from the ticket 04 branch: `taste/turn-t<N>-<letter>`. Do not merge.
- Capture these states: your turn with nothing staged; Haste mid-way; the turn waits; staged checkmate; sending; sent (their turn).
- Capture at 393 × 852 (light and dark), 320 × 568 (light) and desktop fullscreen 1280 × 800 (light).
- Put the screenshots on the approval page, one item for each taste point, with the recommended option first.
- Done when: each option has its screenshots on the approval page.

**Merge.** Tickets 01-04 and 06 merge into the owner-decisions build after the owner picks the T1 to T7 options. Ticket 07 branches do not merge. Feature branches wait for the owner.

## 9. Taste options (samples for the owner)

The turn behavior, the keys and the access rules above are fixed. These points are taste. The recommended option is first in each row.

| Point | Options |
|---|---|
| **T1 Button words** (owner, 2026-10-15: the button shows a sword that points right, `assets/sword-right.svg`; these words become its accessible name, its title and the turn lines) | a) **The website rule**: "End turn" against the computer, "Send your turn" against a person. The lines come from `turn.ts`. No new strings. b) "Submit turn" in every game (the owner's word). Adds a label parameter to `turn.ts` (about 6 lines) and new lines such as "Tap Submit turn." c) "Send your turn" in every game. |
| **T2 Bar** | a) **Undo · turn button · Menu.** Offer draw and Resign go to Menu only (Menu has them now). The same as the seat bar ("Shuffle · Ready · Menu") and the website bar. b) Undo · Offer draw · turn button · Resign · Menu. The four small buttons show icons only. c) The bar changes with the turn: Undo · turn button · Menu on your turn; Offer draw · Resign · Menu on theirs. |
| **T3 Turn button on their turn** | a) **Shown and off** (website rule). b) Hidden. The cell says "Their move". |
| **T4 Ready cue** | a) **One pulse when the button comes on; only the colour change under Reduce Motion** (website rule §4.1). b) Only the colour change. c) a, and once "The computer waits for End turn." after 4 s in the first three solo games (website rule; needs a per-device count). |
| **T5 Unsent-turn mark** | a) **No extra mark.** The turn line and the ready button show it. b) "Not sent ·" before the move words in the Moves line. c) b, and the draft steps in the Moves sheet under "This turn (not sent)". |
| **T6 Line after a refused press that keeps the draft** | a) **"The game changed. Check it, then tap End turn."** (T1 words). b) Keep today's words: "Your opponent moved. Check the board." (W7 option a; not true after a draw offer). c) No line. The draw note shows alone. |
| **T7 Leaving with an unsent turn** | a) **Nothing.** The turn waits on this board. b) The "Your games" row says "Not sent". c) A confirm sheet on Back. |

## 10. Size

| Area | Files | Lines |
|---|---|---|
| Source | 7 files (8 with T1b) | about +125 / −25 |
| Tests | 4 unit files, 1 new browser file, 4 changed browser files, 2 database files | about +400, about 40 changed |
| Docs | `test-cases.md`, `plugin.json`, `checklist.md`, `SKILL.md`, `docs/specs/send-turn/` | about 15 lines plus the tickets |

No database migration, no new tool, no new dependency, no rules-engine change.
