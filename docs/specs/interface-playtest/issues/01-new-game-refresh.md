# New game panel and page icon

Status: resolved

## Fault

A signed-in player opens New game on Play. The panel closes by itself after
some seconds. Cause: the online host calls `home()` when the account or the
games list changes (sign-in at load, the session event, each home poll that
reads changed rows). `home()` replaces all children of `#app`. The open panel
was a child of `#app`, so the redraw removed it with its draft choices.

The page head had no icon link, so the browser asked for `/favicon.ico` (404).

## Changes

- The New game panel attaches to `<body>`, as the people sheets do. A redraw
  of Play no longer touches it. The panel keeps its choices and the focus.
- A redraw can replace the control that opened the panel. On close, the focus
  goes to the same control on the new Play (New game, or Change).
- `next.html` and the cutover copy `tools/solo-launch/next.html` link
  `/icons/crown-192.png`: the gold crown of the app icon (launch decision 83),
  192 px, 26 kB. The old page and its manifest do not change.

## Checks

- Browser check `next-menus`, case `panel_refresh`: a stored session and a
  stand-in server. A new invite arrives through the home poll while the panel
  is open. The panel, the Dark choice and the focus stay; Close returns the
  focus to New game. Passes at 360x640, 390x844, 844x390 and 1440x900.
  Without the fix it fails: the panel, the choice and the focus are gone.
- Unit test: both page heads link the crown icon; the file is a 192 px PNG.
