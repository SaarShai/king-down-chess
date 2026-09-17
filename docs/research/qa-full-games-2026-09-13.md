# QA — full games through the real UI (2026-09-13)

Eight complete games played end to end in the browser with Playwright: the human side clicks
squares on the canvas, the computer side runs the normal AI. Every position was cross-checked
against the engine — replay the autosave's LAN list in Node and compare `toFen` with the FEN the UI
publishes in `#setup[title]`. **All eight cross-checks passed and no run produced a console error.**

Harness (scratch, outside the repo):
`/private/tmp/claude-501/-Users-za-Documents-king-down-chess/af00383a-be3c-43af-8c39-b2e17188dc55/scratchpad/qa/`
— `qa.ts` (helpers), `run.ts` (one game), `stress.ts`, `repro.ts`, `repro2.ts`, `promo.ts`,
`fairy.ts`, `worker.ts`, `smoke.ts`. Screenshots: `docs/research/qa/*.png`.

Setup: `PORT=5222 npx vite --port 5222`, headless Chromium (SwiftShader), Think slider at its
minimum (200 ms), runs strictly sequential. The human policy is: promote if you can, else take the
most pieces you can, else take a maester long swap, else a random legal move — which is why the
move lists are thick with maester swaps.

Two notes for whoever repeats this:

- `/@vite/client` must be stubbed to stop HMR reloads, but the stub has to keep
  `updateStyle`/`removeStyle` working — Vite injects `src/style.css` through them. A no-op stub
  renders the app unstyled and makes every layout observation worthless.
- `#setup[title]` is updated by `refresh()` **before** `save()` runs, so the two disagree for the
  length of the move animation. Wait until the autosave's ply count matches the FEN before you
  judge anything, or you will report false bugs.

## 1. Games played

| # | Mode | Back rank | Result | Plies | Cross-check |
|---|---|---|---|---|---|
| g1 | Human = White | `SGAMKRNM` | Black wins by checkmate | 116 | ok |
| g2 | Human = White | `GGSBNKMM` | Black wins by checkmate | 94 | ok |
| g3 | Human = Black (board not flipped, see bug 3) | `ARKSSBML` | White wins by checkmate | 61 | ok |
| g4a | Human = Black, board flipped | `GNSNRKBG` | White wins by checkmate | 59 | ok |
| g4b | Human = Black, board flipped | `BARQKGNB` | White wins by checkmate | 37 | ok |
| c1 | Computer vs Computer | `RMKRSNNG` | Draw by repetition | 132 | ok |
| c2 | Computer vs Computer | `QMBSKRGB` | Draw by repetition | 74 | ok |
| c3 | Computer vs Computer | `GMAKGRNM` | Draw by the 50-move rule | 385 | ok |

Computer vs computer: the move list grew every ply, the game-over dialog opened with a sensible
result, **Rematch** worked in all three (dialog closes, same back rank, move list back to zero,
sides swapped — `qa/c1-rematch.png`, `c2-rematch.png`, `c3-rematch.png`), and the HUD stayed live
throughout: `requestAnimationFrame` latency 0–3 ms at every 15-ply sample, with `#turn` and
`#status` tracking the game.

Flip, with the documented flow (set the dropdowns, then press New game): rank 8 sits at the bottom
and the h-file on the left, and `placeCoords` turns the coordinate quads to match
(`qa/stress-flip-black-bottom.png`, `qa/g4-flipped.png`). Measured `screenOf`:
a1 (845,208), h1 (174,208), a8 (845,743), h8 (174,743) — a clean mirror of the unflipped pose.
Picking is unaffected by the flip; every click in g4a/g4b landed on the intended square.

### Fairy checks

Each one screenshotted and cross-checked against the engine at that ply — all matched.

| Event | Move | Screenshot |
|---|---|---|
| Archer shot | `Ac5*d4` (g1), `Ad6*d4` (c3), `Ab7*b5` (g4) | `qa/g1-archer-shot.png`, `c3-archer-shot.png`, `g4-archer-shot.png` |
| Paladin capture + self-removal | `Lh8xb2` (g3) | `qa/g3-paladin-capture.png` |
| Beast chain | `Sd4xe5xf6` from `7k/8/5p2/4p3/3S4/8/8/K7 w - - 0 1` | `qa/beast-full-done.png` |
| Beast chain cut short | `Sd4xe5` via **Stop chain here** | `qa/beast-stop-done.png` |
| Maester swap | `Mh8<>g7` (g1), `Mf1<>e2` (g2) | `qa/g1-maester-swap.png`, `g2-maester-swap.png` |
| Maester–king long swap | `Mh1<>e1` (g1), `Mh1<>f1` (g2), `Mg8<>c8` (g3) | `qa/g1-maester-long-swap.png`, `g2-maester-long-swap.png`, `g3-maester-long-swap.png` |
| Promotion | `a2-a1=Q` (g1), picker offers all 9 targets | `qa/g1-promotion.png`, `qa/promo-picker-open.png` |

