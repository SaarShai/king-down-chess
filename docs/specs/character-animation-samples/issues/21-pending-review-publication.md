# 21 — Review and publish the remaining animation banks

Status: in-progress

## Plan

Review Queen 34, Beast 31 and Rook 20 in parallel from frozen bank bytes. Record exact bank and frame hashes, visual findings and frame/time evidence. Publish accepted banks independently. Keep failed banks excluded. The four owner-launched repair, movement and king attack sessions own their scopes.

Game integration proceeds in ticket 20 in an isolated worktree. This review does not wait for those sessions. No deployment.

## Verification

Check Normal and Quarter playback, source-size contours and game-size playback on light, dark, checkerboard and the game board. Preserve pivot, duration, equipment, endpoints and cues. Agent review is recorded as agent review, never owner observation. Publish new immutable bank/catalog hashes; retain original source evidence. Runtime selects only ready banks.

## Implementation

The publication tool accepts an explicit agent verdict for the exact pending bank hash. It checks the selected bank, source manifest, audit report and runtime PNG hashes. It freezes the review and evidence, then selects a new bank hash. A shared lock prevents an importer or second reviewer from losing a concurrent decision. A repeat import of identical inputs retains the verified decision.

The gallery links to each current review. Saved links identify character, army and action, and survive a review-status change. Turn playback uses recorded outward, hold and return times. Scrubbing keeps the current travel direction. Board checks use the actual stone-board image.

## Checks and review

The focused publication test passes, including concurrent decisions, replay checks, corrupt asset/provenance rejection and draft gates. All three consolidation checks pass, including saved links, recorded timing, reverse scrubbing and exact-input review preservation. Both focused runs pass type checks and 67 existing node checks. This is not a full-suite pass.

CI exposed a missing image-decoder dependency: the runner had no Pillow. The verification job now installs the same pinned Pillow version used for the local checks. The image-validation tests remain mandatory; they are not skipped when the dependency is missing. Full CI must pass before merge.

Independent review found and resolved the publication race, hashed-bank status gate, replay verification, provenance validation, saved-link identity and recorded-cycle issues. A second review found a reverse-scrub direction error. The handler and regression test now preserve return direction. Final checks remain required before merge.
