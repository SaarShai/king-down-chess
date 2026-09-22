# Ogre — stronger shoulders and arms

Owner request, 2026-09-22: continue the recommended multiview reconstruction workflow and enlarge the shoulders and arms to communicate pushing ability.

## Current result — owner-accepted sculpt, repaired fingers

The owner accepted the reconstructed Ogre overall and requested only the distorted middle fingers be fixed, plus a clay version. This supersedes the earlier proposed face/body cleanup below: the face, body, clothing and proportions were preserved.

- Locally faired the two curled middle fingertips with feathered brushes. **493 vertices changed; no positions outside the finger brushes moved.** No triangle flipped; the mesh remains **36,888 triangles**. UVs/topology are preserved; soft normals remove faceted lighting without changing the body shape.
- [Repaired GLB](clay-refinement/ogre-repaired.glb) and [editable Blender scene](clay-refinement/ogre-repaired.blend). Raw reconstruction remains byte-identical. Rebuild with `blender --background --threads 6 --python docs/graphics-prototype/ogre-reconstruction/clay-refinement/repair.py`.
- The live viewer defaults to **Handmade clay**: warm ivory, low specular response, pressed/fingerprint relief, and terracotta cuffs. It reuses `src/render/prototype/ClayLook.ts`; its relief is procedural at runtime, not baked into the GLB. The original generated colour remains available for comparison.
- Cuff guidance follows the original paint's two connected features. The shader samples the colour border per texel so the material edge does not follow individual triangle edges. Broad spatial limits only exclude unrelated arm shadows; they do not define a painted band.
- Added hand close-ups and responsive framing. Verified both hand views, front, colour/clay switching, and no browser console errors.
- Geometry evidence: [brush/triangle checks](clay-refinement/verification.json), [independent exported-buffer check](clay-refinement/export-check.json). The latter confirms 18,084 unique positions outside the finger region match at 1e-6 precision and all 24,433 exported normals are finite/unit length.

[Left before](clay-refinement/hand--1-before.png) / [after](clay-refinement/hand--1-after.png), [right before](clay-refinement/hand-1-before.png) / [after](clay-refinement/hand-1-after.png). These comparisons use identical smooth neutral shading on both sides, so the difference is the actual finger repair.

## Reference preparation

- Revised canonical front reference with a much wider shoulder girdle and larger upper-arm/forearm mass, preserving the established character, small rounded head, heavy jaw, wide belly, short legs, clay palette and orange hand pads. The prompt targeted approximately +25% shoulder width and +35% arm thickness; these are art-direction targets, not measured mesh changes.
- Matching left-profile and back references. No whole-sheet/gesture collage is sent as a reconstruction input. The plain rear tunic has no duplicated front knot; the rounded head remains above the shoulder ridge.
- Corrected tight front framing and oversized side framing. All final files are 1254 × 1254 RGBA with true transparency. Opaque figure heights occupy 79.0%, 79.5% and 80.9% of the canvas respectively. Bounds and alpha checks are saved in [reference-checks.json](reference-checks.json).
- Prepared the live Tripo workspace in its multiple-image input mode with v3.1, Ultra Mesh Quality enabled, textures disabled, triangle topology and a 100,000 polygon target. Confirmed the slider committed to 100,000 and the displayed generation price changed from 55 to **30 credits** when textures were disabled.

These are generated visual references, not geometrically exact projections of a common mesh. They keep the character's main proportions and features broadly consistent; subtle hand, cloth and anatomical differences must be resolved in the exported sculpt. The frontal image is the design authority.

## Inputs

| File | View | Role |
| --- | --- | --- |
| [front.png](front.png) | Front | Authoritative silhouette, face and shoulder/arm size |
| [left.png](left.png) | Left profile; face points left | Body depth, rounded crown, shoulder-to-neck transition, forearm thickness |
| [back.png](back.png) | Back | Shoulder width, back mass, rear tunic and arm stance |

[Download all three](ogre-multiview-inputs.zip). The ZIP contains these exact three PNGs, without drafts or the previous failed reconstruction. [Review page](index.html): `http://localhost:5190/docs/graphics-prototype/ogre-reconstruction/index.html`.

Images were prepared with built-in ImageGen, using the previous approved Shover cutout and then the revised front as references. Prompts are saved in `front-prompt.txt`, `framing-prompt.txt`, `left-prompt.txt`, `side-framing-prompt.txt` and `back-prompt.txt`. No image editing was done with a Python raster pipeline; Python was used only to inspect alpha/bounds and package the original PNG files.

## Earlier Tripo trial — not continued

