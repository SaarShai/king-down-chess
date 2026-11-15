# Part 01: the online controller

Status: ready-for-human

Spec: [People 1: the online controller](../spec.md). Blocked by: none.

## Scope and plan

All code is new, in `src/interface/people/`. No existing file changes.

### `server.ts`: the adapter

- `peopleServer(api)` takes the website client (`onlineClient`, `src/online/client.ts`) and gives the six calls of the controller: `game` (full, or `since` a revision), `command` (the reply's view), `draft` (`/preview`), `preview` and `join` of an invite, and `seen`. The client keeps its own retries with the same `command_id`.
- `inviteKey(fragment)`: the 43-character link token only. Game codes stay parked (`docs/PARKED.md`).
- `faultOf(error, online, read)`: one kind for each answer: `unknown` (no answer, a command may already be applied), `offline`, `auth` (401), `stale` (`STALE_REVISION`, `WRONG_TURN`), `illegal` (`INVALID_MOVE`), `ended` (`MATCH_TERMINAL`), `gone` (`MATCH_REMOVED`, `NOT_FOUND`), `account` (`FORBIDDEN` on a read), `down` (`UNAVAILABLE`), `refused` (any other code). `settled(fault)` is true when the server answered, so the command cannot apply later.
- Test (`server.test.ts`): each code gives its kind; only a server answer settles a command; only a link token is a key; the adapter calls the client unchanged.

### `receipt.ts`: the durable receipt

- Key `kingdown.account-command.<user>` and shape `{ name, args }`, as `createWebTransport` of the old page (`src/online/runtime.ts`). `receiptOf` gives the old tool name for each command (`kingdown_move` with `actions`, `kingdown_draw` with `choice`, and so on); `actionOf` gives the command back, as the old `commandAction`.
- One receipt for each account, written before the send under the account lock (Web Locks when the browser has them). The same receipt again is a retry. `drop(receipt)` removes only that receipt; `drop()` removes any receipt (Discard).
- Test (`receipt.test.ts`): for each command, the old page's transport reads a receipt made here and sends the same command, revision and ID; one receipt for each account; an unreadable receipt.

### `replica.ts`: the local copy

- `replicaOf(view)`: a `Game` with the view's rules, from `history.initial_fen` and `history.actions`. It must reach the view's FEN, or it is undefined. `positionOf(view)`: a copy of the position only, for an engine that cannot replay the history.
- `playCommands(game, revision, next)`: the moves of the commands after `revision`, in order. A gap, a move that is not legal here, or another FEN gives undefined; the controller then reads the full game.
- `lastTurnOf(game, view)`: the opponent's last turn (from the view's last 10 commands and the copy's last plies), for the arrival motion and its words.
- `turnActions(draft)`: the actions of one turn command: the steps, the move of an open Beast chain, and the pass that ends a mid-way turn. The same moves as `DraftTurn.commit()`, with no change to the game. `restage(draft, lans)`: the moves again on a new draft while they are legal.
- Test (`replica.test.ts`): `turnActions` equals `commit()` for a move, a Haste turn with one move (with the pass) and with two moves, and a Beast chain of one and two captures; the copy and its refusals; the command order; the opponent's last turn.

### `controller.ts`: the controller

`peopleController({ server, userId, storage, locks?, pageEngine?, now?, online?, uuid? })`. A screen reads `state()`, calls the actions, and redraws at each change (`subscribe`).

- **State.** `phase`: `loading`, `waiting` (the seat is open), `setup`, `your-move`, `staged`, `sending`, `checking`, `their-move`, `over`, `gone`, `account`, `failed`. Also: the server `view` (never with draft moves), `position`, `draft`, `canSend`, `received` (the opponent's last turn on your move), `sent`, `draw` (`none`, `mine`, `theirs`), `drawsLeft`, `canOfferDraw`, `rematch` (`none`, `mine`, `theirs`, `declined`, `closed`, `accepted`) and `rematchGame`, `clock` (the time left from the server clock), `claim` (`win`, `end`; `boardActions` of the old board model), `abortOpen`, `connection` (`online`, `offline`, `down`, `auth`), one `notice` (`stale`, `illegal`, `offline`, `refused`, `draw-declined`, `signed-in`), `check` (an unsettled command: its game, the failed checks, `canDiscard`), and `engine` (`local` or `server`).
- **Load.** `open(gameId)`: settle a saved command first (the old rule: one command at a time for each account), then read the full game and build the copy. On your move after the opponent's turn, `received` holds that turn.
- **Join.** `preview(key)` and `join(key)`: the invite by link. A refusal gives the fault (the landing of the next stage says it).
- **The turn.** `stage`, `bite`, `undo` and `arm` act on the solo `DraftTurn`. `send()`: one `turn` command with `turnActions` and `expected_revision`, the receipt first. The reply's view goes through `playCommands`, so the copy changes only by moves that the server logs.
- **Receive.** `refresh()` reads the commands after the current revision. The opponent's turn plays on the copy and becomes `received`; `sent` goes off. A command that does not change the board (a draw offer) keeps the staged turn.
- **Offers and the end.** `offerDraw()`, `answerDraw(accept)`, `resign()` (the unsent turn does not count), `abort()` (while `abort_open`), `claim()` (after the opponent's deadline: the win, or the end with no result before both players move), `rematch('offer' | 'accept' | 'decline')`. When the opponent's turn removes your open offer, the notice is `draw-declined` ("Send also declines").
- **Refusals.** `stale`: a full read; the staged moves go on the new draft while they are legal. `illegal`: the draft stays. `ended`: a full read shows the result. `gone`, `account`: the phase says it. Other codes: the notice `refused` with the code.
- **No answer (M12).** With no answer (`unknown`, `offline`, `down`, `auth`) the receipt stays and the phase is `checking`. `check()` reads the receipt's game: a higher revision settles it with no send (it went in, or it can never go in); at the same revision the command goes again with its own ID, and the server applies it once. Any read of that game with a higher revision also settles it. After two failed checks, `check.canDiscard` is true and `discard()` removes the receipt; the staged turn stays for a new Send. A saved command of another game holds the commands of all games until it settles or goes, as on the old page.
- **Engine identity (M3).** `engine` is `local` when the copy replays the history and `needsServerPreview(view.engine_fingerprint, pageEngine)` is false (`src/account-game/engine-identity.ts`; the default `pageEngine` is the build's `PAGE_ENGINE`). Then no preview goes. Otherwise `send()` first asks the server to check the whole turn.
- **Reconnect and recovery.** `start({ page?, net? })` runs the one poll of `src/plugin/poll.ts` (`runPoll`, with its cadence and no read while the page is hidden) and the `online` and `offline` events. `online` settles a saved command and reads the game. A failed first read shows `down` at once; poll failures show `down` at the third in a row (`src/account-game/state.ts`, `failed-poll`). `auth` (the sign-in ended) keeps the receipt; `signedIn()` sends it with its own ID and gives the notice `signed-in`. A finished game with a person stays in the poll until a rematch answer comes (as `endPoll` of the old page).
- **Seen.** A good read records activity at most each 30 seconds (as the old runtime).

### `words.ts`

`timeWords(ms)` ("{n} days" from 2 days, "1 day", "{n} hours", "less than 1 hour"; rounds down), `agoWords(ms)` (minutes, hours, days) and `urgent(ms)` (the last 24 hours). Test: `words.test.ts`.

### `fake-server.ts` (test support)

`fakeServer(fixture)` gives a `fetch` for the website client and a `handle(method, url, authorization, body)` for a browser route. The bearer token names the player. Faults from a queue: `network` (no answer, nothing happens), `lost` (the server applies the call, the answer is lost), `status` (a code). `offline`, `signOut`, `signIn`. `memoryStorage()` is a storage in memory.

### Tests against the fake server (`controller.test.ts`)

Each case uses the website client, the REST paths and the protocol fixture's rules:

- join by link, Send, the opponent receives the turn; a later open shows the opponent's last turn;
- M3: no preview with the game's engine; one preview before the command with another engine or none; a refused preview sends nothing and keeps the draft;
- a draw offer keeps the staged turn, and Send also declines it;
- accept a draw, resign (the draft goes), end with no result;
- rematch offer, accept (the new game has the sides swapped), decline;
- a stale turn keeps the draft; an illegal turn keeps the draft;
- a lost reply: Check again settles the turn with one command ID;
- M12: a poll read with a higher revision settles a lost reply with no send;
- no connection: nothing goes; a lost connection during the send keeps the receipt, and the `online` event sends it with the same ID;
- M12: a saved command that cannot settle holds the other game until two failed checks, then Discard frees it;
- M12: a read with a higher revision settles an old receipt with no send; an unreadable receipt can go at once;
- the sign-in ends: the turn goes after a new sign-in with the same ID;
- time up: End the game before both players move, Claim the win after;
- recovery: another account, the service down at the third failed read, the game gone;
- the poll reads at the old cadence and not while the page is hidden;
- no DOM in the people modules.

A rule test fails without its rule: the record of the runs that remove a rule is in the report (design project, `parallel/people/run/report.md`).

## Verification

See the report, section "people1", in the design project: test counts and logs, the build, and the browser run with its screenshots.

## Known limits

- Hidden setup, the draw-offer count and the M12 check count: spec section 2, items 1 to 3.
- A Beast chain that is open when the game changes does not go on the new draft (`restage` stages whole steps only).
- `received` comes from the last 10 commands of a full read; an older turn does not show.
- "Next game · {name}" needs the games list; it is not in this part.

## Repair

[Issue 02](02-repair.md) records the poll, receipt and engine-check repairs. The final state and evidence are in the design project, `parallel/people/run/report.md`, section Repair.
