# Six low UI faults from the online and phone checks

Status: ready-for-review
Type: task

The online-cards and phone-webkit checks found six low faults. All are on live too.

## Faults, causes and fixes

1. **Board frame after Send.** After a move and a pointer Send, the board keeps a dark frame with a gold line.
   Cause: Send moves focus to the board, and the account rule shows the frame on every `:focus`.
   Fix: Send passes `focusVisible` from the click (`event.detail === 0` is a key press). The account board hides the
   frame for `:focus:not(:focus-visible)`. Keyboard focus keeps the frame.
2. **Background seam.** `#app-frame` stops 128 px (96 px on a phone) above the window bottom: the plugin keeps that
   gap for the host composer. The web page has no composer. Fix: `page-host.css` sets `--composer-gap: 0px` on the frame.
3. **Card check cut, pool scrolls sideways.** The web page sets a 48 px floor on each input. The 48 px card check sat in
   a 44 px label at `right: -8px` with 12 px padding, so it overflowed the pool. Fix: on the web page the label is the
   48 px box, in the tile corner, with no padding.
4. **End window buttons below the fold at 844 x 390.** Fix: in short landscape the local end window hides the kings
   and shows Rematch, New game and Close after the words, as the plugin end card already does.
5. **WebKit gold box on the end heading.** WebKit makes the dialog's autofocus and each script focus visible. Fix: the
   heading takes focus with `focusVisible` set from the element that had focus before. A heading that already shows a
   wrong state blurs first, because a second `focus()` on the focused element changes nothing.
6. **Card sheet title breaks while it closes.** `flex-direction: column` was only on `[open]`. The close motion keeps
   `display: flex` after `[open]` goes, so the header and body stood in a row and the title wrapped. Fix: the column
   is on the base rule. The local Menu and Moves sheets had the same rule and get the same fix.

## Evidence

Local online server from this branch (same parts as the checks-main harness) and the Vite page.

| Fault | Before (origin/main) | After |
| --- | --- | --- |
| 1 | Chromium: board `outline: solid 3px`, `::after` frame shown | Chromium and WebKit: no outline, no `::after`; Shift+Tab, Tab shows the frame |
| 2 | 1280 x 900: frame 772 px in a 900 px window | Chromium and WebKit: frame 900 px |
| 3 | Pool scrollWidth 514 in 498, scrollLeft 16, check 1 px from the edge | scrollWidth 498 = clientWidth, check 9 px inside |
| 4 | Chromium and WebKit: content 553 px in 333 px, buttons at y 556 | Buttons at y 265, all in view |
| 5 | WebKit: heading `:focus-visible`, gold box | Pointer: none in both engines. Keyboard End turn: ring in both engines |
| 6 | Chromium: title box 14 to 53 px wide for about 185 ms of the close | Title box 465 to 474 px wide for the whole close |

Not checked: real phones; the plugin inside the ChatGPT host. In Chromium, an arrow key after a pointer Send does not
bring the board frame back (WebKit does); the square cursor still shows where the keys act, and Tab brings the frame back.
