# Painted board trial — seven-piece cast

Open http://127.0.0.1:5192/board/. This is a local visual/interaction experiment, using full painted silhouettes, continuous shoulder motion and two army palettes. It does not replace the playable game on 5189. Owner review is pending.

The third character is now available in **Ogre encounter**: [open his position](http://127.0.0.1:5192/board/?position=ogre). He has a planted shove, enemy/friendly pushes and an explicit capture-or-push choice. [Artwork, method and additional verification](../ogre/README.md).

The fourth character is available in **Knight leap**: [open his position](http://127.0.0.1:5192/board/?position=knight). His original horse-head helmet, spear and cape accompany a leap with a grounded shadow and a landing capture. [Artwork, method and additional verification](../knight/README.md).

The parallel character batch adds **Bishop diagonals**, **Rook lanes**, **Guard defence** and **Painted cast**. [Open all seven](http://127.0.0.1:5192/board/?position=cast). Source prompts and original references live beside each piece: [Bishop](../bishop/README.md), [Rook](../rook/README.md), [Guard](../guard/README.md). Knight now bends his knees before takeoff and on landing; [Crouch](http://127.0.0.1:5192/knight/) holds that pose for inspection.

## Try it

- **Bishop diagonals:** Ivory c4 captures e2; the Charcoal Guard on e6 blocks the diagonal toward f7. Charcoal f5 captures c2.
- **Rook lanes:** Ivory c4 captures c7 or g4. Charcoal f5 captures f2 or b5. Guards block each file in the opposite direction.
- **Guard defence:** Ivory c4 has no attacks. Ivory Ogre e5 can push Charcoal Guard f5 to g5; Charcoal Ogre c5 can push Ivory Guard c4 to c3. Both pieces survive.
- **Painted cast:** all seven characters in each army for size, colour and silhouette comparison.
- **Crossfire:** the selected Ivory Archer can shoot e4 without moving; select the Pawn on d2 to capture c3. Both armies are controllable.
- **Close ranks:** twenty figures test scale, contrast, equipment overlap and square selection. The Pawn on b2 is blocked by the Archer on b3.
- **Archer angles:** targets around d4 expose the limits of the current sideways artwork.

Choose a piece, then a green move dot or copper attack ring. Hovering a marked square aims the selected figure within its drawing's range. Arrow keys move focus, Enter activates, Escape clears selection. The sidebar offers the same actions as buttons. Undo cancels a running action or restores the previous position. Reset and position changes discard the current trial. Slow motion stretches timings; Reduce motion commits actions immediately. Nothing is persisted.

## What is implemented

An HTML button grid handles square picking and accessible names; native Canvas draws the board, existing sprites and effects. One requestAnimationFrame loop runs only during motion/aim changes. Idle sprites are cached. No new dependency or animation framework was added.

The static preview imports a bundled copy of the production `genPiece` and `makeMove` functions. `rules-source.json` records the source hashes. The trial uses default Pawn/Archer/Ogre/Knight/Bishop/Rook/Guard piece rules, including obstruction, Pawn first-step options, stationary Archer captures, Ogre follow-through pushes and Knight jumps. It intentionally omits alternating turns, kings/check, the remaining pieces and promotions. Promotion moves are unavailable here. The bundle is a snapshot, not a live connection to game settings.

Move animations glide between squares. Pawn captures approach the actual victim, plant the stance for the existing lance jab, fade the victim at contact, then advance into its square. The approach is solved from the fully extended lance tip and victim's chest. Archer shots aim, launch a bolt from the wrist bow, recoil and recover while remaining on the source square. Bishop and Rook captures use a short advance and their restrained presentation/weight shift; the victim fades at contact. Guards glide to empty squares and have a separate planted-brace study. Board mutations happen only at completion, so cancellation cannot leave a late capture behind.

Pawn and Archer art remains unchanged: `../lance/pawn.png`, `../wrist-bow/archer.png` and their existing `aiming.mjs` renderers. The new Ogre sheet is `../ogre/ogre.png`, with its restrained weight-shift renderer in `../ogre/motion.mjs`.

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

## Parallel cast review

The owner explicitly authorized three parallel character workers for this batch. Each wrote only its own character directory in an isolated worktree. Source commits: Bishop `b89ae2b`, Rook `4073ebf`, Guard `edba373`. The parent reviewed and integrated the results, corrected the Rook source windows/pivot, pinned the Guard’s actual boots, normalized Bishop canvas proportions and removed misleading motion labels. All source artwork, exact prompts and final images are retained beside the pieces. No production source or default rule changed.

Verified in the in-app browser on 2026-09-26:

- Complete silhouettes, both armies and motions for all three new pieces. Reset and army changes cancel; keyboard activation, slow/reduced motion and 390 px portrait layouts work.
- Ivory Bishop c4 → e2 and Charcoal Bishop f5 → c2 capture; Ivory Rook c4 → c7 and Charcoal Rook f5 → f2 capture. Sources clear, destinations/counts update, and Undo restores. Rook capture cancellation leaves c4/c7 unchanged.
- Guard c4 offers only five empty-square moves, no attacks; Ivory c4 → b4 and Charcoal f5 → f6 move. Ogre e5 pushes Guard f5 → g5, and Ogre c5 pushes Guard c4 → c3. Both counts stay 4/4; Undo restores both units.
- Reduced-motion Bishop capture and keyboard Guard move complete immediately. The seven-piece cast is readable on the board; selection borders now draw behind the artwork instead of cutting across the tall Bishop’s neck. Board and character pages fit 390 px without horizontal overflow.
- Thirteen focused tests pass, covering existing Archer/Pawn/Ogre behavior, Knight crouch/jump, new piece motion, ray blockers, Guard immunity/noncapture/pushability, both armies and coherent trial fixtures. All changed scripts parse; bundled rule hashes match unchanged production sources. No browser warnings/errors observed.

Motion remains deliberately bounded: Bishop presents one coherent painted pose, Rook rocks rigidly on the stone contact, Guard makes a small planted brace, and quiet movement glides. These are reviewable character studies, not full walking or directional animation sets.

## Feedback troubleshooting

2026-09-26: the owner requested troubleshooting without identifying the symptom. Read-only inspection of the played position found the selected Ivory Pawn on b3 blocked by the friendly Archer on b4. There were no logged browser errors. The rule correctly offered zero actions, but the UI said to choose a marked square. At the actual 765×995 window, selection details began at y=1008 and the status at y=1080, both below the screen. These are confirmed feedback defects; they do not establish the cause of an unspecified animation complaint.

The status and a self-contained selection summary now sit above the board and remain visible while scrolling through it. A Pawn with zero actions names the piece/square blocking its advance; other immobile pieces explain that there are no actions. Empty-square clicks retain that useful explanation. Escape clears the selection and its old status together. Artwork, motion curves and rules are unchanged.

Reproduce the regression through the real UI in a separate tab (the trial does not persist positions):

1. Open `board/?position=cast`, move Ivory Archer a3→b4, select Pawn b3, then click empty c3. It must retain both pieces and show zero actions, with “The archer on b4 blocks this pawn” visibly beside the board. Before the fix it said “Choose a marked square for the pawn.”
2. Move Charcoal Archer h6→g5, select Pawn g6, then click empty h6. The equivalent explanation must name g5. Press Escape: both the selection summary and status must clear.
3. Repeat at 390×844, 765×995 and 1280×900; status bounding rectangle must be entirely within the viewport after interacting with the board, with no horizontal overflow. This checks the actual layout rather than just DOM presence.
4. Bishop c4→e6 captures the Knight and changes counts to 7/6. Undo restores it. With Slow motion enabled, Undo during the same capture must leave both source and victim unchanged. Reduced-motion Guard d2→c2 completes immediately with the correct status.

All those checks passed in the in-app browser. Thirteen existing motion/rule tests, module syntax and `git diff --check` passed; no browser warnings/errors were recorded. The original played tab was not reloaded or changed; the updated preview was verified separately. A specific visual or movement failure still needs its piece/action identified before claiming it fixed.

## Queen, Paladin and Maester

Three further painted characters bring the cast to ten per army. Each has a focused board position and a character preview: [Queen](../queen/README.md), [Paladin](../paladin/README.md), [Maester](../maester/README.md). Original references, exact imagegen prompts, unchanged generated PNGs and provenance are saved beside each piece. The Paladin needed a palette correction followed by a framing correction; both were reviewed before adoption.

Queen rays use the production engine. Paladin charges pass over friends; he survives taking a Pawn but disappears with any non-Pawn target. Both-removal outcomes are labelled before the action, and the selection clears when he is removed. A Maester can step/capture or swap with an adjacent friend. Violet markers and separate Swap buttons identify exchanges; both actors travel on separated paths, counts stay unchanged, and Undo restores both. The king/long-swap case is not present in this kingless trial.

The board bundle was rebuilt only to export Q/L/M constants; production engine/rule hashes remain unchanged. Character motion is deliberately restrained: Queen weight shift with grounded hem, Paladin brace with intact hammer/grip and a board-level bound, Maester rigid survey lean. No independent hammer swing, goggle-hand rig, walk cycles or additional facings are claimed.

Saved built-in imagegen outputs and exact prompt set:

| Character | Final artwork | Prompts |
| --- | --- | --- |
| Queen | [queen.png](../queen/queen.png) | [Generation](../queen/prompt.txt) |
| Paladin | [paladin.png](../paladin/paladin.png) | [Generation](../paladin/prompt.txt), [colour correction](../paladin/revision-prompt.txt), [framing correction](../paladin/framing-prompt.txt) |
| Maester | [maester.png](../maester/maester.png) | [Generation](../maester/prompt.txt) |

Verification in the in-app browser on 2026-09-26:

- Queen c4→g4 and Charcoal Queen f5→f2 captures complete; Undo restores the source and victim.
- Paladin c4→g4 and Charcoal Paladin f5→b5 capture Pawns and survive, passing over friendly blockers. Captures c4→c7 and f5→f2 remove both non-Pawn target and attacker; counts become 5/5 and selection clears. Undo restores both; slow-motion cancellation leaves both unchanged. Reduced-motion removal gives the same outcome.
- Maester c4↔d4 and Charcoal Maester f5↔e5 swaps move both figures, preserve counts at 4/4 and undo together. A swap with Guard b3 was canceled and then separately completed under reduced motion. Maester c4→c5 captures normally.
- All three character previews support Hold pose, Reset, both army samples, keyboard activation and reduced motion; an army switch during a slow Paladin action cancels it. Full silhouettes and held poses inspected at portrait and board scale. All three previews and the 20-figure board fit 390 px without horizontal overflow; desktop board inspected at 1100×1100.
- Seventeen focused tests pass, including the existing Archer/Pawn/Ogre/Knight/Bishop/Rook/Guard checks and new special-action/geometry cases. Source-cell alpha edges, stored PNG hashes, syntax and diff checks pass. No browser warnings/errors observed. Existing played tabs were not reloaded.

These checks establish implemented behavior and inspected artwork, not owner acceptance. Physical touch and a complete game with kings/check remain outside this trial.

## Bishop dagger slash and Paladin hammer smash — 2026-09-26

Owner: animate the Bishop capture as a knife slice and the Paladin capture with his hammer.

- **Bishop:** glides to the victim's near edge, pulls the dagger arm back, then slashes forward and up. The sleeve, hand and dagger are cut from the painting along their outline (`ARM` in `../bishop/motion.mjs`) and rotate rigidly about the shoulder. The arm hangs clear of the robe, so no hidden area is exposed; the shoulder pad is redrawn on top to hide the sleeve root. A steel streak follows the dagger tip. At contact a white cut line flashes, the victim splits along the slash direction, the upper half slides down the cut and both halves fade. He then steps into the square.
- **Paladin:** hops to the victim, leans back to raise the hammer, then chops forward. Hammer, pommel and gauntlets stay rigid above the knees (`drawPaladinSwing` in `../court-motion.mjs`); only the lower tabard and knees bend while the boots stay planted. A warm streak follows the hammer head. At impact the board shakes, the victim squashes and fades, and a ground ring, cracks and dust spread from its feet. He survives a Pawn capture and steps in; after a non-Pawn capture he fades on the spot.
- Non-capturing moves, reduced motion and all other pieces are unchanged.

Limits: the art is still one painted pose per piece. The Bishop swings a rigid bell sleeve with no elbow bend; the Paladin's blow is a whole-body lean, not an overhead swing. A true overhead swing needs new raised-hammer artwork.

Verify: `node docs/2d-first-pieces/board/capture-strikes.mjs` (with the 5192 server up) drives both armies through a fake clock, checks final squares, counts and statuses, cancels each strike mid-swing with Undo, and writes frame sheets to [strikes/](strikes/). `strikes.test.mjs` checks the swing curves and that the held hammer does not stretch. 23 node tests pass.

## King and Beast — 2026-09-26

The cast is now twelve per army. The King is the Frost King, the game's default king design; the Beast keeps his steel muzzle-mask, harness and crest. Both were made with Codex's built-in image generation from the original painted references, with the Knight as the style reference; prompts and provenance are in [../king/](../king/) and [../beast/](../beast/). The first Beast was rejected (snout crossed the army seam; orange mouth and brown straps overpowered the army colour); the second was accepted after a pixel-exact recentring of each figure in its cell.

- **King guard:** Ivory King c4 captures c5. Kings move and capture one square; no check or king powers in this trial.
- **Beast chain:** select Ivory Beast d4. Each chain appears as its own action (for example *Chain d5 → e6 → f5*); the Beast bites each victim in order and stops on the last. Single bites work as before.
- **Painted cast:** now includes both Kings (d1, e8) and Beasts (g2, b7).

Motion is a rigid lean (same as the Maester). The Frost King's skin stays pale blue in both armies; his ice armour carries the army colour. Verified by `capture-strikes.mjs` (King capture, 3-bite chain, counts and messages) and the [24-figure cast](strikes/cast-24.png).
