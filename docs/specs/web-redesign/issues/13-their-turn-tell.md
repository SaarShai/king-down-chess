# 13 · Their turn: the computer thinks while you decide, then the tell

Status: done on claude/web-redesign-int (waits for the owner's yes on the sample)
Blocked by: 02b, 03, 07 (`tools/verify-their-turn.mjs`)

## Scope

- Owner choice: Their turn A, the tell. Decision D15 (the search before the press). Advisor A: fit the tell into the normal move time. Advisor S: no tell delay.
- Demo: `feat-their-turn-check` (`is-tell`, 274–305; "Their portrait breathes").
- Files: `src/main.ts` (`maybeAi`, the press handler; call lines only); `src/game.ts` (the engine wrapper); a new pure `tellPlan` and its test; a pure lift timing module beside `scene.mjs` (spec rule 8); `docs/2d-first-pieces/board/scene.mjs` and `scene.d.mts` (`setLifted`); `src/render/PaintedView.ts` (an optional `tell`); `src/style.css` (the strip breath and ring); `tools/verify-their-turn.mjs` (part 2).

## Plan

1. [x] The computer searches after the press. The actual mover lifts 3 px for 200 ms before its reply.
2. [x] A move with no moving figure has no tell. The shared scene's tell stays opt-in.
3. [x] A game on one device or a link has no tell. Off has no cue. Reduced motion shows a still glow with no lift.
4. [x] A new game cancels the wait and clears the cue. An old wait plays no reply on the new board.

## Verification

- [x] `turn` proves that the normal and still cues come before the reply and clear after it.
- [x] `w6-parts` checks the lifted frame, the still glow, the figure at rest and clear.
- [x] `npm test`, the type check and all ten named browser checks pass. Both new checks pass twice.
- [x] Sample W6 uses the phone and desktop sizes and one Archer mate video.
- [ ] The owner gives yes on the sample.

## Risks

- The processor works while the player decides (battery on a phone). The search is one search of the level's normal time, and Undo stops it.
- The one engine worker serves this search, the key moments and the second look (20): one search at a time.

## Does not do

- No king shake, no progress ring, no spinner.

## Comments

The actual computer mover lifts 3 px for 200 ms after the press.
Reduced motion shows a still glow with no lift. Off has no cue.
The still cue fixes the review's minor finding. A new game cancels the wait.
Cut: search before the press, tell math, portrait breath and ring.
Tests: 1644 passed, 13 skipped; 50 motion tests pass. Type check passes.
All ten named checks pass. The new end and parts checks each pass twice.
Both plugin checks pass. The page is 4,294,665 bytes; its default stays.
Sample W6: four stills, one phone video and two sheets. No fault.
The sample waits for the owner's yes. Integration runs the full suite.

Batch 3: decided by delegation (2026-10-09).
W6 adds a Beginner reply video and a reduced-motion glow still.
The still holds the reply clock. Normal pace with reduced motion shows the glow.
Motion Off keeps its existing rule: no tell. The sample options are in README.
Tests: 1,667 pass, 13 skip; all 50 board tests pass. All ten browser checks pass.
W6: 10 renders, zero faults. The stills and video frames get a visual check.
