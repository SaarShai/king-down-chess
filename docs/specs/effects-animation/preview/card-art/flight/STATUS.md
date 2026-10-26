# Flight living artwork

Status: accepted by owner. Preview only.

## Result

The two loose ribbon ends flutter as continuous source-painted layers. Each end stays pinned at its hidden join. The mask includes the small gold tips. The cream wind brushwork turns along its original sweep. Four painted leaves drift with it. The bishop, front ribbon and pawns stay fixed. There are no new cloth shapes, glow or strip meshes.

The 800 px source is normalized once to 512 px. Source colours select the painted contours. Masks, adjacent-paint fills, textures and the drawing surface are cached at creation. Frame drawing uses cached images and transforms. The eight-second loop blends through the exact original at the wrap. The 3.2-second awakening starts and ends at the exact original. Reduced motion draws the exact original. Canvas state is restored.

## Plan and checks

1. Inspect the full source and normalized painting: complete.
2. Separate and animate the source ribbon, wind and leaves: complete.
3. Inspect moving contours, full art, center crop and 34/44 px coins: complete.
4. Run the registered browser check and compare the fixed subjects and settled states: complete.

`npm run check:browser card-art` passes in `effects-card-art-flight-qlTjHl`. It covers Flight plus Freeze, Sky Lift and Mimic. All four pass exact original, reverse seeking, distinct frames, exact loop endpoints, finite drawing, bounded opacity, context restoration, stable reduced frames and controls. It produces 32 desktop/phone frames. There are no browser errors or horizontal overflow.

CUA checks the final revision. Clipped rendered PNGs for awakening start, awakening end and reduced motion match Original exactly. The sampled bishop interior and the full pawn/foreground row at six seconds match Original exactly. Visual review includes both flutter directions and the registered desktop and phone frames. No duplicate contour, hard moving cut or strip seam is visible in those views.

The four source paintings match HEAD byte for byte. Flight SHA-256 is `32fc0e9e70c802bd76cdcd1cd1c89c7b2d77734e463ad74e88f1ab0b03919fbe`.

Evidence is in `/Users/za/.codex/visualizations/2026/10/23/01a168fe-8505-7842-89a3-dd078bd311a1/card-art-second/flight/evidence/`. The local preview server is stopped.

## Limits

Adjacent source paint fills the few exposed pixels. Larger cloth travel needs a clean background plate. Motion is subtle at hand-coin size. Physical-device speed, full-game tests and production integration are not checked. Shared controls, source art, dependencies and production code stay unchanged. No commit or deployment.

Owner feedback: “fine.” Preserve this animation. No game integration requested.
