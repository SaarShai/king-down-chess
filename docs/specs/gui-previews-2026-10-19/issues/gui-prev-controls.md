# GUI previews 2026-10-19: the control system (stone and red buttons, focus, board grain)

Status: in-progress
Type: task

## Why and the rule
Saar, 2026-10-19: "by the time i get back - everything must be sleek and pixel-perfect and faultless and beautiful to look at and a joy to use." His standing rule: a taste call needs his approval. So this lane builds a PREVIEW of the recommended pick of each item below, on its own branch, at award-level craft. Nothing merges until he approves the item on his approval page. Build each pick exactly as its option text says; do not build the other options; add no idea that the item does not name. Where a pick leaves a detail open, choose the most restrained and clear answer, and name it in your answer as a taste choice.

Record: copy this ticket to docs/specs/gui-previews-2026-10-19/issues/<this file name> in the repo, set its Status to done, and add the check results at the end.

Screens before the change: /private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/lanes/gui-review/gallery/ (INDEX.md names each image). The expert reviews: /private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/lanes/gui-expert/panel.md, /private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/lanes/gui-review/suggestions.md, review-astra.md, review-opus.md; /private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/lanes/gui-expert/argon-1.md, argon-2.md.
Proof for each item: before and after screenshots of each screen it changes, at the sizes where it shows (plugin harness: 390x844 and 1280x800, light and dark; web: 390x844 and 1440x900), saved as /private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/lanes/gui-prev-controls/previews/A<n>-<screen>-<size>-<theme>-before.png and -after.png. Take the before shots from the branch base, the after shots from your commit. A test for each behaviour change. npm test and the plugin-ui browser check pass. One commit per item.
Art: new or changed images only through Codex's built-in image_gen on the ChatGPT plan (never the paid images API). Match the painted cast (public/pieces/painted-2d/, docs/2d-first-pieces/) and keep every page under its size limit (the plugin page HTML stays under 1,000,000 bytes).

### A1 Stone button shape

Problem: The stone buttons look soft and generic. A shape from the King Down world makes them belong to the game.

Build: **Cut-corner tablet**. 4 px cut corners, 52 px main and 48 px small buttons, 18 px bold words, a short 2 px press.

Why this pick: Four of five leads pick the tablet: it reads as carved stone, and it stays calm at small sizes.

Other options (do not build): Shallow shield (A slightly pointed base. More heraldic, but it needs more height.); Today’s rounded slab, thinner edge (Least change.)

### A2 Red button shape and finish

Problem: The red buttons use the same blurry stone image under a red tint, so the grain looks muddy.

Build: **Same tablet, matte red face**. Deep red #842c21, a darker edge, a 1 px light top line, cream words. No stone grain.

Why this pick: A plain matte red on the same tablet shape is the calmest and the clearest main action.

Other options (do not build): Short banner (cloth flag shape) (More themed; busier at small sizes.); Smooth rounded enamel (Modern and clean; less King Down.)

### A3 Where stone belongs (changes your earlier C1 a)

Problem: Today every row (menus, settings, games, moves line) is a raised stone slab. All five leads say this is the main cause of the crowded look.

Build: **Stone only on action buttons; flat reading rows**. Menu rows, settings rows, the moves line and profile rows become flat rows with a 1 px divider, 48 px tall. Selected segments stay dark with a gold ring.

Why this pick: Raised stone only on things you press to act; reading rows go flat with thin dividers. The screens get calmer and the real buttons stand out.

Other options (do not build): Stone everywhere, lower contrast (Keeps C1 a, but softer.)

### A34 Focus ring colour

Problem: The keyboard focus ring is the only blue in the game. It works and is easy to see. It touches your focus look item.

Build: **Warm ink and gold double ring**. On the web and in the plugin; same contrast or better.

Why this pick: A warm ring fits the game look and can keep a strong contrast.

Other options (do not build): Keep as it is (The blue ring.)

### A10 Board tile grain

Problem: The tile grain is strong and competes with the pieces.

Build: **Reduce grain contrast 25%**. Same tiles and colours, recomposed from the full-size source.

Why this pick: 25% less local contrast keeps the stone look and makes the pieces read first.

Other options (do not build): Keep today’s grain (No change.)


## Plan and checks

Base: bc62f4eec18f58b9e99c426422e362a6b5a8dc56.

1. Capture the base at 2x scale. Keep the base build for all before screens.
2. Build A1, A2, A3, A34, and A10 in that order. Make one commit per item.
3. Add a test for each change. Check types, unit tests, and the plugin browser check.
4. Capture each commit at the ticket sizes. Inspect the screens at 2x. Record faults and taste choices.

Pass: 4 px tablet cuts; 52 px main and 48 px small buttons; 2 px press; matte red; flat rows; warm focus on light and dark surfaces; tile grain at 75% contrast. The page payload stays below 1,000,000 bytes.

The work stays a preview. The owner must approve each item.

## A1 preview

The shared action face has 4 px cuts. Main buttons use 52 px; small buttons use 48 px. Words use the 18 px bold token. The press is 2 px. Reduced motion keeps the face still. The face clips its decoration only.

Check: the type check passes. Unit and browser results follow below. Screen proof uses the base build and this item commit.

Taste choice: keep the current stone crop and a thin edge. Keep the table bar in its current fixed row.

## A2 preview

The red tablet has a plain #842c21 face, a #5a1c14 edge, a 1 px #9c3a2d top line, and #fbf7ee words. It has no stone image or blend. The browser check reads these values from the drawn face.

Taste choice: use the existing deep red and cream tokens for the face and words. Use no gradient.
