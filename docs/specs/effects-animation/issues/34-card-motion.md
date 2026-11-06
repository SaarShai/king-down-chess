# Subtle motion in the card art

Status: built. All 21 released cards show the approved wide paintings of `docs/specs/effects-animation/preview/card-art/wide-review/art/` and move. Rescue and the card back have motion but no screen shows them.

The owner asks for "subtle movements of certain elements" on the cards. A flame flickers, cloth stirs, smoke drifts, a glow breathes, a crystal glints. The card stays still as a whole.

## Method

`src/plugin/card-motion/` draws each card with one WebGL2 fragment shader on a canvas above the still `<img>`. Output alpha 0 shows the still picture, so paint outside a card's masks is the exact art. Reduced motion, Animations Off, Symbols only, a hidden tab, an off-screen card and a device without WebGL2 show the still art. A spent coin shows the still art.

- `runtime.ts`: the `<card-motion>` element, one shared WebGL context, one 30 fps clock, an IntersectionObserver. A closed shadow root holds the canvas, because the page and its checks mean the board when they ask for "canvas".
- `shader.ts`: the helpers. Each time term has a whole number of cycles in the 8 second loop, so the loop has no seam.
- `recipes/<card>.ts`: one card's motion as GLSL.
- `src/plugin/assets/card-motion/<card>.webp`: three soft masks in RGB, made by `tools/card-motion/masks/<card>.py`.
- `src/card-symbol.css`: CSS motion for the nine rule pictures. Their small coin symbols stay still.

Two methods had a test on Flight and Mimic. Masks with a live shader need about 10 to 30 KB for each card. A baked animated WebP of the same motion needs 250 to 470 KB at sheet size, decodes to about 23 MB, steps at its frame rate and re-encodes the art. We keep the live shader.

## To change a card

Run its mask script, edit its recipe, then `node tools/card-motion/frames.mjs <dev server URL> <card>` and look at `strip.png` and `heat.png` in `~/kd-runs/card-motion/<card>/`. `docs/specs/effects-animation/preview/card-motion/index.html` shows all cards at sheet, tile and coin size. Start the dev server after a new recipe file; a server with no hot reload keeps its old list.

## Verification

- `npm run check:browser card-motion`: all 23 recipes compile. Each surface of each card moves. Phase 0 and phase 1 match. The loop stops off screen, in a hidden tab and under Animations Off. Reduced motion leaves each canvas empty.
- Phone-width page, 21 tiles and 8 coins, CPU slowed four times in Chromium: 30 draws each second, 1.24 ms of main-thread time each draw, 60 page frames each second, worst gap 16.8 ms. This is not a test on a physical phone.
- Playwright WebKit passed this check on the first 14 recipes: 27 draws each second, 52 page frames each second with software GL on a busy machine.
- `npm run check:browser plugin-ui`: a painted coin in a real card game draws its motion, with art from the plugin origin in CORS mode.
- The parent inspected frames and the map of motion for all 23 paintings at sheet, tile and coin size.

## Limits

- A device whose frames fall behind 24 ms draws cards at 15 fps. A display that runs at 30 Hz, such as Low Power Mode, does too.
- A lost WebGL context leaves the still art until the next page load.
- The shaders live in the page, because the host CSP has no connect domain to fetch them. The plugin no longer ships the rule pictures. The Workshop still does.
- Parked screens: `src/plugin/screens/collection.ts` calls `cardArt`, so it would show motion when it returns. The Workshop keeps its still pictures, and reads the same painting files. Rescue and the card back have recipes but no caller.
