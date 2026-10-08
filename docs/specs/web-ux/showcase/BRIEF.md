# Showcase brief: the King Down UI and UX redesign

This brief is the one source for every agent and advisor in the showcase. Read all of it.

## The owner's words

Owner, 2026-10-08, word for word:

> i'm going to leave you to it for 7 hours. i need you to take ownership of this UI/UX redesign.
> when i'm back, i want a presentation of a variety of options and suggestions and mockups and demos.
>
> * think holistically about styles and approaches and mindsets, but also feature by feature.
> * rethink chess apps and borrow from other genres of games and apps. make it groundbreaking. learn from other games that are similar or not so similar. think marvel snap and hearthstone, for example.
> * don't overdo it. be subtle. think simple and minimal but impactful.
> * think joy balanced with ease of use.
> * experiment and review.
> * use astra and sol 6.1 as advisors and independent judges and thought partners.
> * when in doubt - hide or "fold" features and options so to not overwhelm the user. the core experience must be front and center. that being said, there are many fun features to king down that users would like to know about (or more like teased to use).
> * don't just think about the current features but about what we'll be developing in the future.
>
> the important thing is to have much to show me. come up with the best ideas that will surprise and delight users and massively surpass what people might expect out of a digital chess game, even if we're just talking about the UI and UX for now.

Owner, earlier the same day, word for word:

> i want the next focus to be on the menus and screens and user journeys and interface. i wanted the known UI and UX best practices and guidelines and the motion graphics to be used for simplification, engagement and clarity of the GUI. on a specific note - the play by play transcript - we don't need that to be so dominant. it can be a collapsible section. also, it can be made more more engaging and fun to read, with icons and/or animations rather than just static "code" text". i also want a lot of the "optional" features to be removed and for now placed in an "extra" menu, but to clear as much as possible from the available options and declutter the screen.

## The product

King Down is chess with six new pieces and six kings with powers. It runs in the browser (phone, tablet, desktop).

- **New pieces:** Archer (shoots without moving), Paladin, Guard (cannot be captured), Maester, Beast (chains bites), Ogre. The rules are in `docs/RULES.md`; the ability list is in `docs/MATRIX.md`.
- **Kings and powers:** Flame, Frost, Mud, Shadow, Spirit and Stratus. In the Kings' powers mode each king brings one power (for example Freeze, Ward, Strike, Haste, Flight).
- **Look:** painted figures on a stone board; parchment and ink panels; Cinzel display type and Alegreya Sans body type; crimson primary buttons. The art is in `public/ui/` (pieces, kings, emblems, icons, workshop figures, `stone-board.webp`).
- **Today:** play the computer (Beginner, Casual, Club, Strong), Kings' powers, two players (one device or by link), a daily game, lessons for each new piece, a Workshop to make your own piece, accounts that sync, hints, undo, a move list, review of old positions, key moments after a game.
- **Next (the roadmap, see `TASKS.md` and `docs/`):** card mode (a hand of power cards; a deal of six cards), piece unlocks with crowns (`docs/PROGRESSION.md`), online play, a stronger computer player, Workshop sharing, more pieces (`docs/PIECES-PROPOSED.md`).

## The deliverable

When the owner comes back (about 20:30 PDT, 2026-10-08), the owner gets one presentation: a web page with options, suggestions, mockups and live demos.

- **Holistic:** a small set of directions. Each direction is a mindset and a style that covers the whole app.
- **Feature by feature:** for each feature, two or three options and one recommendation.
- **Demos:** interactive pages that use the real art and, where it helps, the real rules engine.
- **Future:** how each direction holds card mode, unlocks, online play and the Workshop.
- **Decisions:** each open question in the owner's format: the rule, the options, the pick, and what happens on yes.

## The design stance

- Be subtle. Simple and minimal, but with impact. One strong moment is better than ten small effects.
- Joy and ease of use in balance. The joy must never slow down a player who wants to play.
- The core experience (the board, your move, the next action) is always front and center.
- When in doubt, fold it. Hide options until the task needs them. But tease the fun features of King Down so that players want to find them.
- Borrow from other games and apps, not only chess apps: for example Marvel Snap, Hearthstone, Clash Royale, Monument Valley, Lara Croft GO, Into the Breach, Duolingo, Wordle. Say what each idea borrows and why it fits King Down.
- Think about the future features, not only today's.
- Experiment, then review. Every idea gets a critique before it reaches the owner.

## Hard rules

- **Art:** use only the real art (copied from `public/ui/` into `showcase/assets/`). Do not draw new figures. New images come only through the lead.
- **Writing:** all text that the owner reads is in ASD-STE100 (Simplified Technical English): short sentences, active voice, present tense, one meaning for each word. Write to a person.
- **Names:** put no AI model name in any file.
- **Accessibility:** WCAG 2.2 AA. Touch targets of 44 px or more. Color is never the only signal. Every animation respects `prefers-reduced-motion`. The keyboard can do every task.
- **Motion:** each animation has a purpose: it shows a change, a cause, or a place. Most UI motion is 120 to 400 ms. No motion that loops for no reason.
- **No dark patterns:** no loot boxes, no false urgency, no pressure to pay, no streak guilt. Rewards are knowledge, cosmetics or new pieces to play.
- **Product facts:** do not invent rules. Read `docs/RULES.md` when a demo shows a rule.

## Inputs

All paths are from the root of the `claude/web-ux-showcase` worktree unless they start with `/`.

- The merged UI and UX review of today's app: `docs/specs/web-ux/review.md`.
- Tickets: `docs/specs/web-ux/issues/01-defects.md` to `03-menus-screens-journeys.md`.
- The game screen sample (approved picks W1 to W12): `docs/specs/web-ux/sample/`.
- The first menus and screens spec: `docs/specs/web-ux/screens/spec.md`.
- Two outside designers' reports on menus and screens, with renders:
  `/private/tmp/claude-501/-Users-za-Documents-king-down-chess/a41b03aa-d18d-421f-bcf6-5c53a79f9f7b/scratchpad/round2/sol/report.md` (renders in `.../round2/sol/renders/`) and
  `/private/tmp/claude-501/-Users-za-Documents-king-down-chess/a41b03aa-d18d-421f-bcf6-5c53a79f9f7b/scratchpad/round2/astra/report.md` (renders in `.../round2/astra/renders/`).
- Screenshots of today's app at five sizes: `/private/tmp/claude-501/-Users-za-Documents-king-down-chess/a41b03aa-d18d-421f-bcf6-5c53a79f9f7b/scratchpad/ux/shots/`.
- The app source: `src/` (engine `src/rules/`, computer player `src/ai/`, painted board `src/render/PaintedView.ts`, styles `src/style.css`, page `index.html`).
