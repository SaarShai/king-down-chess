# Choose how the store build gets character frames

Type: research
Status: open
Blocked by: 04
Parent: [iOS app map](../map.md)
Labels: wayfinder:research

## Question

Before App Store submission, how does the app get the 230 MB of character frames: bundle them, stream them from kingdown.dev through a native scheme handler with a disk cache, or use Apple Background Assets? How does a released app keep the frame hashes it names after later site deploys?

## Context

[Render and assets](../../../research/ios-app-2026-11-07/render-and-assets.md) measures the start set (about 18 MB without the parked Workshop art) and the first board (about 11 MB). Frames are content-addressed (`/character-runtime/assets/<sha256>.webp`). Code must stay in the bundle (App Review 2.5.2).
