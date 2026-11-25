# The account discovery check follows the launch tree

Status: done on branch seam-checks.

Class: B (a check script only). Size: S to M.

Source: ticket [06](06-ci-launch-tree.md), "Found fault".

## Problem

- `account-discovery` runs only by name. Since ticket 06 its site is the launch tree, and the check is red: it stops at `tools/lib/account-discovery-check.mjs:81`.
- At that line the check is on the sign-in page of `/play/` and follows "Play on this device". The link goes to `/` (`src/online/entry.ts:67`). On the launch tree `/` is the new page. The check waits for the old board there.
- Lead decision, 2026-11-25: the link is correct. On the launch tree, `/` is the page where a player plays on this device. The check is wrong, not the page.

## Change

- From line 81 on, the check follows the journey of the launch tree: the link opens the new page, and each later step uses the new page. A step that is about the old board only uses `oldBoard()` (`tools/lib/checks.mjs`).
- A step that has no meaning on the launch tree goes, with a `Removed-check:` trailer that gives the reason.

## Test that fails first

The check itself: `npm run check:browser account-discovery` is red today at line 81.

## Checks

- `npm run check:browser account-discovery` is green.
- `KINGDOWN_TEST_FILE=tools/checks.lint.test.ts npm test`.

## Known limits

- Ticket [07](07-remove-off-build.md) removes the off build. Do this ticket before ticket 07 or with it.

## Work record

Commits `03a0ac991` and `232ae66a7`, `tools/lib/account-discovery-check.mjs` only.

- The old board: `origin + '/index.html'`, not `oldBoard()`. This check serves its own site with its API and database (`tools/web-game-check.mjs:89`), and its registry line (`tools/lib/registry.mjs:106`) has no `site`. `oldBoard()` reads the runner's preview site, a different origin. The lead's lane notes confirm this. So the Change section above is not followed to the word.
- The context has the seen mark `kingdown.solo-launch-seen`, as `tools/web-game-check.mjs:251` and `tools/lib/signin-speed-check.mjs:24` have. The hosted staging context has it too.
- Each "Play on this device" now waits for `/` and `.play-home h1` (`playHere`). The next old board step opens `/index.html` again (`backToBoard`). The save checks after each cancel (`Cancel sign-in`, `Home round trip`, `Menu round trip`) run on the new page and hold.
- The own solo account game: the row click on `/play/` opens `dialog.launch-handoff` with the title "Play on this device" (`src/online/launch.ts:108-111`). The path stays `/play/`. Before, the check waited for the board and the path `/g/<id>`. Trailer: `Removed-check` for that step.
- Offline, Chromium logs "Failed to load resource: net::ERR_INTERNET_DISCONNECTED" for character frames. A diagnostic run (12:02, folder seam-checks-TwlyLC) shows that each failed frame load started before the switch: 95 frame loads start online, none starts offline, and 3 fail at the switch. The worker does not keep frames, and the runtime asks for no art offline (`src/render/painted/character-runtime.mjs:91`, `docs/specs/ship-character-runtime/issues/01-webp-package.md:65`). So the page console allows that one message, and two new rules fill `requests`, which must stay empty: a frame request that starts offline, and any other failed page request offline. The worker's own network tries are not page requests: the worker then answers from its cache.

Red runs, each with its cause before the next edit:

1. 11:31, folder seam-checks-Twvfii, 21.9 s: the path after the row click is `/play/`, not `/g/<id>`. Cause: the hand-over refuses the game read, so the list stays.
2. 11:32, seam-checks-6nhDke, 21.6 s: `assertNoErrors`, 4 × ERR_INTERNET_DISCONNECTED. A diagnostic run (11:33, seam-checks-K2T2JR) logged the failed requests: six `/character-runtime/assets/<hash>.webp` files of white idle and turn banks, from `/index.html` while offline.
3. 11:35, seam-checks-znAHNT, 17.4 s: the new offline rule recorded `/index.html`. Cause: the worker's network-first try for the page fails offline; the page gets the cached copy.

Green runs: `npm run check:browser account-discovery`, 11:36, folder seam-checks-ZfGeWM: ok 19.0 s, 1 passed. After `232ae66a7`: 12:03, folder seam-checks-8MotAj, ok 18.5 s, 1 passed. Its PASS line names the cancel to the new page, the offline move and reload, and the hand-over.

`KINGDOWN_TEST_FILE=tools/checks.lint.test.ts npm test`: 31 passed.

Not verified:

- WebKit, and the hosted staging block (it runs only with `KINGDOWN_HOSTED_SIGNIN_ORIGIN`).
- That the off tree was green after line 81: no off-tree log exists.
- The allowed console message hides the count of frame loads cut by the switch. The check does not prove that the board draws the plain figure for each one. The offline move and the reload with the move pass.
