# First two 2D pieces — 2026-09-25

Current studies: [Archer wrist bow](wrist-bow/README.md), [Pawn lance](lance/README.md), [Ogre shove](ogre/README.md), [Knight leap](knight/README.md), [Bishop](bishop/README.md), [Rook](rook/README.md), and [Guard](guard/README.md). All seven are available on the [interactive board](board/README.md). The first-pair experiments below remain as history.

Current direction (2026-09-26): **painted 2D Archer with her compact wrist bow and natural arm proportions**. The [wrist-bow study](wrist-bow/README.md) supplies the Archer artwork now used by the two-piece board preview, and continuous cursor-driven arm aiming in the focused preview at `/wrist-bow/`. Both the earlier SVG limb rig and the subsequent 3D-rendered study were rejected by the owner. Preserve them as history; do not resume them as the current direction. The longbow sheets below are historical references.

Owner direction: use the approved illustrated board concept and original King Down art as reference for new poses, angles, pieces and animation as needed. Figures must be complete at the bottom; army colour must dominate, with a few recognition accents. This replaces the earlier fixed-clay visual direction for new art work.

First pair: Pawn and Archer, proposed in the session; no alternate pair specified. Scope is an art and motion study, not conversion of the entire game.

## Deliverables

- `pawn.png`: ivory/charcoal resting and spear-thrust poses.
- `archer.png`: ivory/charcoal resting and bow-draw poses, revised to separate the rows and retain complete feet/weapons.
- `frames.json`: display windows into the original transparent sheets. No destructive cropping or colour processing.
- `index.html`: responsive board-size study, army/piece switches, full-figure inspection, Pawn advance and Archer shot previews. Scripted positions, no game persistence or engine changes.
- `prompts.json`: exact generation and refinement prompts. Built-in image generation used; no external model service or subagent.

References: original painted Pawn sprite, original Archer cutout, and original painted cast lineup in the repository. The new Pawn sheet also supplied style reference for Archer. New sheets are derivative generated artwork, not original archival assets. Original references and the playable clay build are preserved.

Palette: warm ivory versus charcoal/slate dominant on armour and cloth. Pawn keeps a small ochre mark; Archer keeps green hood lining and bow details plus natural hair/skin. Full boots and complete equipment appear in every frame. These are two poses per side, not a finished skeletal rig or frame-by-frame animation set. The Archer action is side-facing; additional directional attack poses can be made when the renderer requires them.

## Run

From the project root:

```sh
python3 -m http.server 5192 --bind 127.0.0.1 --directory docs/2d-first-pieces
```

Open http://127.0.0.1:5192/ . The existing game remains at port 5189.

## Verification

Inspected actual generated sheets, transparent-alpha metadata and desktop/phone browser rendering. Checked ivory Archer shot completes without moving the Archer; enemy disappears. Checked charcoal Pawn advance and action-pose switch. Checked board-target activation in the 390 px phone layout, then restored the normal viewport. Phone page width 390 px, board width 344 px, no horizontal overflow. SVG view windows preserve the figure's aspect ratio at constrained portrait widths; board coordinates align with squares. Reset invalidates pending animation callbacks. No automated engine tests needed: no game code was changed.

The first Archer sheet had insufficient space between rows; the kept revision fixes that. The mobile layout initially squeezed wide poses; corrected using aspect-preserving SVG display of the unchanged image sheets. Assessment of the final art remains open for owner feedback; do not describe it as owner-approved production artwork.

## Extended animation — 2026-09-25

Added `archer-animation.png` and `pawn-animation.png`, each with four sequential poses for both armies (16 newly generated frames total). Playback combines these with the original resting pose. Archer: ready, full draw, release, recovery. Pawn: anticipation, step, thrust, recovery. The Pawn sequence is an action study alongside the scripted advance, not a new chess rule.

`animation.json` records actual sheet dimensions; fixed cells preserve scale through the four action frames. Explicit SVG clips prevent neighbouring rows from leaking into letterboxed portraits. `animation-prompts.json` preserves exact built-in image-generation prompts. Original sheets remain intact. New controls: Next frame, live frame name/count, and Slow motion (3× duration). Reduced-motion preference skips the timed action poses.

Verified JavaScript syntax, browser Archer shot completion, charcoal Pawn completion, frame stepping, reset during slow playback, and 390px document width without overflow. Sheets and on-board preview inspected. This remains an illustrated key-pose sequence, not interpolated skeletal animation.

## Wrist-bow revision — 2026-09-26

`wrist-bow/archer.png` contains ivory and charcoal versions of one full-body firing pose, made with built-in image generation from the original Archer and the preferred painted sheet. The longbow/string-drawing pose is replaced by a compact forearm-mounted bow; the free arm rests beside her body. The board shot keeps the entire illustration intact during playback. Arm and hand proportions were visually checked at large and board sizes.

`index.html` now uses this art for every Archer view. A bolt starts at the wrist device and travels to the marked Pawn, with small whole-sprite recoil. Archer no longer exposes the old five-frame longbow controls or gallery; Pawn retains its five poses. Reset cancels in-flight browser animations. The focused `/wrist-bow/` page also supports keyboard activation of its target. See its [verification record](wrist-bow/verification.json) for checked behavior and limits.

## Wrist-bow cursor aiming — 2026-09-26

The focused `/wrist-bow/` preview now animates the arm toward the pointer through a bounded aiming arc. A small shoulder mesh preserves the painted join; the forearm, hand and weapon rotate together. Both army-size samples follow, and the bolt leaves along the actual wrist-bow direction. Native Canvas/SVG/browser animations; no new artwork or dependencies. This is separate from the board's static shot. See the [controls, method and verification](wrist-bow/README.md).

## Pawn lance aiming — 2026-09-26

The focused `/lance/` preview adds a coherent one-handed lance pose in both army colours, cursor aiming and a short thrust with planted soles. Native Canvas motion preserves the grip and straight shaft through contact and recovery. The earlier board/Pawn frames remain unchanged. [Artwork provenance, controls and verification](lance/README.md).
