# Part C1: save, resume, stored choices

Status: ready-for-human

Spec: [Playable](../spec.md). Blocked by: none (the tree of [the interface move](../../interface-move/spec.md), stages A and B).

## Scope and plan

### New module: `src/interface/play/saved.ts`, tests in `saved.test.ts`

The save logic goes in one module with no DOM, so each rule has a unit test. It imports `readSave`, `savedGame`, `storedSettings`, `writeSave`, `gameJSON`, `SAVE_KEY` and the `Save` type from `src/screen/save.ts`, `canWriteLocal` and `gameTime` from `src/account/local.ts`, `stagedPlies` and `finishLinkedTurn` from `src/turn.ts`, and `toLan` from `src/rules/setup.ts`. It does not copy them and does not change them (decision 1). `play/main.ts` calls it at the points below.

- `levelOf(skill: unknown): Level` and `SKILLS: Record<Level, SkillName>`.
- `gameType(rules): 'pieces' | 'powers' | 'cards'`: no king power = pieces; a hand with cards = cards; else powers.
- `readStored(): Stored`. Kinds: `none`, `empty` (no move), `resume`, `finished`, `kept` (cannot resume), `blocked` (storage refuses, or the local data belongs to another account tab). It also gives the settings fields it can read (the save's, or `storedSettings()`).
- `keepCopy(raw): 'copied' | 'already' | 'full' | 'failed'` and `beforeNewGame(writer)`: decision 7.
- `restore` (inside `readStored`): replays the save, takes off the staged plies and stages them again on a `DraftTurn` (decisions 2 and 3). `readStored()` gives the restored game and draft with kind `resume`.
- `snapshot(draft, resigned)`: the `Save` game fields of the live game (decision 1). `continueLine(draft, level)`: the home line.
- `SaveWriter`: the write rules, the game time, the check for another tab and the one notice (decisions 2, 5, 8). It also calls `stamp()` of `account/sync.ts` after each write (local only).
- `storedChoice` and `storeChoice`: the `stored()` helper of `main.ts`, moved here so that it has a test.

### Decision 1: one saved solo game in the old shape

- Key `kingdown.save`, type `Save`, through `writeSave` and `readSave` only.
- `snapshot` writes the old page's game fields exactly (`src/screen/play.ts` `snapshot()`): `back`, `fen` (FEN of the first position), `moves` (the LAN of `game.history`, then the LAN of each staged step), `white: 'human'`, `black: 'ai'`, `link: null`, `daily: null`, `resigned` (0 or null), `staged` (only when above 0), `rules: { ...game.rules }`. Then the settings fields (decision 9), then `gameAt` (below).
- Game time, as the old page (`play.ts` `save()`): a write that changes the game JSON (`gameJSON`) after a player step sets `gameAt = max(Date.now(), last gameAt + 1, stored gameAt + 1)`. A change by the computer alone, before any player step on this page load, keeps the loaded time. A settings write keeps the stored time. `recovery` stays only while `gameAt` does not change. Reason: the old page's account sync takes the newer `gameAt`; a missing or old time lets an older cloud copy replace the game.
- Edge: the new page has no account sync. A game played here goes to the cloud when the old page opens next.
- Tests (`saved.test.ts`):
  - "writes the old field set": the exact key list for each case: a fresh device; stored queen, threats and labels; staged above 0; recovery kept.
  - "the old page's code continues a new-page save": `savedGame` replays all moves, `stagedPlies(game, save.staged)` equals the staged count, and the position (`toFen`) equals the live one.
  - "a save made by the old page resumes here" (`saved.old-page.test.ts`, the real `connectPlay` of the old page): pieces and powers games, after End turn and with a staged move, give `resume` with the same position, level and game type.
  - "the old page resumes a save made here": a staged Haste turn opens with `restore()` of the old page with the same position, the staged turn and the level; a cards game loads with no error and replays the computer's card move.
  - "a player step makes a newer game time; a computer reply alone keeps it": checks `gameAt` and, through `stamp()` of `account/sync.ts` on a stub store, that `saved_game.at` follows it.
  - "a settings write keeps the game fields and the game time".

### Decision 2: when to write

- `main.ts` calls the writer:
  - `start()`: after the new game is built (a save with no move).
  - `afterStage()` and `undo()`: the whole staged steps with `staged` (the old page writes after each ply and after Undo).
  - `finish()`: after `draft.commit()`, before the reply.
  - The computer's reply: when its last ply of the turn is played in `game`, before the board playback ends. A reload during the playback shows the reply as done.
  - Resign (`resignDialog` `onConfirm`): after the staged steps are removed, with `resigned: 0` (the old page's `dropTurn` rule).
  - A setting change (decision 9).
- Staged steps: `moves` holds them, `staged` counts them. `restore` replays all moves with `savedGame`, takes `stagedPlies(game, save.staged)`, removes those plies with `game.undo()`, and `stageAll` stages each one again on a new `DraftTurn` (it finds the move by `toLan(draft.now, m) === lan` in `draft.legal`). With no staged plies it calls `finishLinkedTurn`, as the old page does.
- Edge: an open Beast chain is not a whole move. The save keeps the whole steps before it; a reload returns there (spec, item 8).
- Edge: a staged step that ends the game (mate before End turn) stays staged: the game is not finished, Continue shows, End turn shows the result.
- Edge: a bad `staged` count gives 0 (`stagedPlies`): all plies count as handed over.
- Tests:
  - "a reload in the middle of a staged turn restores the steps with Undo and End turn": stage one move and a Haste second move, write, restore; the draft has 2 steps, `canFinish` is true, Undo gives the position after the first step.
  - "a staged power and a staged card come back with their uses" (Freeze; a cards game).
  - "a reload while the computer thinks resumes with the computer to move": a save after End turn restores with `game.pos.turn === 1`, no staged steps.
  - "a save that ends on a handed-over Haste step resumes with the linked pass played".
  - "an open chain saves only its whole steps".

### Decision 3: resume

- `readStored()` gives `resume` when the save reads, is not partial, has at least one move, is not finished, and passes decision 7.
- Home (`main.ts` `home()`): with `resume`, the main action is **Continue** (`kind: 'main'`), then one line: `${level} computer · ${game type} · ${turn}`. The texts exist: `levelName()`, `text.piecesOnly` / `withPowers` / `withCards`, and for the turn `text.ready`, `text.thinking` or `text.draft`. The second action is **New game** (a plain button), then the setup groups as today. Without `resume`, Play stays as today.
- Continue: `start()` gets an optional restored game. It skips `deal()`, Versus and Roll call, sets the board to `draft.position`, sets `last` and `lastSquares` from the last handed-over turn (`turnText`, `turnSquares`), and starts the computer's reply when the computer is to move. The reply loop moves out of `finish()` into `reply()`; `finish()` calls it.
- Continue reads the save again at the press and opens it only when it can resume. When the last game write failed (`SaveWriter.lost`), Continue opens the game kept in memory: `army` holds the home screen's dealt army, so `game` stays the live game.
- Continue sets the game type from `gameType(save.rules)` and the level from `levelOf(save.skill)`. The home Level group starts at that level; a Level change on the home screen is written only when a new game starts.
- New texts in `texts.ts`: `resume: 'Continue'` (`continue` is the Beast chain line), `newTitle`, `newCause`, `keepGame`, `kept`, `cannotSave`, `otherTab`.
- Edge: a save with level `strong` or no level shows "Club computer" (decision 10).
- Edge: a FEN save (`back` empty) resumes when its pieces are known; Rematch starts again from its first position (spec, item 10).
- Tests: "Continue names the level, the game type and whose turn" (a pure `continueLine(draft, level)`), "a reload while the computer thinks resumes with the computer to move", "a FEN save resumes, and the rules this page builds read as the same rules after a merge", "no data, and a save with no move, give no Continue". Browser check `next-save`: Continue of an old-page save with the computer to move opens with no Versus, and the reply writes.

### Decision 4: New game over a saved game

- Home New game or Play when the save, read again at the press, has `resume` (or a game in memory waits): the kit `confirmDialog`, title "Start a new game?", text "Your saved game ends.", actions "New game" and "Keep my game". With `none`, `empty`, `finished` or `kept`: no confirm.
- `src/interface/ui/kit.js` `confirmDialog` gets an optional `cancel` label (default "Keep playing", so Resign does not change), and `kit.d.ts` its type. `PROVENANCE.md` records the change from the app copy.
- "Keep my game" closes the dialog; focus goes back to New game. "New game" starts the game; its first write replaces the save.
- Edge: the dialog element goes into the home section, so `root.replaceChildren` removes it with the home.
- Test: browser only (the dialog is DOM). The C1 browser record shows both actions.

### Decision 5: Back to home

- Menu "Back to home" (`home(true)`) has no confirm. It writes nothing (the last step is already saved). The home reads the save and shows Continue.
- Edge: during the computer's reply, `generation++` stops it; the save holds the final turn, and Continue starts the reply again.
- Edge: during Versus or Roll call the save has no move: the home shows Play.
- Test: browser (back to home in a staged turn, Continue, the same steps).

### Decision 6: a finished game

- The old rule: the save keeps the finished game (`resigned`, or a status that is not `playing` with no staged step) until a new game replaces it.
- `readStored()` gives `finished`; the home shows Play with no Continue and no confirm.
- Test: "a checkmate, a draw and a resignation read as finished; a staged mate does not".

### Decision 7: a save that cannot resume

- `kept` when the save reads and has a move but: `white` is not `human` or `black` is not `ai` (the player is Dark, or two people); `link` or `daily` is set; a piece on the first position has no entry in `texts.ts` `pieces` (the Catapult and other lab pieces); a king is not `null` and its king is not in `KINGS` or its power has no `POWER_NAME` entry, or a card is not in `RELEASED_CARDS` (an older engine; `kings` and `hands` must be lists of two); the staged plies belong to the computer's side (a foreign save; `restore` refuses them); its rules differ from the rules this page builds for its kings and hands (`canon` of `save.rules ?? new GameRules().rules` against `new GameRules(pieces ? { kings: [null, null], hands: [[], []] } : { ...POWERS_BALANCED, kings, hands }).rules`: an older engine, a `?rules=` preset, a design); or `readSave()` says `partial`.
- `keepCopy(raw)` writes the raw bytes to `kingdown.save.kept` when that key is empty, or when it holds an earlier state of the same game (same game fields apart from `moves`, `resigned` and `staged`, and its moves are the first moves of the new save: the old page played the game on), and `canWriteLocal` is true. Results: `copied`, `already` (the key holds these bytes), `full` (the key holds another game), `failed` (storage refuses).
- The home screen calls it at each render. With `copied` or `already`: no Continue and one line "A game from the earlier version cannot open here yet. It is kept." (`texts.ts` `kept`). With `failed`: the line of decision 8.
- Each new game (Play, New game, Rematch) calls `beforeNewGame`: it reads the save again; a kept save gets its copy first. `failed` blocks the writes and shows the line of decision 8. `full` lets the new game replace the save (spec, item 7, a known limit).
- Edge: a finished or empty save gets no copy.
- Edge: do not write "game link", "lesson" or "today" in comments or strings of `src/interface`: the parked guard (`src/parked.test.ts`) refuses them.
- Tests: "keeps a Dark-side save and does not write over it": a settings change keeps its game fields, a game write that is not a new game writes nothing, the kept copy equals the first bytes, a new game then writes the normal key. "keeps it": one case each for the player as Dark, two people, a `daily` save, a `link` save, a Catapult army, `RULES_2017`, a partial save, an unknown king power, a king with no power, an unknown king, kings that are not a list, an unknown card, staged steps on the computer side. "does not copy over a full kept key, and the new game then replaces the save (a known limit)". "a later state of the kept game replaces its copy; another game does not". "blocks the new game when the copy fails". "sorts a save again at the press: a Dark-side save written after load gets its copy before the new game". Browser check `next-save`: an older engine's king power and a Dark-side game played on after its copy show the kept line, and the copy holds the newest bytes.

### Decision 8: unreadable data and no storage

- `readSave().unreadable` with `raw`: take the path of decision 7 (spec, item 3). The page reads `storedSettings()` and honours them. It writes nothing over the bytes; a settings change writes nothing.
- `unreadable` with no `raw` (the local data belongs to another account tab), or `failed` (the read throws): `blocked`. The game plays; nothing writes.
- Write fails (`writeSave` false: private mode, a full quota): the game plays on. The line "This device cannot save the game." shows once per page load: in the help line (`refuse`-style notice) and the live region. On the home with `blocked`, the same line under Play.
- Protection before each game write (the old page's check): the writer reads the save; when its `gameJSON` differs from the game JSON this page last read or wrote, or the data is unreadable, and the write is not the first write of a new game the player started, it does not write and shows "Your saved game changed in another tab. Reload to load it, or start a New game." (spec, item 11).
- Tests: "a corrupted save (%s) is kept, its settings apply and nothing writes over it" (two cases), "storage that throws on read plays without a save", "storage that throws on write warns once", "another tab's game change blocks the write; its settings change does not".

### Decision 9: stored choices in the save's settings fields

- The new page owns `skill` (the game's level), `coords`, `sound`, `pace`. Every write has all four, in the old order (spec, item 1). It keeps `queen`, `threats` and `labels` from the stored data when they exist.
- At load: the settings come from the save, or from `storedSettings()`. Defaults with no value: level Casual (`beginner`), Coordinates On, Sound Off, Motion speed Normal (Off when the system asks for reduced motion).
- A setting change writes `{ ...stored save, settings }` with no change to the game fields or `gameAt` (a kept save too, after its copy, as the old page does). With no stored data (`getItem` gives null) it writes the current game (the old page's first-save rule). With unreadable data, failed storage or a blocked writer it writes nothing: the setting lasts for this page load. In part C1 the only setting control is Motion speed; Coordinates and Sound keep their stored value until part C2.
- `kingdown.piece-view` and `kingdown.hand` stay as they are. New key `kingdown.setup` (`pieces`, `powers` or `cards`): written at each game start, read at load by the `stored()` helper in `main.ts` (a bad value gives `pieces`).
- Tests: "writes the old field set: a fresh device", "writes the old field set: stored queen, threats and labels stay", "writes the old field set: staged above 0", "writes the old field set: recovery stays while the game time stays", "a settings write keeps the game fields and the game time", "a settings write with no stored data writes the live game, as the old page does", "reads the last game type, and a bad value gives Pieces only". Browser check `next-save`: `kingdown.setup` after Play; the stored Motion speed, Coordinates and Sound in the write after the reply.

### Decision 10: levels

- `SKILLS = { casual: 'beginner', clever: 'casual', club: 'club' }` (replaces `levels` in `main.ts`). `levelOf`: `beginner` to Casual, `casual` to Clever, `club`, `strong` and anything else to Club.
- A resumed `strong` game plays with `skillPlan('club', …)` and writes `club` at its next write.
- Test: "maps each skill to a level, and Strong or none to Club; the next write has club". Its write part gives `SaveWriter` the mapped skill, so it does not test `main.ts`; the browser check `next-save` does: a `strong` save shows "Club computer" and the reply writes `club`.

### Decision 11: tests

Each rule above has its tests in `saved.test.ts` (stubbed `localStorage`, as `src/screen/save.test.ts` does). The named cases are listed under each decision. The page wiring of `main.ts` (the write after a step, Undo, End turn and the reply; the settings read at load; `kingdown.setup`; Continue; the kept line) has the registered browser check `npm run check:browser next-save` (`tools/verify-next-save.mjs`, by name only until the cutover). The dialog and Back to home get the browser record.

### Decision 12: stage B check findings

- `docs/specs/interface-move/issues/02-stage-b-interface.md` and the design project's `runs/move/stage-b.md`: the test counts per file are `board-api.test.ts` 10 and `turn.test.ts` 10 (the total of 25 stays).
- `src/interface/board-api.test.ts`: the mock constructor keeps its options, and a new test "builds the view with holdStills and lazySheets" checks both are true. The hoisted mock gets a real type in place of `null as any`.
- `docs/specs/interface-move/spec.md`: Status `ready-for-human` (built; it waits for the review and the owner's look); section 4 records the stage A and stage B checks and their findings, and that this part fixes them.
- `src/parked.test.ts`: the new interface case also reads `src/interface/ui/kit.js`.
- `docs/specs/interface-move/issues/01-stage-a-renderer-and-entry.md`, Known limits: a cancelled playback can end frame loads with `net::ERR_ABORTED`; this is expected.

### Decision 13: the private-data check (audit B2)

- `npm run build` on the final tree. A script in the design project (`runs/playable/`) walks `dist/`: it counts symbolic links (`lstat`), runs `privateRuntimeData` of `tools/lib/character-runtime-guard.mjs` on each text file, and looks for absolute home paths. Both pages are in the same `dist/`. The report gives the counts and the command.

### Plan review findings (2026-11-13): applied and declined

The builder checked each finding in the code first.

| # | Finding | Result | Reason |
|---|---|---|---|
| 1 | The kept-copy rule contradicts itself | Applied | `keepCopy` gives `copied`, `already`, `full` or `failed`. `full` lets the new game replace the save (decision 7, a known limit). `failed` blocks the writes. One test for each result. |
| 2 | Back to home erases the game in memory | Applied | `army` holds the dealt home army; `game` stays the live game. When the last game write failed (`SaveWriter.lost`), Continue opens the game in memory. All game writes go through `SaveWriter`; the reply writes only while its generation is current. |
| 3 | A second tab can destroy a save that cannot resume | Applied | Play, New game, Continue and Rematch read and sort the save again at the press. A kept save gets its copy first (`beforeNewGame`); a resume save gets the confirm; Continue opens only a save that can resume. Test: "sorts a save again at the press". |
| 4 | A home level change can change the saved game's level | Applied | The home Level choice is not written until a new game starts. Continue uses `levelOf(save.skill)`, and the Level group starts there. The page has no settings write on the home screen. Browser check: the saved `skill` stays after a home level change. |
| 5 | The old-page test does not use the old page's code | Applied | `saved.old-page.test.ts` drives the real `connectPlay` and `connectSettings` with the stubs of `src/screen/play.test.ts` (copied: `vi.mock` is per file). Old to new: pieces and powers games, after End turn and with a staged move. New to old: a staged Haste turn through `restore()`. |
| 6 | Cards games and the old page | Applied in part | The lead already chose to save cards games (decisions, "Cards games in the shared save"). The test is added: the old page's code loads a cards save with no error and replays the computer's card move. The coin rows and the guide of the old page are stubbed in that harness, so the browser record covers them only at load. |
| 7 | The another-tab check compares raw bytes | Applied | The writer compares `gameJSON` of the stored save with the last game JSON that this page read or wrote. Unreadable bytes always block. Test: a settings-only change in another tab does not block. |
| 8 | The rules check reads unmerged rules | Applied | The check compares `canon(savedGame(save).rules)` (merged with the defaults) with the rules this page builds. Test: a save with one default key removed still resumes. |
| 9 | Settings get a late sync time | Applied | After each successful write the writer calls `stamp(localStorage)` of `account/sync.ts` when `canWriteLocal` is true, as the old page's `account.changed()` does with no account. Local only, no network. |
| 10 | The field-set test cannot pass as written | Applied | The tests give the exact key list for each case: a fresh device; stored queen, threats and labels; staged above 0; recovery kept. |
| 11 | Rematch after Continue uses the wrong setup; a FEN save breaks it | Applied | Continue sets the game type from `gameType(save.rules)` and the level from `levelOf(save.skill)`. A rematch of a game with `back` empty starts from the FEN of its first position. |
| 12 | An open Beast chain can be saved | Declined | The lead answered this point (decisions, "An open Beast chain: a reload returns to the step before the chain"). A saved chain move would also come back as a closed step that cannot take a further capture. |
| 13 | Some setting writes are unclear | Applied | A setting change writes `{ ...stored save, settings }` for a readable save (kept saves too, after their copy, as the old page does). With no stored data it writes the live game. With unreadable data, failed storage or a blocked writer it writes nothing: the setting lasts for this page load. |
| 14 | The status and the approval | Applied | Spec section 4 records the lead's answers and the approval rule of the decisions, so the spec stays `ready-for-agent` for part C2; this issue is `ready-for-human` (built, waits for the check). The new strings have no entry in the copy table of `runs/learning/learning-spec.md` (checked: the table has piece, power, card, turn, wrong-tap and result lines only). |

## Verification

Built on 2026-11-13 (branch `redesign`, uncommitted). Report: `runs/playable/c1.md` in the design project; logs and screenshots in `runs/playable/`.

- `npm test`: exit 0. Vitest 6,347 passed, 384 skipped (stage B: 6,307 and 384). `node --test` 114 of 114. New tests: `saved.test.ts` 35, `saved.old-page.test.ts` 4, `board-api.test.ts` 1 (now 11).
- `npm run test:docs`: exit 0, 187 passed, 1 skipped.
- `npm run build`: exit 0. `dist/` has 0 symbolic links, 0 files with private runtime data, 0 home paths (123 text files of 11,166 files). `dist/sw.js`: ALLOWLIST 269 to 270, PRECACHE 268 to 269; neither names `next.html` or an `interface/` file. The new page now imports `account/sync.ts`, so one more shared chunk enters the old page's offline lists.
- Temporary-revert proofs (`runs/playable/c1-mutation.log`): without the player-side check, 3 tests fail; without the block on a failed copy, "blocks the new game when the copy fails" fails; without the game compare for another tab, "another tab's game change blocks the write" fails. Each restored file is byte-equal to the final file, and the final file passes the same cases.
- Browser (headless Chromium, `vite preview` of the final `dist/`, 390×844 and 1440×900): powers and cards, two turns, reload, Continue (same kings, powers, cards, board, level; no Versus); a staged turn, reload, Continue with Undo; a reload while the computer thinks, then the reply; Back to home and Continue; a home level change keeps the saved level; New game with the confirm, both actions; a resigned game gives Play with no Continue; an old-page save resumes here and the old page resumes this page's save and its own; a Dark-side save of the old page is kept and not overwritten; corrupted data is kept; storage that throws and storage that refuses writes play on with one line. 0 console errors, 0 failed requests in each case.

## Known limits

- A cards game continues on the old page with no card controls for the player until the cutover (spec, item 4).
- An open Beast chain is not saved: a reload returns to the step before the chain (spec, item 8).
- `kingdown.save.kept` is outside the account key set of `local.ts`: an account change does not move it, the sync does not send it, and no screen reads it yet.
- When `kingdown.save.kept` already holds another game, a second save that cannot open here gets no copy, the home shows no kept line, and the next new game replaces it (decision 7 as accepted). A later state of the kept game is not a second save: it replaces its copy.
- A finished save that cannot open here (the player is Dark, two people) gets no copy, and the next new game replaces it, as the old page does with a finished game (decision 6). Decision 7 names no exception for a finished game: the lead decides (`runs/move/carry.md`).
- The new page imports `save.ts`, `local.ts`, `turn.ts` and `account/sync.ts`; the old page's offline lists change in count (PRECACHE 268 to 269), not in behaviour.
- With unreadable data, failed storage or another tab's change, a setting change lasts for this page load only.
- The line "This device cannot save the game." shows once per page load in the help line and the live region; the next board tap replaces the help line.

## Check repair (2026-11-13)

Three checkers (save safety, repository and tests, play regression) found 12 faults. Report: `runs/playable/c1.md`, section "Repair", in the design project.

| # | Fault | Severity | Outcome |
|---|---|---|---|
| 1 | Continue crashes on a save with a king power that the engine does not know | blocker | Fixed. `opens()` refuses a king that is not in `KINGS`, a power with no `POWER_NAME` entry, a card that is not in `RELEASED_CARDS`, and `kings` or `hands` that are not lists of two: the save is kept. 6 new "keeps it" cases. |
| 2 | A Dark-side game that the old page plays on after its copy is replaced with no line | major | Fixed. `keepCopy` replaces the copy with a later state of the same game. Test: "a later state of the kept game replaces its copy; another game does not". |
| 3 | Staged plies on the computer's side make the page write a save that does not replay | minor | Fixed. `restore` refuses them: the save is kept. Case "staged steps on the computer side". |
| 4 | A finished Dark-side save gets no copy | minor | Not fixed: a lead decision (a copy fills the one kept key). Known limit; `runs/move/carry.md` item 14. |
| 5 | The page wiring of `main.ts` has no test that can fail | major | Fixed. Browser check `next-save` (`npm run check:browser next-save`). |
| 6 | Same as 2, from the repository lens | minor | Fixed with 2. |
| 7 | The new page adds a shared chunk to the old page's offline lists | minor | Accepted as recorded in the known limits. |
| 8 | The test names in this issue do not match the real names; 12 or 14 items | minor | Fixed: the names under each decision are the real names; spec section 4 explains the two counts. |
| 9 | `finishLinkedTurn` in `restore` has no test | minor | Fixed. Test: "a save that ends on a handed-over Haste step resumes with the linked pass played". |
| 10 | Home with Continue shows the new army above Continue | minor | Not fixed: a layout choice. `runs/move/carry.md` item 15. |
| 11 | 61 px page scroll at 360×640 during the slide to the game | minor | Not fixed: stage B behaviour. `runs/move/carry.md` item 16. |
| 12 | Small layout shift at the first home load | minor | Not fixed: not of part C1. `runs/move/carry.md` item 17. |

Proof: `runs/playable/c1-repair-mutation.log`. Each fix was reverted for a moment: the named tests fail (fixes 1, 2, 3, 9), and `next-save` fails for each of four `main.ts` reverts (no write in `finish()`, the stored skill raw, no read of the stored pace, no `kingdown.setup`). Each restored file is byte-equal to the final file.

Verification after the repair: `npm test` exit 0, Vitest 6,355 passed and 384 skipped (8 new tests), `node --test` 114 of 114 (`runs/playable/c1-repair-test.log`). `npm run check:browser next-save`: passed. Browser (headless Chromium, `vite preview` of a fresh build, 360×640, 390×844, 1440×900): saves from the page with an unknown power, a missing power, an unknown card and staged computer plies show Play and the kept line, the copy equals the save, 0 errors; a real save still shows Continue; the old page's Dark game played on after its copy: the copy holds the newest bytes.

## Comments
