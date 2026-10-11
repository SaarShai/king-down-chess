# The visual sample (ticket 02)

A static mock of the MVP screens with the real art. It is not production code.

- `sample.html?s=<state>` shows one screen. `sample.js` holds the states; `data.js` holds the card and power texts, made from `src/powers-ui.ts`.
- `art/` holds the web copies of the new art. The masters and their prompts are in `art-src/chatgpt-mvp/` (see `art-src/MANIFEST.md`).
- The existing art loads from `public/ui/`, so the page needs a server at the worktree root.

Render every state at phone 390×844 (DPR 2), side panel 400×900 and desktop 1440×900, from the worktree root:

```sh
node docs/specs/chatgpt-mvp/sample/render.mjs [state,...]
```

It writes `png/<state>-<size>.png` and `contact-sheet.png`. It exits 1 on a fault: a sideways scroll, text over the composer zone, text past the right edge, a page error or a missing file. The host chrome (the header and the composer) is a stand-in for ChatGPT's own.