The owner completed Google sign-in in the [Tripo workspace](https://studio.tripo3d.ai/workspace/generate) in **Chrome**. The Codex in-app tab failed with Google's `FedCM get() rejects with NetworkError: Error retrieving a token`; Chrome displayed its native account chooser successfully. Continue in the Chrome tab/group **Ogre login**, not the signed-out in-app tab. Completed onboarding for game assets/characters. No Tripo API key is configured in the current process and no Tripo CLI is installed.

The signed-in account has **200 free credits**. However, its workspace banner gates multi-view and model export behind an upgrade. The detailed comparison qualifies free exports as **15 H2.5-only exports**, so this is not a blanket claim that every free export is unavailable. Free models are public/non-commercial; **Pro** includes multi-view, private models, commercial use and unlimited exports. The live monthly pricing selector shows **$20/month recurring with 3,000 monthly credits** (verified 2026-09-22). The lower $13/month headline requires $156 annual billing.

The owner chose **a route without a subscription**. No images have been uploaded to Tripo, no generation has been submitted, no generation credits have been consumed, and no subscription has been purchased. Do not resume the paid Tripo route without new owner direction.

## Community TRELLIS reconstruction

The running [community TRELLIS demo](https://huggingface.co/spaces/trellis-community/TRELLIS) exposes multiple-image input and automatic GLB export without a subscription. Its [published app source](https://huggingface.co/spaces/trellis-community/TRELLIS/blob/main/app.py) confirms the multi-image pipeline and GLB export; the underlying [original TRELLIS code has an MIT license](https://github.com/microsoft/TRELLIS/blob/main/LICENSE). This is the original TRELLIS model in a community-maintained Space, not Microsoft's previously tested TRELLIS.2 demo. Multi-image conditioning is experimental and does not guarantee faithful hidden geometry.

The owner explicitly approved uploading `front.png`, `left.png` and `back.png` to this community Space. Uploaded all three successfully through the direct in-app browser (Chrome's iframe file-chooser bridge timed out). Visually confirmed front/left/back in the gallery. Submitted **Multiple Images**, seed **0**, randomization **off**, sparse/latent guidance **7.5 / 3**, steps **12 / 12**, multi-image algorithm **stochastic**, simplification **0.9**, texture **1024**. The smaller simplification fraction retains more geometry than the default 0.95. Do not claim Microsoft operates this Space or promise private storage/deletion guarantees.

### Earlier anonymous quota failure, 2026-09-22

The UI displayed generic `Error` panels. Its Download GLB button became enabled but had no file: enabled controls alone do not establish successful generation. The published Gradio API reproduced the submission with the same approved inputs and settings. Session creation, multi-image selection and preprocessing passed. `/generate_and_extract_glb` rejected the anonymous request with:

> You have exceeded your ZeroGPU quota (120s requested vs. 134s left). Try again in 22:44:28.

Those figures are the service's exact message; their apparent mismatch is not resolved. No GLB was produced and no mesh inspection, sculpt refinement, rigging or game replacement was possible. Evidence, UTC time and input hashes: [trellis-trial/result.json](trellis-trial/result.json). The small [API reproduction script](trellis-trial/run.py) uses the official `gradio_client` in `/tmp/kingdown-ogre-gradio`, not a new game dependency. Do not retry the anonymous request until access/quota changes.

### Successful signed-in reconstruction

The owner completed free Hugging Face sign-in and enabled Chrome's ChatGPT extension **Allow access to file URLs** option. The direct `.hf.space` page accepted the files but generation still returned a generic error; it did not establish authenticated quota. The normal [Hugging Face wrapper](https://huggingface.co/spaces/trellis-community/TRELLIS) subsequently generated and exported successfully. No subscription or API token was used.

Chrome's iframe filechooser bridge timed out. Native file selection worked: open the dedicated three-image folder, resolve `front.png` with Go to Folder, then extend the selection with Shift+Up twice. Command+A and row clicks had no effect in that picker. All three selected copies were hash-identical to the approved references. Do not navigate to the direct app merely to simplify uploads: its authentication context can differ. Also, an early AX `about:blank` for an iframe did not establish a blank rendered page; a later screenshot and DOM snapshot showed the loaded controls.

The exact settings remained seed **0**, randomization off, steps **12/12**, guidance **7.5/3**, stochastic, simplify **0.9**, texture **1024**. Verified actual [GLB download](trellis-trial/ogre-original.glb): **2,193,236 bytes, 36,888 triangles, no animations**. Header/version/declared length passed, and Blender imported the mesh. Successful-run provenance and hashes: [success.json](trellis-trial/success.json). The earlier failed API evidence remains separate in `result.json`.

### Art inspection

This is a useful reconstruction base, **not a finished game asset**. The front, side and back retain broad shoulders, heavy arms, belly, short legs and orange hand-pad placement. The face loses most of the nose and tusks; fingers partly merge, the belt becomes multiple folds, and neutral shading exposes faceting. The texture conceals some missing geometry.

- [Interactive model](http://localhost:5190/docs/graphics-prototype/ogre-reconstruction/viewer.html): drag to rotate, switch generated colour/plain clay, reset front.
- [Front](trellis-trial/neutral-front.png), [side](trellis-trial/neutral-left.png), [back](trellis-trial/neutral-back.png), [neutral three-quarter](trellis-trial/neutral-three-quarter.png), [textured three-quarter](trellis-trial/textured-three-quarter.png).
- [Editable inspection scene](trellis-trial/ogre-inspection.blend), [original service turntable](trellis-trial/turntable.mp4), and [reproducible Blender inspection script](trellis-trial/inspect_mesh.py). Run `blender --background --threads 6 --python docs/graphics-prototype/ogre-reconstruction/trellis-trial/inspect_mesh.py` to regenerate these unmodified-mesh views.

Alternatives checked: the official original TRELLIS demo currently disables user uploads; [Hunyuan3D-2mv](https://huggingface.co/spaces/tencent/Hunyuan3D-2mv) supports the views but its [license](https://github.com/Tencent-Hunyuan/Hunyuan3D-2/blob/main/LICENSE), especially §5(c), restricts outputs outside its defined territory, making it a poor choice for an unrestricted game release. [TripoSG](https://huggingface.co/spaces/VAST-AI/TripoSG) has a running official demo with GLB output and MIT model licensing, but its shape input is single-view, so prefer the multi-view candidate first.

The owner approved integration on 2026-09-22. The repaired sculpt now replaces the runtime Ogre in both the study and playable renderer. Both army palettes share the approved clay shader; the accepted shape is unchanged. Walk/Shove clips, a compressed board mesh, and verification are documented in [the integration report](../ogre-integration/README.md). Rules and starting rosters remain unchanged.
