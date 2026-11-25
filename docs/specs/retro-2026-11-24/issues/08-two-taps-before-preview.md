# Two taps before the preview reply make no move

Status: ready-for-agent

Source: ticket [07](07-plugin-app-workers.md) (the line 1379 red of `tools/plugin-app.test.ts`) and its independent review of head `571cbdfde`

## Problem

On a game that needs the server preview, a player who taps a piece and then its target before the preview reply gets no move and no message. No wrong move goes to the server.

The order in `src/plugin/screens/board.ts`:

- A new view with a change (a new revision, FEN, status or engine) clears the server preview (`:818`) and asks for a new one (`restorePreview()`, `:858`). An unchanged view keeps the preview (`:810` to `:816`).
- Until the reply, `previewWaits()` is true (`:176`), so `blocked()` is true (`:177`) and `canPlay()` is false (`:184`). The board shows no wait state for the preview: it shows the read words of a tap, as ticket 87 says.
- A tap on an own piece in that time only reads the square and keeps it as `earlyTap` (`:448`).
- A tap on the target next clears `earlyTap` (`:431`). The target is empty, so `:442` clears `selected` and `inspected`.
- The reply (`:370`) then has no kept tap to apply. Nothing is selected and no move stages.

Ticket 87 (`docs/specs/staging-first-game/issues/87-early-tap-before-preview.md`) keeps one tap only. Its tests do not tap two squares before the reply.

Which games need the server preview: `remote()` (`:165`) calls `needsServerPreview` (`src/account-game/engine-identity.ts:4`). It is true when the page has no engine of its own, or when the engine of the game is not the engine of the page. The production builds of the plugin (`tools/plugin-ui-build.mjs`) and of the website (`vite.config.ts`, `account-engine-identity`) set the page engine. So a player meets the fault on a game with another engine, for example a game from before an engine release. The test harness with the source page has no page engine, so there each game needs the server preview.

## Change

Two options:

1. Keep the tap on the piece, and apply the tap on the target after the reply. While the preview waits, a tap on a target square after a kept piece tap is kept too. When the reply stages no move, the board applies the two taps in order (select the piece, then play or offer the move).
2. Show a wait state while the preview waits, so the player knows that a tap does not play yet.

The pick is option 1. It keeps what ticket 87 started (a tap before the reply is not lost), and it adds no new words or looks. The replay must stay as safe as in ticket 87: it plays a move only through the normal `select()` path, and only when `canPlay()` is true after the reply. A tap when it is not the player's turn stays a read. A reply that restores staged draft steps keeps the taps as reads.

## Test that fails first

A browser test in `tools/plugin-app.test.ts`, near the ticket 87 tests:

- Open a friend game where this player moves (as in "recovers a held move at 10 seconds and ignores its late reply").
- Hold the first `kingdown_preview` reply. The harness hook `holdNext = 'kingdown_preview'` does this (ticket 87 uses it); a Playwright route that delays the request also works (`held-force.patch` of ticket 07).
- Tap e2, then e4, through `board.screenOf`.
- Release the reply (`releaseHeld()`).
- Expect the staged move `e2-e4` and `#end-turn[aria-disabled="false"]`, with no more taps.

On the current code the test fails: nothing is selected and End turn stays off.

## Class

B: new behaviour on one screen, the plugin board. It runs in ChatGPT and on the account pages of the website (`src/online/entry.ts` loads `src/account-game/runtime.ts`).

## Checks

- The new test fails before the change and passes after it.
- The ticket 87 tests pass: one tap before the reply, the same tap then Escape, and the restored draft that moves another piece to the tapped square.
- A mutation check: drop the kept target tap, and the new test fails.
- `npm run test:changed`, then the class B path of `docs/CHANGES.md`, with `npm run check:browser plugin-oauth plugin-ui plugin-ui-http plugin-skylift plugin-privacy`.

## Known limits

- Not built. This ticket holds the fault and the plan only.
- Not measured: how often a player meets a game that needs the server preview, and how long the reply takes on a slow network.
- Option 1 keeps two taps. A third tap before the reply (for example, a second piece) needs a rule too: the simplest is that each new piece tap replaces the kept pair.
