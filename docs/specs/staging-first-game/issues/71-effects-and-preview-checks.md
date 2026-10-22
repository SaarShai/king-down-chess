# Fix the king-effects and gui-board-preview browser checks

Status: resolved on branch `staging/lane-fxfix` (from `staging/integrate` `6c2920a9`); not merged, not deployed.

## What

Two browser checks fail before the staging release. The full `npm test` passes on `6c2920a9`.

1. `npm run check:browser king-effects` fails: `title with Animations Off: 19 entrance animations run` (19 !== 0).
2. `npm run check:browser gui-board-preview`, run alone, fails at 12.7 s: `page.goto` opens `undefined?title=0&players=human,human&fen=...`.

## Why

A saved Animations Off must still the title for a player. A check that fails when it runs alone hides real faults.

## Scope

- `src/screen/save.ts`, `src/screen/settings.ts`, `src/main.ts`, `src/screen/save.test.ts`: the page applies the settings of a saved game that cannot replay.
- `tools/check.mjs`, `tools/lib/registry.mjs`, `tools/check.test.ts`: a plugin check can declare that it opens the site.
- This ticket file. No check assertion is removed or relaxed.

## Cause

### king-effects

First bad commit: `c6ffec4d` "Integrate reviewed setup and browser-save continuity" (ticket 02, keep unreadable browser saves). It is older than every merge in `git log --merges -20`; `c4f3d3c3` and all later merges contain it.

Since `c6ffec4d`, `readSave()` replays the stored game. Data whose game cannot replay is `unreadable`, and `main.ts` then applies none of its settings. The check stores `{ moves: [], pace: 'off' }` (no `back`, no `fen`), so the page kept the default pace `normal` and set `data-pace="normal"`. The title CSS (`style.css`, `:root:not([data-pace='off'])`) then ran 19 entrance animations. A player whose saved game cannot replay loses Animations Off the same way.

Ticket 02 approves the preserved raw bytes and the blocked writes. It does not approve a loss of the player's settings, and it ran no browser check. So the check is not stale: the product is at fault.

Probe (`getAnimations` on `#title-screen` with `pace: 'off'` saved, built at each commit):

| Commit | `data-pace` | Animations |
| --- | --- | --- |
| `c6ffec4d~1` | off | 0 |
| `c6ffec4d` | normal | 19 |
| `c4f3d3c3` | normal | 19 |
| `6c2920a9` (probed at `51a1601e`, the same product files) | normal | 19 |
| fix `fde53fc5` | off | 0 |

### gui-board-preview

`tools/check.mjs` builds and serves the site only when a selected check runs a script other than `tools/plugin-browser-check.mjs` or `tools/web-game-check.mjs`. The board previews A8, A15, A17, A18 and A39 (`docs/specs/gui-previews-2026-10-19/capture.mjs`) also open the site at `PLAYABLE_URL`. Alone, the runner served no site, so `PLAYABLE_URL` was undefined.

## Fix

- `storedSettings()` (`src/screen/save.ts`) returns the settings fields of the stored JSON object. When `readSave()` reports `unreadable`, `main.ts` applies them. The page still writes nothing and keeps the raw bytes (ticket 02).
- A registry entry can set `site: true`. The runner then builds and serves the site. `gui-board-preview`, `gui-board-a8`, `gui-board-a15` and `gui-board-a18` set it. `--help` shows `(site)`.

## Acceptance

- `npm run check:browser king-effects` passes.
- `npm run check:browser gui-board-preview` passes alone and with `gui-board-a8`.
- `npm run check:browser home painted-game` passes (no check is named `title`).
- `npm run typecheck`, `npm run test:docs` and `KINGDOWN_TEST_FILE=tools/check.test.ts npm test` pass.

## Result

All browser checks ran with `PLUGIN_TEST_DATABASE_URL=postgresql://kingdown_test@127.0.0.1:55432/kingdown_lane_fxfix_test`.

- `npm run check:browser king-effects`: `ok   king-effects      105.2 s`, `check: all 1 passed`.
- `npm run check:browser gui-board-preview` (alone): `ok   gui-board-preview  162.6 s`, `check: all 1 passed`.
- `npm run check:browser gui-board-preview gui-board-a8`, load average about 8: `ok   gui-board-preview  160.8 s`, `ok   gui-board-a8       21.4 s`, `check: all 2 passed`.
- The same pair failed twice while another lane ran exclusive checks (load average 9 to 22): `FAIL gui-board-preview  139.6 s  locator.waitFor: Timeout 10000ms exceeded.` and `126.6 s` at the same step (A39, `#board-sheet[open]`, `capture.mjs:93`), after A8 to A27 passed. In the second run `gui-board-a8` waited for the shared test lock and stopped at `180.0 s  timed out at the 180 s limit`. The step uses no site URL. It passes at normal load. Note: gui-board-preview uses about 161 s of its 180 s limit at normal load.
- `npm run check:browser home painted-game`: `ok   home                8.3 s`, `ok   painted-game       88.2 s`, `check: all 2 passed`. No check is named `title`; king-effects covers the title.
- `npm run typecheck`: exit 0.
- `npm run test:docs`: `Test Files  13 passed (13)`, `Tests  166 passed (166)`.
- `KINGDOWN_TEST_FILE=tools/check.test.ts npm test`: `Test Files  1 passed (1)`, `Tests  7 passed (7)`.
- `KINGDOWN_TEST_FILE='src/screen/{save,play}.test.ts' npm test`: `Test Files  2 passed (2)`, `Tests  30 passed (30)`.
- Full `npm test`: `Test Files  1 failed | 254 passed (255)`, `Tests  1 failed | 4753 passed | 8 skipped (4762)`. The failure: `src/match/service.db.test.ts` > "runs a Daily friend game with the reviewed runtime role and refuses extra access": `error: relation "public.profiles" does not exist` (line 483). It fails the same way at `6c2920a9` with this lane's database (`Tests  1 failed | 25 passed (26)`), so this change does not cause it. The lane database has no `public.profiles` table; the release lane must run this file on a complete test database.
