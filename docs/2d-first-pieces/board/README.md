# Pawn + Archer board trial

Open http://127.0.0.1:5192/board/. This is a local visual/interaction experiment, using the accepted full painted silhouettes, continuous shoulder motion and two army palettes. It does not replace the playable game on 5189. Owner review is pending.

## Try it

- **Crossfire:** the selected Ivory Archer can shoot e4 without moving; select the Pawn on d2 to capture c3. Both armies are controllable.
- **Close ranks:** twenty figures test scale, contrast, equipment overlap and square selection. The Pawn on b2 is blocked by the Archer on b3.
- **Archer angles:** targets around d4 expose the limits of the current sideways artwork.

Choose a piece, then a green move dot or copper attack ring. Hovering a marked square aims the selected figure within its drawing's range. Arrow keys move focus, Enter activates, Escape clears selection. The sidebar offers the same actions as buttons. Undo cancels a running action or restores the previous position. Reset and position changes discard the current trial. Slow motion stretches timings; Reduce motion commits actions immediately. Nothing is persisted.

## What is implemented

An HTML button grid handles square picking and accessible names; native Canvas draws the board, existing sprites and effects. One requestAnimationFrame loop runs only during motion/aim changes. Idle sprites are cached. No new dependency or animation framework was added.

The static preview imports a bundled copy of the production `genPiece` and `makeMove` functions. `rules-source.json` records the source hashes. The trial uses default Pawn/Archer piece rules, including obstruction, Pawn first-step options and stationary Archer captures. It intentionally omits alternating turns, kings/check, other pieces and promotions. Promotion moves are unavailable here. The bundle is a snapshot, not a live connection to game settings.

Move animations glide between squares. Pawn captures approach the actual victim, plant the stance for the existing lance jab, fade the victim at contact, then advance into its square. The approach is solved from the fully extended lance tip and victim's chest. Archer shots aim, launch a bolt from the wrist bow, recoil and recover while remaining on the source square. Board mutations happen only at completion, so cancellation cannot leave a late capture behind.

The art remains unchanged: `../lance/pawn.png`, `../wrist-bow/archer.png` and their existing `aiming.mjs` renderers. No new poses were generated.

## Facing decision and findings

The current drawings support shallow sideways aiming, not arbitrary 360-degree arm rotation. Horizontal mirroring handles left/right. Pawn contact staging keeps his lance within the existing arc. Steep Archer shots temporarily show the actual attacker and victim in a side-on encounter panel, then return to the board. This is an explicit presentation experiment; it does not demonstrate fully directional character art.

The figures retain their complete feet and equipment at board scale. In Close ranks, neighbouring lance tips cross tile boundaries without obscuring the neighbouring torso or intercepting its square input. At 390 px screen width the board fits without horizontal scrolling; detailed faces are naturally much smaller. Additional facing drawings should be judged at this scale before expanding the roster. Quiet movement currently has no walking cycle, and captures use a fade rather than a drawn death pose. Owner acceptance of the combined board and encounter panel is still needed.

## Reproduce

From the worktree root, rebuild the rule snapshot after any engine/default-rule change:

```sh
node docs/2d-first-pieces/board/build-rules.mjs
```

Serve the existing study directory if 5192 is not already running:

```sh
python3 -m http.server 5192 --bind 127.0.0.1 --directory docs/2d-first-pieces
```

## Verification — 2026-09-26

Performed in the in-app browser against the actual static preview:

- Ivory Archer c4 shoots e4 and stays on c4; Charcoal Archer f5 shoots d5 and stays on f5. Counts decrease and targets clear.
- Ivory Pawn d2 captures c3; Charcoal Pawn c3 captures b2. Sources clear, capturers occupy destinations. Slow-motion Ivory lance impact inspected visually.
- Undo restores the board; Undo and Reset interrupt running attacks without applying them later.
- Vertical Archer shot d4 → d6 shows the correctly labelled actual attacker/victim panel and completes its stationary capture.
- Close ranks: select blocked b2 Pawn; no move offered. Keyboard Right/Enter selects c2, Up/Enter moves c2 → c3; Escape clears selection.
- Reduced motion applies Charcoal h7 → h6 and Ivory c4 → e4 immediately, with no encounter panel.
- Default tablet-sized pane, 1280×900 desktop and 390×844 phone layouts inspected. Phone document width equals viewport width (390 px); square buttons are about 41.8 px wide. A phone-width capture was activated successfully.
- No browser warnings or errors observed. Syntax and production-rule assertions passed; bundle source hashes matched the current engine and defaults.

These checks establish behavior and observed rendering, not owner approval of the artwork or a complete game release.
