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

The owner requested simpler, less human faces. [Open the revised face trial](faces.html) for all six edited pairs and before/after head views. The new files are `fast-minimal.png`, `strong-minimal.png`, `ranged-minimal.png`, `magic-minimal.png`, `support-minimal.png` and `mixed-minimal.png`. The first set remains unchanged. This trial still needs approval.

## Full-set plan, after approval

- Five Fast, five Strong, five Ranged, five Magic and five Support figures.
- Five combined figures. Proposed pairings: Fast + Ranged, Ranged + Strong, Strong + Support, Support + Magic, Magic + Fast. Each property appears in two combinations.
- Each identity has ivory and charcoal versions. The two army versions are not counted as separate figures.
- No custom figure may reuse the existing cast's identity or equipment arrangement. Colour alone does not make a new identity.

## Production method

Faces must be simple and less human in appearance: broad painted shapes, tiny eye marks and little or no mouth detail. Avoid realistic eyes, lips, wrinkles and portrait-like expressions. Keep the figure's identity in its outline, hair, headwear and equipment. This applies to all Workshop figures, including the ram.

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
