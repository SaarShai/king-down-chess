Status: done

# 04 · The redesign showcase

The owner gives the UI and UX redesign to the agents for seven hours (2026-10-08, 13:35 to about 20:30 PDT). The owner wants a presentation of options, suggestions, mockups and demos when the owner comes back. The owner's words and the rules are in [the brief](../showcase/BRIEF.md).

## Plan

1. [x] Research and a demo kit (one workflow): five research tracks (card and battler games; chess and board game apps; calm puzzle and casual games; UX, motion and game-feel guidelines; the King Down features of today and the roadmap), then an idea bank. In parallel, a demo kit: the real rules engine and computer player in one browser bundle, a board that looks like the painted board, tokens, UI parts, a capture script.
2. [x] Two outside advisors give their own ideas, without the research of the others.
3. [x] The lead picks the directions and the demos. The advisors judge the plan.
4. [x] Build the demos (one workflow): the holistic directions and the feature demos, with options. Each demo renders at phone and desktop size and passes its own checks.
5. [x] Review: critics and the two advisors judge each demo from the renders. A repair round fixes what they confirm.
6. [x] The presentation: one web page with the directions, the features and their options, the future, the recommended path and the owner decisions. Publish it as a private page and keep the source in this folder.

## Verification

- [x] Each demo opens with no console error at 390 × 844 and 1440 × 900, has no sideways scroll, and has touch targets of 44 px or more on the phone. `kit/capture.mjs` gives `ok: true` and no faults for all 27 demos (`renders/<id>/checks.json`).
- [x] Each demo with motion respects reduced motion: each demo checks `prefers-reduced-motion`, or (future-crowns) uses the kit's duration tokens, which go to 0 ms.
- [x] The playable demos make only legal moves (the real engine) and the computer answers. A headless test plays Freeze, a move and the computer's reply in the prototype, then Undo; the power shows "1 left" again.
- [x] The advisors' verdicts are in the presentation (25 blocks, and the chapter "The advisors' review"), with what changed because of them: whole-turn Undo, the draw words, the full limits of Darkness, Death Touch and Haste, and five decisions. Their reports: `research/advisor-a-judging.md`, `research/advisor-s-judging.md`.
- [x] The published page loads all its art from its own files (no local server). A headless check of `dist/` at 1440 × 900 and 390 × 844: 14 chapters, 173 images, no missing file, no error, no sideways scroll; three live demos open in their frames.
- [x] The text that the owner reads follows ASD-STE100 and holds no model name (a search of the deck, the demos and the reports finds none).

Published: https://claude.ai/artifact/TyrdpKYCGGuf4dHfhv7Ki3 (private). Rebuild with `node docs/specs/web-ux/showcase/build.mjs`, then publish `dist/` with `index.html` as the page; one version holds at most 511 files, so `build.mjs` keeps only the stills that the deck shows.

## Owner choices

The owner's choices, 2026-10-08, to register only ("don't start yet, just register"):

- **Reading a piece (`f-read`): A, Tap to read.** Our pick was A and B together, so Hold to read (B) is out.
- **Your move (`f-verbs`): A, Verb marks.** The same as our pick.
- **Their turn (`f-their-turn`): A, The tell.** The same as our pick.
- **King powers (`f-powers`): B, A coin by the portrait.** Our pick and the pick of both advisors was A, the tile with words. The coin shows no name. Proposal: a tap on the coin reads the power and its state ("Freeze · 1 left") in the tap-to-read line.

- **The move history at rest: A, One line.** The same as our pick.
- **Undo: rewind, with no words.** The owner chose "Undo plays the moves backward but doesn't say what it takes back." A player can undo only before the other player takes their turn; after that, the move stays. Against the computer, this means Undo works only until the computer's reply starts.
- **No Hint.** The Hint button goes from the game screen.
- **The end of a game: B, Ceremony.** Our pick was A, quiet.
- **The first minute: a plain Start button.** The owner first chose A, Take your first shot, then removed it. No first-shot lesson; the first visit shows one Start button.

- **Home (`f-home`): A, The table.** The same as our pick.
- **Starting a game (`f-new`): A, One short sheet.** The same as our pick.
- **Menu and Extra (`f-menu`): C, Index and Tricks.** The same as our pick.
- **Lessons (`f-lessons`): A, Piece shelf.** The same as our pick.
- **Sharing (`f-share`): parked.** No work on sharing for now. This parks the decision "Sharing words" and the idea "Try this turn" too.

- **Card mode (`u-cards`): C, Coins by the king.** Our pick was A, the folded hand. In a game with kings' powers and cards, the first coin is the power, and it is bound to the king's icon in the drawing. This agrees with the coin by the portrait for powers.
- **Unlocks (`u-crowns`): parked.** The owner works on unlocks separately; how they work is not decided.
- **Online play (`u-online`): A, Previously.** The same as our pick.
- **Workshop sharing (`u-workshop`): A, Card.** The same as our pick. Custom pieces travel as cards. This stays in, outside the sharing park.

- **Where to build: the real app**, in steps, one pull request per step.
- **The base look: the Quiet Table only.** No dark stage, also when the device is in dark mode.
- **Undo and the turn button.** A button plays (submits) the turn and gives the other player their turn. Undo works only before the player presses it. It applies in all modes: the computer, two players on one device, and online.
- **The ceremony: our pick** (`feat-king-down` B, "Ceremony"): the final blow again at half speed, the king falls, "King Down" settles in, three tiles rise.

- **The first deal: B, a chosen seed.** The first game draws a chosen army with an Archer and a Beast.
- **The other picks: ours, for now** (the owner can change them later): levels in words, with no faces; the second look as an opt-in practice aid; Warm joy, with no dial.

When the work starts: the decisions "Reading a piece" and "The power control" take these answers, and the path step "The power tile in words" becomes "The coin by the portrait", "Hint, Undo, Menu" becomes "Undo, Menu", and the prototype's whole-turn Undo changes to the owner's rule. The deck shows them on its next publish.

## Next round (from the advisors)

- The prototype's Home from `feat-home` A; Retry and Tricks in the prototype.
- One set of marks in the kit (step, take, shot, shove, swap); Check stays in view while a player reads or selects.
- Shorter power effects (250 to 350 ms) and no king shake. The tell stays (the owner's choice), inside the normal move time.
- A Review state for old moves.
- Proof screens: every power's full turn, promotion, draws, two players on one phone, link-game safety, a keyboard and screen-reader journey.
- Rule text still to fix: Mercy, Holy Light and the Beast's chain limit in the prototype; Darkness, Mercy and Haste in `feat-new-game`; the spent Strike in `dir-pocket` `end` and `future-online` `result`; the `feat-king-down` recap from one real game.
