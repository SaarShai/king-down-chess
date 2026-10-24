# Interface objects and replies

Status: ready-for-review

## Scope

Add five local samples to `preview/gui/`. Keep all 18 accepted sample definitions and render code. Use the same player clock. Do not change production code or send a message, request or clipboard write.

## Plan and checks

1. Audit the shipped screens and accepted samples. Record the actual feature source for each new case.
2. Build card coin spend and draw offer reply first. Check syntax, assets and the real card fixture. Mark these two IDs in `preview/gui/EARLY_READY.md`.
3. Add opponent found, both players ready and invite copied. Keep each action brief and text in fixed places.
4. Check deterministic seek, replay, pause, speed, hidden page pause, OS/manual reduced motion, keyboard and touch. Render all new samples at 390 px and 1280 × 720. Compare the accepted implementations with their baseline.

## Audit

- `src/plugin/screens/board.ts`, `strips()`, keeps each card coin in its slot and reads the spent bit. `board.css` has a 300 ms spend pulse. This is distinct from the accepted full-card deal/select/refill sequence and the power use counter.
- `src/plugin/screens/board.ts` displays an offered draw and waits for a reply. `board-actions.ts` supports offer, accept and decline. The accepted dialog covers only open/close; the new sample covers waiting and a declined reply.
- `src/plugin/screens/wait.ts`, `found()`, shows Opponent found with Switch now and Not now. The new sample preserves that choice and does not switch games.
- `src/plugin/screens/seat.ts`, `render()` and `finish()`, shows each player's ready state, then enters the game after both are ready. The new sample shows confirmation only and keeps the other army hidden.
- `src/plugin/screens/friend.ts` shows six code tiles. `src/plugin/invite.ts`, `sendInvite()`, gives Copied feedback. The new sample uses a marked sample code and does not copy it.
- No captured-piece tray exists in the shipped plugin screens. Skip this candidate. The accepted promotion choice already covers the choice object. Skip a second promotion sample.

## Result

Five new samples are ready. The page has 23 samples: the 18 accepted samples and these five additions.

| ID | Actual feature source | Visual treatment | Duration |
| --- | --- | --- | --- |
| `coin-spend` | `src/plugin/screens/board.ts`, `strips()`; `board.css`, `card-spend`; `board-model.ts`, `cardCoins()` | One short frost release from the Freeze coin. Its art stays in the same spent slot. Other slots stay still. | 2.5 s |
| `draw-reply` | `src/plugin/screens/board.ts`, draw-offer context; `board-actions.ts`, `confirmDraw()` | Gold impression on the offer notice. Still wait. A declined reply gives one quiet paper settle. | 3.1 s |
| `opponent-found` | `src/plugin/screens/wait.ts`, `found()` | Painted profile portrait and warm contact on the notice. Switch now and Not now stay in place for the choice. | 2.6 s |
| `setup-ready` | `src/plugin/screens/seat.ts`, `render()`, `ready()` and `finish()` | Two separate Ready seals, one for each player. Brief warm contact. The other army stays hidden. | 3.0 s |
| `invite-copy` | `src/plugin/screens/friend.ts`, code tiles; `src/plugin/invite.ts`, `sendInvite()` | Fixed six-tile source. Short light sweep, a paper copy impression, then an ink check. | 2.4 s |

Use `preview/gui/index.html?sample=<ID>` through Vite. `EARLY_READY.md` exposes the first two samples before the final pass.

## Files and copy boundary

- `objects.js`, `objects.css`, `card-fixture.json`: first two samples. These files are stable.
- `arrivals.js`, `arrivals.css`: remaining three samples. These files are complete.
- `main.js`: two imports and two registrations only. The accepted player clock and sample implementations are unchanged.
- `index.html`: two CSS links only.
- `verify-objects.mjs`: focused local checks and renders. It starts and closes its own Vite server and browser.
- `samples.js` and `style.css`: unchanged from the accepted baseline, byte for byte. Do not copy them as changes.

## Evidence

- JavaScript syntax checks pass for `main.js`, `objects.js`, `arrivals.js` and `verify-objects.mjs`.
- The browser-safe Freeze fixture matches `SHARED_MECHANICS` exactly. `GameRules` finds one legal `!F:d5` action. All source expectations pass: unchanged knight, spent card bit, mark, turn, forbidden knight move and rule value. The browser imports no Node assertion code.
- `node --import tsx docs/specs/effects-animation/preview/gui/verify-objects.mjs` passes for all five new samples. Set `GUI_BASELINE_DIR=/tmp/effects-ui-baseline` to include the saved pre-change sample comparison.
- The final run checks 144 frames: 90 new-sample frames at 390 × 844 and 1280 × 720, plus 54 accepted frames. All 54 accepted stage PNGs match the saved baseline exactly at 0%, 45% and 100%.
- Forward and reverse seek return identical DOM states. Query links, replay, pause, speed, range input, keyboard, touch action/pause/picker and manual/OS reduced motion pass. No separate effect animation runs under reduced motion.
- The visibility-change handler pauses playback. The check sets document visibility and sends the event; it does not switch a physical browser tab.
- No horizontal overflow occurs at 390 px. The new samples put controls above the stage on phones. Titles, result text and buttons stay inside the stage. Desktop controls stay in view at 1280 × 720.
- All fonts and art decode. No console, page or HTTP errors occur. Requests use GET only. Clipboard and share intercepts record no writes.
- Twenty action/result renders and `report.json` are in `/tmp/effects-ui-objects/`. Desktop and phone results are inspected for complete art, readable text and stable object slots.
- The optional baseline server route first hit Vite's page fallback. The check now installs its route before that fallback. The comparison then passes. This repair changes only the check.

## Limits and next step

These are object-only local UI studies. Server states use fixed examples. The notice buttons show the real choice but do not switch a game or send a reply. Invite copy gives a local sample result and does not touch the clipboard. The opponent portrait is an existing profile icon, not a revealed army.

No production source, game rules, shared fixtures, accepted sample implementation or character-animation files change. No dependency, commit, PR, deployment, generated image or credential is used. No full game test suite runs. The focused study check is not the registered whole-workshop check; the integration owner updates that check's GUI count from 18 to 23 and runs it in the integration copy. Visual review of these five new samples remains open.
