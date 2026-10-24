# GUI motion studies

Status: ready-for-review

## Scope

Make a review page for GUI effects. Keep all work in this preview folder and this ticket. Use the game fonts, tokens and art. Do not change the live game.

## Plan and checks

1. Build a shared, time-based review player. Show victory and the timer first.
2. Add the remaining GUI states with distinct, readable motion.
3. Check every sample at start, middle and end. Check replay, pause, seek, speed, keyboard, reduced motion and a 390 px view. The parent checks the browser renders.

## Limits

The page shows UI studies without a board. It makes no game, server or account changes. Timer seconds are a sample, not a live clock.

## Result

The review page is ready at `preview/gui/index.html`. It has 18 studies:

- Victory; timer warning and expiry; game and army reveal; turn handoff; check.
- Defeat; draw; abort or no start.
- Cards: deal, select, use and sample refill; one power use spent; promotion choice.
- Move sent; send failure; undo and replay.
- Dialog open and close; button feedback; connection lost and restored; lesson complete.

The page imports `src/style.css`. It uses the live fonts, colors and card, piece, king and emblem art. Only the chosen study is in the page. A time-based render drives every effect, so pause, seek and speed share the same state. Reduced motion shows the end state with no running frame loop. The checkbox and OS preference changes use one handler, so enabling the OS setting during playback stops and settles the study at once. A hidden tab pauses. `window.effectsStudy` gives ready, select, seek, state and the sample list. Ready waits for fonts and art.

## Evidence

- `node --check` passes for both JavaScript files, including the OS reduced-motion change listener fix. The page also declares the game favicon.
- A small assert check passes for the 16 added studies: unique IDs, ordered phases within each duration, a render function and all referenced art files present.
- The parent opened the first victory and timer samples in the browser. Owner feedback: “interface effects look great.” Keep this direction.
- The short desktop layout hides the masthead in an embedded frame, keeps a smaller stage, and lets the study list scroll. Phone layout uses a select control and normal page scroll.
- The parent checks all final browser renders and controls after integration. No full test suite ran in this worker.

## Review limits

The victory study begins after the live final-blow replay and fallen king. No board is drawn here. Timer seconds, refill, game history and connection states are examples. No rule, server, account, game state or production source changes. No deploy.