The beast chain UI behaves as documented: after the first victim, **Stop chain here** appears, and
either clicking the next victim (`Sd4xe5xf6`, both pawns in "White took") or pressing the button
(`Sd4xe5`, one pawn) commits the right move.

## 2. Bugs found (ranked)

### Bug 1 — New game / Undo / Resign during the computer's move animation corrupts the game

**Severity: high. One click, always reachable, silent, and it keeps corrupting every later move.**
Pieces vanish from the board, one side gets several moves in a row, and the recorded game cannot be
replayed.

Reproduce — `npx tsx repro2.ts new` and `npx tsx repro2.ts undo` (3 of 3 tries each):

1. Set White and Black to Computer, press **New game**.
2. After a few moves, press **New game** (or **Undo**, or **Resign**) while the piece that just
   moved is still hopping — the window is the ~0.35 s of `animateMove`.
3. The move list of the *new* game fills with ghost entries: the move repeated with no piece letter
   and a leading space.

Observed (`repro2.ts new`, try 0, setup `MRGASQNK` → `KSBSNGGN`):

```
Nh1-g3,  h1-g3, Nh8-g6, e2-e4, d2-d4,  d2-d4, d7-d6, Ne1-d3,  e1-d3, f2-f4, Ne8-f6,  e8-f6, …
final fen: k2s1gg1/p5pp/3p4/4p3/1P2bp1P/1SKG4/8/6G1 w - - 1 25
```

Also reached by an everyday sequence — *switch White to Computer, then press New game*
(`npx tsx repro.ts 0 4`, 3 of 4 tries corrupt):

```
Na1-b3,  a1-b3, d2-d4,  d2-d4, Qc1-f4
fen: rkqsmrlg/pppppppp/8/8/5Q2/8/PPP1PPPP/RK1SMRLG b - - 2 2
```

Cause (read from the source, then confirmed with a stack trace on `localStorage.setItem`):

- `commit()` (`src/main.ts:102`) has no generation guard. It awaits `view.animateMove` (line 108)
  and afterwards unconditionally runs `busy = false; refresh(); save(); … void maybeAi();`
  (lines 110–113).
- `reset()` (`src/main.ts:170`) — reached from `newGame`, `undo` and `resign` — does `gen++` and
  `busy = false`, and its caller starts a fresh `maybeAi()`.
- When `reset()` lands inside that await, the stale `commit` resumes afterwards, writes the *new*
  game's save, and calls `maybeAi()` a second time. From then on **two AI loops run forever**: both
  search the same position, both get the same deterministic move, and both `commit` it.
- The second `commit` applies a `Move` whose `from` square is now empty. `makeMove` copies
  `board[from]` (= 0) onto `to`, **deleting the piece that just moved**, and flips the turn, so the
  same side moves again. `toLan` renders the empty square as `LETTERS[0]`, a space — that is the
  ghost `" h1-g3"` in the move list and in the autosave.

Fix sketch: capture `const g = gen` at the top of `commit()` and return after the await when
`g !== gen` — the same guard `maybeAi` already uses at `src/main.ts:122`.

### Bug 2 — a cancelled search can move every later search onto the main thread

**Severity: medium (responsiveness). Found by inspection; not reproduced in a probe, see below.**

`Engine.think` (`src/game.ts:100`) arms a fallback at `timeMs + 2500 ms` and, when it fires, sets
`this.worker = null` (`src/game.ts:114`) so later searches run inline. `Engine.cancel()`
(`src/game.ts:123`) terminates the current worker and immediately spawns a replacement — but the
terminated worker's pending `think` never answers, so its fallback fires 2.5 s later and nulls out
**the replacement**. Every search after that blocks the main thread inside `search()`.

So any New game / Undo / Resign pressed while the computer is thinking should silently downgrade
the AI to a main-thread search until the next `cancel()` spawns a worker again.

