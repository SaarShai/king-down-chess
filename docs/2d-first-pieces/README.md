# First two 2D pieces — 2026-09-25

Status: the [SVG Archer rig](RIG.md) at `/rig.html` was rejected by the owner after the anatomy revision. Its mechanics tests are not evidence of acceptable artwork. The [replacement workflow research](../research/archer-animation-workflow.md) recommends a deliberately authored painted rig. Earlier full-figure art and frame studies remain references, not completed production animation.

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
