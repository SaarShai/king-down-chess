# First interface object samples

Ready IDs: `coin-spend`, `draw-reply`.

- `index.html?sample=coin-spend` — card coin cast and spent state, 2.5 s.
- `index.html?sample=draw-reply` — offered draw, wait and declined reply, 3.1 s.

Serve this worktree through Vite. The local page is `docs/specs/effects-animation/preview/gui/index.html`.

The two definitions in `objects.js` and `card-fixture.json` are stable and safe to copy. Copy `objects.css` with them. `main.js` only adds the import and registration. `index.html` only adds the CSS link. The 18 accepted definitions and `style.css` are unchanged.

Checks pass: JavaScript syntax; exact shared fixture input; legal Freeze action and all expected results; all art/font loads; 54 browser frames; reverse seek; replay, pause, speed and scrub; keyboard and touch; OS/manual reduced motion; hidden page pause; 390 px overflow and controls above the stage; 1280 × 720 controls in view. Renders and report are in `/tmp/effects-ui-objects/`.

Final pass complete: `opponent-found`, `setup-ready` and `invite-copy` are ready in `arrivals.js` and `arrivals.css`. All five new IDs are safe to copy with the current `main.js` and `index.html`. The page has 23 samples. The final check passes 144 frames and confirms that 54 accepted stage frames match the saved baseline exactly. No sample sends a game request, game message or clipboard write.
