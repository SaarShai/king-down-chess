# Workshop figure samples

The owner approved a future cast of 30 figures, then requested one sample of each type before the full set. This review contains six identities, each shown in ivory and charcoal. The current game still uses its placeholder figures.

| File | Type | Concept name | Main visual cue |
|---|---|---|---|
| fast.png | Fast | Blade Dancer | Light armour, separate short blades, light ready stance |
| strong.png | Strong | Ram Bastion | Ram horns, broad armour, large gauntlets |
| ranged.png | Ranged | Crossbow Warden | A hand-held crossbow with a broad horizontal shape |
| magic.png | Magic | Lantern Witch | A wide hat, robes and a hanging lantern |
| support.png | Support | Banner Keeper | A short forked banner and an open hand |
| mixed.png | Fast + Ranged | Javelin Runner | Light running equipment and a fan of throwing spears |

[Open the review page](index.html). It shows the large pair, small views and references from the current cast. Names are working labels, not new game rules. These artwork types can guide suggestions, but do not change a design's moves or abilities.

The current review is [the original Archer face study](archer-faces.html). The five human pairs use facial shapes and shadow, with the archival Archer and Paladin shown as references. The original goat in `strong.png` stays unchanged, as requested. New human files are `fast-archer-face.png`, `ranged-archer-face.png`, `magic-archer-face.png`, `support-archer-face.png` and `mixed-archer-face.png`. These five revisions await approval.

The earlier [blank-face trial](faces.html) is retained as a rejected direction. It removed too much facial form. Its `*-minimal.png` files must not be used as the production reference.

## Full-set plan, after approval

- Five Fast, five Strong, five Ranged, five Magic and five Support figures.
- Five combined figures. Proposed pairings: Fast + Ranged, Ranged + Strong, Strong + Support, Support + Magic, Magic + Fast. Each property appears in two combinations.
- Each identity has ivory and charcoal versions. The two army versions are not counted as separate figures.
- No custom figure may reuse the existing cast's identity or equipment arrangement. Colour alone does not make a new identity.

## Production method

Generate each human figure from the start with the required face style in its creation prompt. Do not adapt an existing detailed Workshop face through local edits. Use the original Archer and Paladin as style references, not prior Workshop samples as edit targets. The simplified shapes must belong to the whole figure, including its face.

Use face covers only when they suit the character's theme; do not force them. Explore distinctive head and face equipment, as with the original Maester's unusual goggles. Exposed faces use the original Archer and Paladin's dominant geometric brow, nose and cheek shapes and natural eye-socket shadows, with little surface detail. Simplify the whole figure to a few large masses, quiet surfaces and distinctive equipment; avoid many folds, straps, buckles and small ornaments. The Workshop Iron Warden is the closest current style reference.

Human faces must follow the original Archer and Paladin artwork (`art-src/pieces/final-ivory/Archer_colored5.png` and `Paladin.colored2_no_shadow.png`, archived in the main checkout; the tracked original Archer design is `docs/research/drive-assets/concept-art/piece-cutout-archer.png`). Define the face through broad angular painted shapes and shadow, with a wedge-like nose and a small restrained mouth. The eye area is shadow under the brow, without drawn eyeballs, pupils, irises, whites or highlights. Keep recognizable facial form with little surface detail. Do not replace the face with a blank oval, dot/dash eyes, or a literal mask. Preserve each figure's own proportions and identity. The original goat/ram face in `strong.png` is approved; leave it as drawn.

Only the built-in image tool is used. Each sample is one transparent paired sheet. The existing Knight and Maester sheets supply the camera, painted style and army palettes, not the character identity. Original outputs are copied without raster edits. Exact prompts and source-file hashes are saved with the samples.

Review checks: complete figures and equipment, transparent background, separate army cells, coherent hands and props, consistent army colours, and clear small-scale shapes. The owner must approve or correct the samples before the remaining figures are generated or the new artwork enters the game.

## Review evidence

- [Desktop overview](overview.jpg) and [phone view](narrow.jpg). All images load, with no horizontal overflow at 1280×720 or 390×844.
- [Asset checks and hashes](checks.json). Six 1536×1024 RGBA originals, each with a clear split between the two army versions. Edge alpha is at most 1/255; no visible equipment is cut off.
- Exact generation and edit prompts: [Fast and Strong](prompts-fast-strong.json), [Ranged and Magic](prompts-ranged-magic.json), [Support and combined](prompts-support-mixed.json).
- Figures differ in framing and scale. This is an identity and style review. Align their scale and foot positions for the game after approval. The crossbow and lantern figures use more brown leather and gold than the brief requested; the review shows those colours as generated.

## Face trial evidence

- [Full comparison](faces-overview.jpg) and [narrow view](faces-narrow.jpg).
- [Asset hashes, alpha checks and head windows](checks-faces.json). All six sheets are transparent RGBA at 1536×1024. Large and small views show the simple face treatment, complete bodies and equipment.
- Exact built-in edit prompts: [Fast and Strong](prompts-faces-fast-strong.json), [Ranged and Magic](prompts-faces-ranged-magic.json), [Support and combined](prompts-faces-support-mixed.json).
- The edits also redrew some outlines and shading. Fast and Strong are larger within their sheets. These are face style trials; they do not preserve every non-face pixel. No new artwork has entered the game.

## Original Archer face study evidence

- [Full comparison](archer-faces-overview.jpg) and [narrow view](archer-faces-narrow.jpg) show the five human revisions beside the original goat, with close face views and both archival references.
- [Checks and hashes](checks-archer-faces.json): five transparent 1536×1024 RGBA sheets; `strong.png` matches the first sample commit byte for byte. Both reference files match the archived originals byte for byte.
- Exact built-in image edit prompts: [Fast and Support](prompts-archer-faces-fast-support.json), [Ranged and Magic](prompts-archer-faces-ranged-magic.json), [Fast + Ranged](prompts-archer-faces-mixed.json). Each edit starts from the first sample, with the archival Archer supplied as a face-style reference. The Paladin was inspected to verify the owner's clarification and is displayed as a second reference.
- All faces use brow/eye shadows instead of detailed eyes. Bodies and equipment remain complete. The edits have small outline, shading and position changes; Ranged grew slightly. These are style samples, not pixel-exact retouches. The remaining 24 figures and game integration still wait for approval.
