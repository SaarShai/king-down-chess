# Salvation revision and card crop review

Status: complete; artwork approved and gallery shown; preview only

The owner chooses Called Home, with the correction that the rook must rise from the dead world. The owner also requests all current artwork as shown in each card to check for important cropped content.

## Plan and checks

1. Revise Called Home with built-in image generation. Keep its painterly style, ivory rook and turquoise spirit-to-stone idea. Make the motion read as rising from a dark world below into the living world, with the focal transition visible in the center card crop. Save a new draft without replacing the current game asset.
2. Build a gallery from the actual released-card catalog and renderer. Show full sources beside the actual card crop. Include rule pictures where no painting exists and identify additional card files separately. An isolated worker owns the gallery; the parent owns the image revision and assembly.
3. Check catalog completeness, image loads, actual crop geometry and desktop/phone layout. Inspect the revised artwork and its crop. Show both results for feedback. No game crop or source-art replacement is part of this review.

## Artwork result

Called Home now shows the complete rook rising above a deep opening in the board, with a ruined dead kingdom and fallen chess piece beneath it. Turquoise mist rises into the stone base. The first square revision still loses its crown in the current card crop. A second, landscape composition solves that framing issue: `salvation-concepts/called-home-rising.png` is 1672 × 941 and keeps crown, base and the world below within the 16:9 window. The parent inspects both the full painting and its rendered card window. The former square revision and initial concepts remain separate draft files. `REVISION-PROMPTS.md` records both built-in image-generation prompts. No current game artwork is replaced.

The owner approves the rising revision: “This direction works.” This approves the chosen artwork; replacement animation and production installation remain pending.

## Crop review result

The gallery covers all 21 released cards (12 paintings and 9 current rule pictures) plus Rescue and the card back. Current source images and renderer/catalog match the main checkout; relevant card CSS matches too. The full source remains at its natural ratio, including the three 491 × 512 files.

Visual comparison catches an incorrect initial center-crop assumption. The game's grid makes the image taller than its 16:9 clipping window, aligned at the top. Native browser measurement confirms a 466 × 262.125 window around a 466 × 466 image at top 0 (Sacrifice is 466 × 485.9296875). Guides now mark the bottom clipping and the browser check compares actual image/window geometry. Do not infer visible artwork from computed object-position alone. This rule is also recorded in the card-art STATUS.

Important visible losses include Mimic's transformed shadow, Flight's floating base and lower pawns, and much of March's drum. Crop corrections are not part of this review.

## Verification

`npm run check:browser card-crops` passes in run `effects-integration-yG4MK7`: 21 released faces, 12 paintings, 9 rule pictures, 2 extras, exact renderer output, loaded images, real source ratios and actual image/window clipping at desktop 1280 × 900 and phone 390 × 844. Crop guide toggle, keyboard jump navigation, reduced-motion behavior, browser errors and overflow checks pass. Eighteen screenshots are saved; the parent inspects the corrected Mimic/Flight comparisons and phone layout. Native browser measurement also verifies all 14 image guides against visible fractions.

`npm run test:docs` passes 166 checks in 13 files. `git diff --check` passes. Durable evidence is in the session's external `card-art-crops/verified` folder. The gallery is open in the in-app browser and the approved Salvation revision is linked from it. Production art and game crop styles are unchanged; no commit or deployment.
