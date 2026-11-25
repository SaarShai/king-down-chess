# A failed board load on a result reload shows the boot fault under Home

Status: needs-triage.

Source: ticket [10](10-red-by-name-checks.md), the `next-menus` cases of the lane notes.

## Problem

- A player reloads the page while the result card is open, and the board code cannot load (a failed file or a bad network).
- Home opens, as it must (`src/interface/play/main.ts:2258-2268`). But the boot fault of `next.html` also shows at the end of the page: "King Down. The game cannot load. Try again."
- So the player sees Home and a second message that says that the game cannot load.

## Red assertion

`tools/verify-next-menus.mjs`, case `code_fault`: "a result card with no board code opens Home" (`#boot-fault` count is not 0).

## Evidence

- A diagnostic run on the launch tree (`KINGDOWN_TEST_PAGES=1 MENUS_CASES=code_fault npm run check:browser next-menus`, service workers blocked, 2026-11-25 11:48) recorded the page after the reload. At 11 of 17 sizes: `.play-home h1` is there, `#boot-fault` count is 1, `.people-loading` count is 0. At the other 6 sizes `#boot-fault` count is 0. So it is a race.
- The likely cause, from a read of the code only: the boot fault of `next.html:13-33` shows on a failed script or module preload until `window.kdBooted` is true. On the launch tree `src/interface/launch-entry.ts:9-12` sets `kdBooted` only after `startPlatform()` ends, and `startPlatform()` waits for the main module and for the first child of `#app` (`src/interface/platform.ts:42-45`). The result restore starts the board code load before that (`main.ts:2262`), so a failed board file can come first.
- Not known if the off tree has the fault: there `src/interface/entry.ts:6` sets `kdBooted` right after the main module loads. No off-tree run exists.

## How a player reaches it

Finish a game, keep the result card open, and reload the page on a network that fails to send the board code file.
