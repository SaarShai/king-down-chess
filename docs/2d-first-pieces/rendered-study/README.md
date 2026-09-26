# Archer: one rendered-sprite experiment

**Owner rejected this direction on 2026-09-26.** Continue with the [painted 2D wrist-bow Archer](../wrist-bow/README.md); retain this experiment only as history.

2026-09-26. The owner asked to try a different method after rejecting the SVG arms/hands. This is **one full-draw still**, not an animation or an adopted replacement.

Open [the study](http://127.0.0.1:5192/rendered-study/) for the full figure, 128 px image-height previews, and light/dark/green backgrounds. The existing game remains at port 5189.

## Result and disposition

The test uses one skinned human mesh with real arm and finger joints. Bow fingers curl around a modeled grip, and the drawing hand sits beside the face. Both boots, the full bow, string and arrow fit inside the transparent sprite. Ivory dominates, with copper hair, green trim and brown leather.

**Do not adopt this artwork into the game yet.** The continuous body is a better structural basis than independently stretched arm images, but this is still a stiff, generic 3D render. It does not reproduce the character, painterly treatment or costume quality of the preferred illustrated study. The draw shoulder/anchor, hand contact, facial character, clothing and boot shapes need skilled visual refinement. At small size the dark bow/string lose contrast on dark squares. This test establishes a reproducible geometry/render route, not convincing animation or owner acceptance.

Keep this bounded experiment and its source for assessment. Do not extend it to more characters, army variants, views or animation automatically. A professional-looking model and a reviewed pose remain the next gate if this method is continued.

## What is saved

- `full-draw.png`: 1200 × 1400 transparent RGBA render.
- `hands-detail.png`: 1200 × 700 detail rendered from the same scene; the bow is intentionally cropped in this detail.
- `archer-pose.blend`: editable geometry, 163-bone skeleton, body skin weights, pose, materials, lighting and the full-figure orthographic camera. This is the still master.
- `build.py`: deterministic scene construction and both renders. No image generation or paintover is hidden in the output.
- `source/`: six pinned MakeHuman core assets, original asset licence and a provenance/hash manifest.
- `build-report.json`, `verification.json`: scope and technical evidence. They do not assert visual acceptance.

The body uses MakeHuman's authored skin weights. Hood, bodice, skirt, braid, boots and weapon are separate authored geometry. **Those accessories are placed for this still; they have not been rigged for motion.** The Blender file is not a finished animation rig. Editing this pose alone does not guarantee that all clothing/equipment follows it.

## Inputs and discarded approach

Design references were the original King Down Archer and `../archer.png`: full figure, hood, copper braid, robe, limited green details and dominant army colour. The original `Archer_2.obj` was also inspected. It contains 18,197 vertices and one fused connected mesh, including weapons. Spatially separating/deforming its arms for this pose tore neighbouring surfaces and retained weapon fragments. That attempt was discarded; none of that sculpt is in the final render.

The final anatomy comes from the [MakeHuman Community repository](https://github.com/makehumancommunity/makehuman), commit `a8bc2d54ff0ac92e78ff71431b1023eda42bf482`. The base mesh, female targets, skeleton and weights used here are core assets under [CC0](https://github.com/makehumancommunity/makehuman/blob/a8bc2d54ff0ac92e78ff71431b1023eda42bf482/LICENSE.ASSETS.md). Vendor files are retained byte-for-byte, including their upstream whitespace. Each downloaded file's Git blob hash was checked against the pinned upstream tree; `source/provenance.json` records exact URLs and SHA-256 hashes. No application was installed, purchased or subscribed to.

## Rebuild and verification

Run from the repository root with Blender 5.2.0 LTS:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --python docs/2d-first-pieces/rendered-study/build.py
```

This overwrites the generated master and PNGs; preserve any manual `.blend` edits before rebuilding. The source assets are local and the build needs no network, Python packages or source checkout outside this directory. The render uses Cycles CPU, 48 samples, denoising and a fixed camera.

Verification included reopening the saved `.blend` and rendering again, pixel-comparing that output with `full-draw.png`, checking RGBA/bounds/margins, viewing the full figure and hands close-up, and inspecting the local page on light, dark and green backgrounds plus the small square previews. All source geometry remains editable after reopening. Body/weapon edge visibility at board size is a recorded limitation, not a passed quality claim. No game tests were required because game code is untouched. Animation and intermediate poses are untested.
