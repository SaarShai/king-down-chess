# ux-defects: the pace menu did not open during a move animation

Status: ready-for-agent
Source: the change rehearsals and guard checks of 2026-11-25 ([ticket 10](10-change-rehearsals.md), [ticket 11](11-guards-that-cannot-fail.md), [ticket 12](12-lessons-and-checks.md))

## Problem

tools/app-ui.mjs:134-139 (`setPace`). The set-up clicks Menu while the pace is on. During the animation of a restored move, the click only skips the animation, so the menu stays closed and `selectOption('#pace')` waits 30 s.

Failing line (exact):

```
FAIL ux-defects         89.9 s  page.selectOption: Timeout 30000ms exceeded.  /tmp/kingdown-check-runs/king-down-chess-DXiR2Q/ux-defects.log
```

Runs (browser-default, attempt 1 red, attempt 2 green unless noted): 42253636436, 42260693988, 42267857847, 42283094786 (2026-11-06); 42351739134 (2026-11-07, attempts 1 and 2 red, not proven).

## Change

Built: 99b468176 adds a second Menu press when `#menu-sheet` is not open after the first press.

## Proof

Forced order: a Playwright route that delays the restored game data so the move animation starts at the Menu click (or call `window.view.scene` to start a long move animation just before `openMenu`). Without 99b468176: red with `page.selectOption: Timeout 30000ms exceeded.` With it: green.

## Known limits

The repair presses Menu twice at most. An animation that lasts past the second press gives the same red.

## Work record

Built in 99b468176 (2026-11-07 08:33 UTC). Last failure: 42351739134 at 2026-11-07 07:32 UTC, before the repair. No failure after it.
