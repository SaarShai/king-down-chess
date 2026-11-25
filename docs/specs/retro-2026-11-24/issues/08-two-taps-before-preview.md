# Two taps before the preview reply make no move

Status: ready-for-agent

Source: ticket [07](07-plugin-app-workers.md) (the line 1379 red of `tools/plugin-app.test.ts`) and its independent review of head `571cbdfde`

## Problem

On a game that needs the server preview, a player who taps a piece and then its target before the preview reply gets no move and no message. No wrong move goes to the server.

The order in `src/plugin/screens/board.ts`:

- A view is unchanged when it has the same game, revision, FEN, status and engine (`:798`). An unchanged view keeps the preview (`:810` to `:816`). Each other view clears the server preview (`:818`) and asks for a new one (`restorePreview()`, `:858`).
- Until the reply, `previewWaits()` is true (`:176`), so `blocked()` is true (`:177`) and `canPlay()` is false (`:184`). The board shows no wait state for the preview: it shows the read words of a tap, as ticket 87 says.
- A tap on an own piece in that time only reads the square and keeps it as `earlyTap` (`:448`).
- A tap on the target next clears `earlyTap` (`:431`). The target is empty, so `:442` clears `selected` and `inspected`.
- The reply (`:370`) then has no kept tap to apply. Nothing is selected and no move stages.

Ticket 87 (`docs/specs/staging-first-game/issues/87-early-tap-before-preview.md`) keeps one tap only. Its tests do not tap two squares before the reply.

Which games need the server preview: `remote()` (`:165`) calls `needsServerPreview` (`src/account-game/engine-identity.ts:4`). It is true when the game has no engine, when the page has no engine of its own, or when the engine of the game is not the engine of the page. A game with no engine gets a read notice, not a preview (`board.ts:349`); a game gets its engine when it starts (`src/match/service.ts:225`). The production builds of the plugin (`tools/plugin-ui-build.mjs:41`) and of the website (`vite.config.ts:206` to `:207`) set the page engine. So a player meets the fault on a game with another engine than the page, for example a game that started before an engine release. The test harness with the source page has no page engine, so there each game needs the server preview.

## Change

Two options:

1. Keep the tap on the piece, and apply the tap on the target after the reply. While the preview waits, a tap on a target square after a kept piece tap is kept too. When the reply stages no move, the board applies the two taps in order (select the piece, then play or offer the move).
2. Show a wait state while the preview waits, so the player knows that a tap does not play yet.

The pick is option 1. It keeps what ticket 87 started (a tap before the reply is not lost), and it adds no new words or looks. The replay must stay as safe as in ticket 87: it plays a move only through the normal `select()` path, and only when `canPlay()` is true after the reply. A tap when it is not the player's turn stays a read. A reply that restores staged draft steps keeps the taps as reads.

## Test that fails first

A browser test in `tools/plugin-app.test.ts`, near the ticket 87 tests:

- Open a friend game where this player moves (as in "recovers a held move at 10 seconds and ignores its late reply").
- Hold the first `kingdown_preview` reply. The harness hook `holdNext = 'kingdown_preview'` does this (ticket 87 uses it); a Playwright route that delays the request also works (`held-force.patch` of ticket 07). Set the hold before the read that draws the board: the board asks for the preview during that read.
- Tap e2, then e4, through `board.screenOf`.
- Release the reply (`releaseHeld()`).
- Expect the staged move `e2-e4` and `#end-turn[aria-disabled="false"]`, with no more taps.

Nobody has run this test yet. The expected result on the current code is a red: no move stages and End turn stays off. The evidence is the forced red of ticket 07: the held move test without its repair taps e2 and e4 before the reply, and the click on `#end-turn` waits until its 5 s limit.

## Class

B: new behaviour on one screen, the plugin board. It runs in ChatGPT and on the account pages of the website (`src/online/entry.ts` loads `src/account-game/runtime.ts`).

## Checks

- The new test fails before the change and passes after it.
- The ticket 87 tests in `tools/plugin-app.test.ts` pass: the three cases of "draws Maester swap marks through the shared board adapter" (a tap after the reply, before the reply, and before the reply then Escape) and "keeps a tap before a restored draft preview as a read".
- A mutation check: drop the kept target tap, and the new test fails.
- `npm run test:changed`, then the class B path of `docs/CHANGES.md`, with `npm run check:browser plugin-oauth plugin-ui plugin-ui-http plugin-skylift plugin-privacy`.

## Known limits

- Not built. This ticket holds the fault and the plan only.
- Not measured: how often a player meets a game that needs the server preview, and how long the reply takes on a slow network.
- Option 1 keeps two taps. The rule for a third tap before the reply is part of option 1: a new tap on an own piece replaces the kept pair. The change has one check for this rule.
