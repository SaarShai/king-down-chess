# Living card artwork

Status: first set accepted; preview only

The owner requests Freeze, Sky Lift and Mimic in parallel, with previews for feedback before game integration. Preserve the existing paintings and each card’s identity. Each study shows the full image, the existing 16:9 detail crop and the 34/44 px circular hand icon.

## Plan and ownership

Three isolated workers own one effect module each. The parent owns the shared preview controls, assembly and checks. Copy only each reviewed study folder into the integration worktree. No production code, rule, asset replacement, dependency, commit or deploy is part of this task.

1. Build card-specific motion from the actual image: frost and refracted light for Freeze; wind, cloud and debris for Sky Lift; moonlight, cloak and independent horse shadow for Mimic.
2. Show Original and Animated at identical framing. Provide Gentle loop, Awakening, Replay, Pause, scrub and reduced motion. Give each card a direct button and share early results as they arrive.
3. Inspect multiple frames at desktop and phone sizes. Verify source artwork is unchanged, seeking is deterministic, loops are continuous, controls work and hidden/offscreen previews stop.

## Motion direction

Animate details within the painting. Keep solid structures recognizable and steady. Preserve painted contours and source colors. Avoid whole-image wobble, generic particles, diagram-like lines and broad overlays that conceal the art. Let the strongest motion appear in the full illustration; show the actual smaller crops to judge what survives. One selected sample plays at a time. When the owner requests a painted object to move, animate that source object; surrounding particles do not satisfy the request. Judge detail visibility in the actual center crop, not only the full illustration.

## Acceptance

All three previews load without browser errors or horizontal overflow. Original renders the source image without effects. Animated keeps the source composition. A frame at a fixed time repeats exactly. Reduced motion presents a stable artwork frame; pause, seek, variant changes and visibility changes stop movement. The 16:9 card crop and true-size hand coins remain visible. Visual acceptance stays with the owner. The owner approves the first Freeze preview: “looks good.” Keep that material, including the opacity bounds correction. The owner requests prominent Sky Lift rocks moving upward. For Mimic, keep the gentle loop and make its clouds more prominent. After the revisions, the owner says “great. now do 3 more in parallel, as you recommend.” Preserve this accepted set and continue with ticket 28. No game integration is authorized by this preview decision.

## Delivered and verified

All three studies are live on the shared preview. Sky Lift now raises three prominent source-painted rocks, clearing their original locations and keeping tower masks from restoring rock fragments. Mimic opens in gentle-loop mode and has two fuller cloud wisps, including one visible in the actual card crop. Freeze retains the approved material exactly. Each card has a direct button and Original/Animated comparison, with replay and scrubbing.

The final registered `card-art` browser check passes (run `effects-integration-DqFHdK`), covering 24 frames at desktop and phone viewport sizes, deterministic seeking, exact loop endpoints, source originals, controls and reduced/hidden/offscreen behavior. The parent also visually inspects the revised live previews. `npm run test:docs` passes 166 checks in 13 files. Original source assets are byte-identical to HEAD. The inherited parchment palette and unused imported text-glow rule are recorded design-scan exceptions; this page disables text shadows. Browser viewport checks do not establish physical-phone performance. Evidence is retained in the session’s external `card-art/verified` folder.