Not observed in practice: `npx tsx worker.ts` clicks Undo while `#status` reads `thinking…` (with
the Think slider widened to 2000 ms so the click lands inside a genuine search), waits past the
4500 ms fallback and samples 40 `requestAnimationFrame` gaps. Max latency was 2 ms, the same as
before the cancel. Either the fallback path is not reached as often as the code suggests, or a
200 ms inline search is too short to show up in that probe. The code defect is real; its cost is
unmeasured.

Fix sketch: capture the worker in the closure and only clear the field when it is still the same
one — `if (this.worker === worker) this.worker = null;`.

### Bug 3 — changing the White/Black dropdowns does not re-orient the board

**Severity: low.** `view.flip(...)` is only called from `newGame()` (`src/main.ts:185`) and at
startup (line 362). The `$('white').onchange` / `$('black').onchange` handler (line 296) updates
`sides` and restarts the AI but never flips, so a player who switches to Black mid-game keeps
looking at the board from White's side.

Reproduce: start a game, set White = Computer and Black = Human. The board does not turn — measured
`screenOf` is unchanged: a1 (845,208), h8 (174,743), i.e. still White at the bottom.
Screenshots: `qa/stress-flip-black-bottom.png` (correct, after New game) versus
`qa/stress-flip-after-dropdown-swap.png` and `qa/g3-not-flipped-after-dropdown-change.png`.

### Bug 4 — the board stays live while the promotion picker is open, so a move can be played twice

**Severity: medium.** `choose()` (`src/main.ts:143`) awaits `pickPromotion(...)` without setting
`busy`, so `view.onSquareClick` keeps accepting clicks. A second move can be played and committed
while the picker waits; answering the picker afterwards commits the *stale* promotion as well — the
same side moves twice and the opponent never gets a turn.

Reproduce — `npx tsx promo.ts`, from
`http://localhost:5222/?fen=7k%2FP7%2F8%2F8%2F8%2F8%2F8%2FK7%20w%20-%20-%200%201`
(both sides Human):

1. Click a7, then a8. The picker opens with 9 targets (`qa/promo-picker-open.png`).
2. With the picker still open, click a1 then b1. `Ka1-b1` is played and it becomes Black's turn
   (`qa/promo-after-king-move.png`).
3. Click a promotion button. `a7-a8=Q` is played too.

```
moves: 1. Ka1-b1 a7-a8=Q      fen: Q6k/8/8/8/8/8/8/1K6 w - - 0 2
```

White moved twice; Black never moved; the FEN says White to move again. Screenshot
`qa/promo-after-answer.png`.

Fix sketch: the same guard as bug 1 — set `busy = true` (and `refresh()`) around the
`pickPromotion` await, and drop the result if `gen` changed.

### Bug 5 — the board sits high in its region on tall, narrow viewports

**Severity: cosmetic.** At 390×844 the canvas is 390×490 but the rendered board occupies only the
upper part, leaving a black band beneath it (`qa/stress-resize-390x844.png`). `resize()` keeps a
fixed frustum of 9.4 units and lets the aspect grow the vertical extent, so the spare room lands
below the board instead of around it.

## 3. Stress results

- **Undo ×5 mid-game, then carry on.** 28 plies → 18 plies (two plies per click against the
  computer, as intended), the Undo button enabled throughout, engine cross-check ok after the
  undos, and play continued normally to 20 plies with another clean cross-check.
  Screenshot `qa/stress-after-undo.png`.
- **Reload mid-game.** 20 plies before, 20 plies after; identical FEN and identical move list; the
  autosave restore cross-checks clean, and play continued. Screenshot `qa/stress-after-reload.png`.
- **Resize 800×600.** Canvas 540×600, panel 260 px at x=540, no horizontal scroll, `screenOf(a1)`
  on screen, a move played and cross-checked. `qa/stress-resize-800x600.png`.
- **Resize 390×844.** The `max-width: 720px` layout applies: canvas 390×490 on top, panel 390 px
  full width below, panel scrolls, no horizontal scroll, a move played and cross-checked.
  `qa/stress-resize-390x844.png`.

## 4. Console

**Zero errors and zero page errors in every run** — 8 games plus every stress and repro script.

The only warnings are four per run, all from the software GL stack of the headless environment and
none from app code:

```
[.WebGL-0x…] GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels
```

## 5. Environment caveat (not a bug)

A 16-core `npm run sim` (`--id ab-buff-big --games 15000`) was running throughout. During one
stress run every human move took 8–54 s from the first click to the autosave — plain pawn moves
included — purely from CPU starvation of the SwiftShader renderer and the search worker. Earlier
attempts at this task reported "move not registered" failures that were only this contention
against a 4 s harness timeout. Any timing figure here should be re-measured on an idle machine.
