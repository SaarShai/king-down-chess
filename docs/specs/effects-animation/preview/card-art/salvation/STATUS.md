# Salvation living artwork

Status: ready for owner feedback. Preview only; no game integration.

## Plan

1. Use the source cyan haze for low mist that crosses the ground. Let soft light rise from the central grave base. Keep all stones and crosses fixed.
2. Cache source masks and textures once. Use an eight-second loop and a 3.2-second awakening. Reduced motion shows the exact original.
3. Run `npm run check:browser card-art`. Inspect the saved desktop and phone frames, the real center crop, and the small hand coins. Check source bytes and owned file scope.

The focal moment is mist gathering beside the central grave, with a slow rise of light through its existing painted glow. Shared controls supply seek, replay, pause, and reduced motion. This module has no clock. Each frame uses cached textures only.

## Acceptance

- The full source painting remains recognizable. Stone and cross contours stay fixed.
- Mist moves inside source crop `0,112,512,288`. No repeated silhouettes, bands, bright columns, or broad white veil appear.
- Loop endpoints match exactly. Awakening starts and ends at the original. Seeking is repeatable. Reduced motion is the exact original. Canvas state is restored.
- Source art, shared files, production code, and dependencies stay unchanged.

## Result and checks

The effect uses two cached textures from clear cyan haze in the original painting. Five low wisps gather and slide across the ground. Four overlapping masks let soft source light rise beside the central grave. A fixed source mask protects dark stone and cross contours. No extra motes are needed.

`npm run check:browser card-art` passes on the final revision. Run: `effects-card-art-salvation-PvRO3J`. All four cards pass. The check records 32 frames at 1280 × 720 and 390 × 844. It verifies exact original views, deterministic reverse seeks, distinct animated frames, exact loop endpoints, stable reduced motion, finite draw values, bounded opacity, canvas state restoration, controls, and hidden/offscreen stops. No browser errors or horizontal overflow occur.

Visual review uses the registered check's Salvation frames through `view_image`, plus the local preview through browser controls. The review covers full art, center crop, hand coins, awakening, and the original return. The source-only branch draws the original at both awakening endpoints and in reduced motion. No extra canvas or image read occurs during a frame. The cache normalizes the source to 512 × 512 once.

The source SHA-256 matches HEAD: `b9b4f481772cb642f5083da282e5b8a9f967fcb5b491d69779a39b2f6beab533`. `git diff --check` passes. Shared files, other effects, production code, dependencies, and all source art stay unchanged by this work.

Evidence is saved outside the checkout in the task output folder, under `salvation/verified/`. `READY.md` marks the first usable pass. `salvation.md` holds the final handoff. Motion is subtle at 34/44 px coin size. No physical-device performance check, broad test suite, game integration, commit, or deployment is part of this task.

Owner feedback: the artwork needs replacement and improvement. Prepare two distinct artwork concepts before animating the selected replacement. The current source and animation remain available as a reference.
