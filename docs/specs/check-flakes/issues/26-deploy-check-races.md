# 26 Two browser checks that read the page before its start-up ends

Status: claimed
Branch: claude/strange-chaplygin-aae068
Scope: tools and check scripts only. No `src/` change, no longer time limit, no retry.

## Problem

On 2026-10-19 the production deploy (`tools/deploy.sh --publish`, which runs `npm run check:browser`, 24 checks, on this Mac) failed two times at `dcf1a235`, each time on a different check. Other sessions ran browser checks at the same time and the Mac load was high. Both checks passed in the morning deploy and in CI. The commit changed only `src/plugin/server.ts`.

1. `painted-game`, `tools/verify-painted-game.mjs:272`, "lessons leave the saved game alone": the saved game had `"link":0` where the check expected `"link":1`. All other fields were equal.
2. `visual-design`, `docs/visual-design/verify.mjs:62`: `assert.equal(await arriveContinue(page).isVisible(), true)` failed right after `open('', { skipTitle: false, save })`.

## Plan

1. Find what changes `link` during the lessons, and why Home is not visible yet.
2. Fix each check so that it waits for the state that it reads. Keep each assertion and each time limit.
3. Prove the cause with a reproduction that fails on the old waits and passes on the new waits.
4. Run each changed check several times through `tools/test-lock.sh`, one browser run at a time, on this Mac and on the M1, and one time under load.

## Checks

- [x] Each failure has a cause with evidence (Comments).
- [x] A reproduction gives the deploy failure with the old waits and equal saves with the new waits.
- [ ] `painted-game` and `visual-design` pass several times on this Mac and on the M1, and one time under load.
- [x] No `src/` change, no longer time limit, no retry.

## Comments

### Cause 1: painted-game reads and writes the save before the page's start-up save

- The start-up in `src/main.ts` is: `play.restore(...)` (line 186) draws the game on the board at once (`view.sync`). Then `await view.ready()` (line 188) waits for the board art: `scene.load()` decodes the stone art (`boardArt.decode()`, `docs/2d-first-pieces/board/scene.mjs:952`) and then waits one animation frame (`src/render/PaintedView.ts:95`). Then, in one synchronous step, main.ts clears "Loading pieces…" (line 189) and writes the start-up save, `if (!fen) play.save()` (line 195).
- The page's load event does not wait for the decode or for that frame. Thus `page.reload()` or `page.goto()` returns, and `waitForFunction(() => window.view.pos.board[36] > 0)` passes at the `restore()` step, before the start-up save. Under CPU load the decode is slow, and this window opens.
- In case 2f the check then does two things in the window:
  1. On the sender page (Black, `link: 1`) it replaces the save with the friend's save (`moves: ['e2-e4']`, `link: 0`). The sender page's start-up save then writes over it: `moves: ['e2-e4', 'e7-e5']`, `link: 1`.
  2. On the friend page (the link opens, White to move, so `linkSide = 0`) case 2g reads `before` from that old save (`link: 1`). Then the friend page's start-up save writes `link: 0`. The lessons start after this, so the end read gives `link: 0`.
- The lessons do not change the save. `save()` in `src/screen/play.ts:707` keeps the saved game during a lesson and changes only the settings (`{ ...kept, ...settings.settingsNow() }`). Thus this is a check timing fault, not an app fault.
- Reproduction (a scratch script against the dev server; it slows `HTMLImageElement.decode` by 2 s, which ends after the load event as a slow decode under load does):

  | Waits | The friend's save after the sender page settles | `before` read by the check | The save after the friend page settles |
  | --- | --- | --- | --- |
  | Old (`board[36] > 0`) | `e2-e4 e7-e5`, `link: 1` (the seed is lost) | `e2-e4 e7-e5`, `link: 1` | `e2-e4 e7-e5`, `link: 0` |
  | New (also "Loading pieces…" cleared) | `e2-e4`, `link: 0` (the seed stays) | `e2-e4 e7-e5`, `link: 0` | `e2-e4 e7-e5`, `link: 0` |

  The old row is the deploy failure: only `link` differs.
- Fix: after `page.reload()` and after `page.goto(sent.href)`, case 2f also waits until `#asset-status` is empty. `index.html` starts it as "Loading pieces…", and main.ts clears it in the same step as the start-up save. `tools/verify-link-game.mjs:50` uses the same wait.

### Cause 2: visual-design reads Home one time, before Home opens

- `open()` waits only until `window.view.ready` exists. Home opens after `await view.ready()` (`src/main.ts:194`, `if (showHome) home.open()`), so the same art decode delays it. `locator.isVisible()` reads one time and does not wait.
- Fix: `await arriveContinue(page).waitFor()` before the assertion. It waits for a visible Home or title Continue with the default time limit. The assertion stays.
