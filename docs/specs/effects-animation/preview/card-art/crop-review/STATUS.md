# Card art crop review

Status: complete; shown for review

Preview only. All 21 released IDs use the actual catalog, card renderer and CSS: 12 paintings, 9 rule pictures. Rescue and the card back are additional files. No source artwork or game styles change.

The guide follows each full source’s natural dimensions, including three 491 × 512 files. The current game grid keeps the image at natural ratio and clips its bottom in a 16:9 window. Check actual image and container boxes: object-position alone incorrectly suggests a center crop. Back's center 30% also has no visual offset inside its natural-ratio box. The guide is corrected after image inspection and native browser measurements.

Validation: `npm run check:browser card-crops` checks catalog completeness, exact renderer output, image loading, natural source geometry, actual visible-image fractions, guide toggle, keyboard navigation, reduced motion, no overflow and browser errors at 1280 × 900 and 390 × 844. Evidence is stored outside the checkout.

Known content losses: Mimic’s transformed shadow, Flight’s base and pawns, and much of March’s drum. The gallery intentionally reproduces the current game framing for review. Crop fixes and production art replacement require a later task.

Final assembled check passes in run `effects-integration-yG4MK7`, with 18 screenshots at desktop and phone sizes. Native browser measurements confirm all 14 guides too. Parent inspection verifies the corrected Mimic and Flight rows and phone layout. `npm run test:docs` passes 166 checks; `git diff --check` passes. Evidence: external session folder `card-art-crops/verified`.
