# Lessons: Browser checks and UI

The lessons on browser checks, screenshots and the game interface. [LESSONS.md](../../LESSONS.md) holds the Always rules and the index of all topic files.

## 2026-10-02 — the cloud Chromium build for Playwright
- Cloud sessions ship a Chromium build that Playwright 1.63 does not look for. → `.claude/hooks/cloud-setup.sh` links it (`tools/pw-cloud-link.mjs`); run browser tools with `PLAYABLE_BROWSER=chromium`. (2026-10-02)

## 2026-10-02 — a timing check failed for reasons outside the code
- A new timing check failed twice for reasons outside the code: its King-walk position (two bare kings) was an immediate draw, so no move could be played; and the Fast timing ran on into the computer's reply, which started the moment the timed move ended. → Test positions need material on both sides (or check the game is not over), and time only the animation you mean: `view.scene.playing` names it, so stop when it changes. Also: a background wait `while pgrep -f "tools/qa.mjs"` matched its own shell's command line and never ended; wait on the PID (`kill -0 $pid`). (2026-10-02)

## 2026-10-02 — "byte-identical" means the same environment
- The committed trial strike sheets differ byte for byte from a fresh run on unchanged `main` in a cloud session (another Chromium build). → "Byte-identical" means identical to the same tool's run on `main` in the same environment; save that run first, then compare. (2026-10-02)

## 2026-10-02 — a service worker hid the load cost
- A load measurement with a service worker looked 4× faster and showed 0.14 MB transferred: once `clients.claim()` took over, the page's files came through the worker, whose own fetches the CDP network emulation does not throttle or count. The worker had also started precaching on `load`, in parallel with the first visit's own downloads. → Register the worker only after the board is drawn, and cross-check every load measurement with one run under `serviceWorkers: 'block'`; the numbers must agree. Bound any wait on `navigator.serviceWorker.ready`: it never resolves on a page with no registration, which hung the first script for 28 min. (2026-10-02)

## 2026-10-02 — take a tool baseline from a clean worktree
- A baseline of the browser tools on main ran with tool files already edited for the new UI (Guide cards, title skip), so `verify-playable-clay.mjs` "failed on main" waiting for `.piece-card`, a selector main's build cannot have. Screenshot runs against the same preview server during that baseline also coincided with a clay figure's "Failed to fetch". → Take a baseline from a clean worktree of the base branch (`git worktree add /tmp/main-wt main`, symlink `node_modules`), and run nothing else against its server while it runs. Then edit tools. (2026-10-02)

## 2026-09-29 — a lesson saved its position over the match
- A lesson's `save()` guard did not protect the match: changing a player cleared lesson mode first, then saved the lesson position over the match. → Keep the live `Game` separate from the lesson `Game`, preserve its rules and player sides, and test lifecycle controls as well as lesson moves. Lessons must run under the rules their instructions teach. (2026-09-29)

## 2026-09-27 — a moved control broke the selectors of two tools
- Moving the lessons button into the Guide dialog broke two tools that closed the Guide with `#rules button` (strict mode: two buttons). Only the painted check was rerun after the move, so the break showed one batch later. → After adding or moving a control, grep the tools for selectors of that container (`grep -n "#rules button" tools/*.mjs`) and prefer specific selectors (`#rules form button`); rerun every tool after any UI move, not only the one that tests the feature. (2026-09-27)

## 2026-09-27 — a changed default broke `tools/qa.mjs`
- Painted became the default look and three browser tools were pinned to clay, but `tools/qa.mjs` was missed: after the switch it failed 15 of 17 cases with `window.view.pieces is not iterable`, and its Ogre cases still expected rules and dialogs that had changed. → When a default changes (look, rule mode, UI flow), grep every tool for what depended on it (`grep -l "window.view" tools/*.mjs`) and run each one, not only those you remember. (2026-09-27)

## 2026-09-27 — a fixed sleep for a camera tween
- A browser check slept 450 ms for a 400 ms camera tween. The renderer clamps each frame step to 50 ms and headless WebGL draws ~21 fps, so animation time runs slower than wall time and the drag aimed at a moving camera. → Never wait a fixed time for an animation in a browser check; wait on its state (`window.view.tweens.list.length === 0`). (2026-09-27)

## 2026-09-27 — the same trap, twice more: assert the state change
- The same trap, twice more (2026-09-27): a clay skip check timed from tap to settled board read 667 ms (headless WebGL rebuilt the figure), though the skip itself was instant; and the painted phone screenshot waited only for the canvas size, so it showed "Loading pieces…". → Assert the state change itself (`view.moving` false right after the tap), and take screenshots only after `view.ready()`. Time a behaviour only against its own control in the same run (Normal vs Fast).

## 2026-09-26 — board feedback hidden below a tall board
- Board feedback can exist in the DOM and still be invisible below a tall board. → Responsive verification must check the actual status rectangle after board interaction, not only horizontal overflow or successful clicks. In a board editor or static mockup, check the full grid against fixed headers and action bars at the actual viewport height; a width-only check can miss a hidden last row. Size the grid from the actual panel width and measured header, controls, help and save-alert heights, including the failure state. Zero-action selections must not instruct the player to choose a nonexistent marker. (2026-09-26)

## A click on the 3D board can land on the piece in front of the square (2026-09-14)
- **Mistake:** the v0.7.0 QA harness clicked `view.screenOf('d5')` to capture with the paladin on
  d4. The raycast hit the paladin, the click re-selected d4, and the move never played — 30 s spent
  waiting for a ply that could not come. At the 54 deg camera a tall mesh covers the tile centre of
  the square behind it.
- **Rule:** hover first and read `#hover` (it names the square the raycaster picks); click only when
  it names the square you want, else move ~18 px up the screen and probe again.
- **Same session, second trap:** `refresh()` publishes the move list, the FEN and the took-lists
  *before* `animateMove` runs, so a fixed `waitForTimeout` after a click reads a half-animated
  scene — `view.pieces` still held the pre-move board and the burst count was 0. That looks exactly
  like a stale-renderer bug. Wait for the autosave's `moves.length`; it is written after
  `view.sync()`.

## Playable clay picking and layout — 2026-09-22
- Three.js raycasts invisible label sprites. A hidden letter chip above a king/queen intercepted the pawn square even after the sculpt fitted the square; skip invisible ray hits and test all eight initial pawn-square centres with real pointer input. Reducing the visible model alone did not repair the interaction.
- A responsive canvas inside CSS grid needs an explicit `minmax(0, 1fr)` column and `min-width: 0`; otherwise resizing from a wide viewport can preserve an oversized intrinsic canvas column. Keep the mobile HUD above the board, and verify both resize and actual element bounds, not just document overflow.
