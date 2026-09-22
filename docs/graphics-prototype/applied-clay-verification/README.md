# Feature colour as applied clay

The full refined cast now uses feature-aligned colour selections. Handmade clay
adds a thin rounded relief to those same surfaces, with separate impressions on
the coloured clay. Current refined and polished looks retain the unraised sculpt.

| Piece | Coloured feature | Adjacent features kept in army colour |
| --- | --- | --- |
| Guard | Shoulder plates | Arms and chest |
| Archer | Hood | Face and bow |
| Knight | Helmet crest | Helmet and lance |
| Bishop | Mitre, band and trim | Face and robe |
| Rook | Masonry crown | Forehead horns and skin |
| Queen | Crown rim and tines | Hair cap, braid and face |
| Paladin | Raised chest cross | Armour and beard |
| Maester | Goggle frame and rims | Both lenses, nose and fingers |
| Beast | Leather head and wrist straps | Skin, muzzle, chains and buckle rims |
| Ember King | Cracked breastplate | Belt and shoulders |
| Frost King | Ice fist, gauntlet and hanging spikes | Upper arm and shoulder spikes |
| Gaya King | Rhino-skull shoulder plate | Both horns, chest skull and straps |
| Celestial King | Crown, star and rim | Dome, visor and shoulder points |
| Shadow King | Full sword blade | Hands and cape |
| Spirit King | Clasped gloves and fingers | Sleeves, beard and robe |

Pawn stays entirely in the army colour. Guard, Archer and Beast preserve their
approved selections; the remaining twelve masks were traced against the source
sculpts. Masks in `tools/graphics-prototype/paint-masks` store explicit face
selections and local boundary cuts, protected by a prepaint geometry fingerprint.
Changing the reduction or source geometry requires reviewing the mask again.
The fingerprints must not simply be replaced to suppress a build failure.

`clay_layer.py` generates one native glTF morph target. The lift reaches at most
0.45% of figure height and tapers toward shared colour boundaries; army vertices
and shared seam vertices stay fixed. Detached closed features round outward.
It uses the existing mesh, materials and skeleton, without an extra shell or
draw call. Handmade enables the morph; other looks leave its weight at zero.
The contour shader uses Three's native morph, skin and projection chunks so it
follows the same raised silhouette. Accent impressions reuse the existing map
with an offset and slightly quieter bump relief.

The editable cast and pair are saved in `../complete-cast.blend` and
`../rebuilt-pieces.blend`. Rebuild with Blender's background Python runner:

```sh
Blender --background --python tools/graphics-prototype/refine_models.py
Blender --background --python tools/graphics-prototype/build_roster.py
Blender --background --python tools/graphics-prototype/verify_cast_paint.py
```

Verification against the approved Beast-straps commit `f269156`:

- 67 named surface probes pass, including feature interiors and adjacent
  exclusions; 13 roster relief surfaces preserve army/seam positions exactly.
  Guard/Archer's existing 9 paint probes also pass during their rebuild.
- `node tools/graphics-prototype/verify_clay_layers.mjs f269156`: 24/24.
  All 16 walking clips have byte-identical animation samples, all 15 accents
  work in both armies, playback preserves the relief, and animated outline
  masks match the native raised/skinned silhouettes with zero pixel mismatch.
- `npm run graphics:check`: 42/42; `npm run graphics:check:cast`: 37/37.
- `node tools/graphics-prototype/verify_clay_surface.mjs`: 8/8, including
  relief under identical lighting, shader variants, walking and mobile layout.
- Beast's 19 original strap probes and 15 deformation assertions still pass;
  deformation was checked in current, handmade smooth and handmade stop-motion.
- `npm run build`: passes, with the existing bundle-size advisory.
- No browser/shader errors. Final screenshots here show the full cast and six
  close-ups at 0.5 px, in both army colours. Feature authoring was inspected
  from front, back and both sides. Desktop checks do not measure older-device
  performance; the GLBs are larger because they now carry morph targets.

This is confined to the graphics study. Artistic acceptance remains with the
owner; no gameplay rules or movement design changed.
