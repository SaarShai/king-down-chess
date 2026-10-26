# Plugin UI and UX review protocol

This protocol tells a review agent how to judge the King Down ChatGPT plugin as a UX expert, a UI and graphic designer, a game designer and a human player. UI here means the whole interface: the GUI, the graphic design, the art, the type, the colour, the motion, the sound and the words. The aim is a plugin that is clear, short, beautiful, thematic and a joy to play.

The fault hunt has its own protocol: [plugin-qa-protocol.md](plugin-qa-protocol.md). Use its rules (section 1), its setup (section 2) and its surfaces (section 2.3). Report a bug that you see, but do not hunt for bugs.

## Inputs

- [The MVP spec](../specs/chatgpt-mvp/spec.md): the stories and the owner's decisions (the Q rows). Q18 sets the look: the game's own design (`src/style.css` tokens and components, the painted pieces and board), with the ChatGPT host rules as limits only.
- [The approved sample](../specs/chatgpt-mvp/sample/README.md) and its PNGs, and [the host notes](../specs/chatgpt-mvp/notes/f-host.md).
- [The rules](../RULES.md); the web game's look in `src/style.css`, `src/ui/table.css`, [the visual design notes](../visual-design/) and [the styleboard](../styleboard/).
- What the web game has and the plugin does not use yet: board sounds (`src/render/sfx.ts`), the end ceremony (`src/ceremony.ts`), live king emblems and power vignettes in the king picker (`src/power-motion.ts`, [painted motion](../painted-motion/README.md)), piece lessons (`src/lessons.ts`).
- The art in `public/ui/` (kings, emblems, the stone board, icons) and `art-src/`.
- The widget code in `src/plugin/`. Shared code also draws the plugin: `src/render/`, `src/context-line.ts`, `src/move-text.ts`, `src/powers-ui.ts`. When a cause is in shared code, say that the change also changes the website.

## Harness limits

The harness is not ChatGPT. Do these steps first, and do not report these points as product faults.

- Touch: call `harnessSetContext({ displayMode, safeAreaInsets, deviceCapabilities: { touch: true } })` for each phone persona. Some controls get their touch size only when the host reports touch. Give the full context in each call; a Remount uses only the last object.
- Names: the harness gives test names (`host0-…`). To see the first-run name flow, set `requireHandleNext = true`, then start a friend game.
- Record: the fixture does not calculate the record, the rating, the history or the badges from play. Seed them with `POST /fixture-seed`.
- The fixture has no time limits, and its computer replies at once.
- Composer: in fullscreen the frame keeps room at the bottom for the ChatGPT composer. The harness shows no composer there.
- Dark mode: the host page is light. For the dark pass, make the host page dark (`#212121`) and call `harnessSetContext({ theme: 'dark', … })`.

## 1. Lenses

Do the lenses in this order. Finish your own review before you read any other report.

1. **First look.** Look at the inline card for 5 seconds as Sam (section 2). Write what King Down is, what you can do, and one thing that you remember. Do the same for Play and for the first board. A wrong answer or no answer is a finding.
2. **The human player.** Play as the personas (section 2) and do the full journeys (section 3) with no help from the code. Before each tap, note what you expect. After it, note what you see and what you feel. Each hesitation, wrong tap and "what does this mean?" is a finding.
3. **The first-time learner (cognitive walkthrough).** For journeys 1, 3 and 8, at each step ask: does the player know that this step is next? Can they see the control? Do they connect its words or icon with their goal? After the tap, does the screen show that it worked? Name the step and the question for each "no".
4. **The expert.** Walk each screen and sheet (section 4) with the heuristics. Mark each finding with the heuristic or the block that it breaks.
5. **The game designer.** Judge the theme and the game feel (section 5). Propose concepts.

## 2. Personas

| Persona | Device and context | What they want |
|---|---|---|
| Noa, a chess player new to King Down | iPhone, ChatGPT app, fullscreen, 5 minutes on a bus, one thumb | A quick game with the computer, and to learn what is new |
| Sam, a casual ChatGPT user who does not play chess | iPhone, the inline card in the chat first | To understand what this is and whether it is fun |
| Dana, a returning player | phone, 3 games in progress | To find the games where it is their turn, and move |
| Lee, a friend who got a code in a messenger | phone; has never used the plugin | To join the friend's game with no trouble |
| Ari, a desktop player | ChatGPT on a laptop, inline then fullscreen, mouse and keyboard | A long game with all the options |
| Mo, a player with low vision | phone with large text, or desktop at 200% zoom | To read every word and hit every control |
| Kai, a 14-year-old ChatGPT user | Android phone, impatient, skips all text | To play a friend now |

## 3. Journeys

Review full journeys, not single features. A journey starts where the player starts (the chat, the inline card, a code in a messenger) and ends when the player has what they came for (the first move, the end of the game, a changed setting) and is back in the chat. Do each journey from a fresh start as its persona, with no help from the code.

Map each journey step by step: the screen, the action, what the persona expects, what they see, what they think and feel, and the friction (a hesitation, a wrong turn, a wait, a word that they do not know, a choice that they must make too early). Record: success (yes, with help, no), taps, screens, time, wrong turns, and the SEQ score ("How easy was this journey?" 1 = very hard, 7 = very easy). For a score of 4 or less, give the reason in one line.

**Configuration journeys.** The player knows the game that they want before they start. Find the way to it through the menus.

1. Sam: from the inline card, a first game with the computer at the easiest level, with the defaults.
2. Noa: a Casual computer game as Black, with Fairy pieces and Cards, no King powers.
3. Ari: a friend game with Classic chess only (no Fairy pieces, First rank sorting Random, no Cards, no King powers), then send the code.
4. Ari: a friend game with all the options, a chosen king and chosen cards, then the same game again tomorrow (a rematch, or the same options in a new game).
5. Kai: a random player now, with any options. Then the same with Cards on.
6. Noa: start with the defaults, then see on the board that a wanted option is off. How does the player go back and change it?

**Play journeys.**

7. Noa: make 3 moves, use one card or one king power, and understand what it did.
8. Lee: get the code in a messenger, open ChatGPT, join the game, set up the side, and make the first move.
9. Noa: find an open game of another player and accept it.
10. Dana: from the chat after a day away, find the game where it is their turn, see what changed, and move. Then go to the next such game.
11. Dana: stop a game that they do not want to finish.
12. Ari: play to the end (win or lose), see the result, the record and the badges, then play again.
13. Mo: change the name and picture and turn on Symbols only, then go back to a game in progress.
14. Sam: leave fullscreen during a game, chat, and come back to the same game.
15. Noa: turn the phone to landscape during a game and back.
16. Ari: in fullscreen, type "what does this card do?" and "resign" in the composer. Do the chat and the widget agree? (In the harness, call the tool as the model does and show the result with `harnessShow`.)

Harness steps: only alice has a screen; bob acts through `POST /fixture-friend-tool`. For journey 8, bob calls `kingdown_create {kind: 'friend'}`, then `kingdown_invite {game_id}`. For journeys 5 and 9, bob calls `kingdown_create {kind: 'random'}` first. For journey 10, make 3 games with bob first: your turn, bob's turn, and setup. For journey 14, call `harnessSetContext({ displayMode: 'inline' })`. For journey 16, call the tool with `harnessTool` and show it with `harnessShow`.

**A better path.** For each journey:

- Find the shortest path in the product today and put it next to the persona's path.
- Design the ideal path: the fewest decisions, each decision at the moment the player cares about it, good defaults, and no step that the player does not need. Ask: can the chat do part of the journey ("play a friend with cards")? Can the game remember the last options? Can a choice move later (for example, to the seat) or go away? Can two screens become one? Give the new screens as a flow sketch or a mockup.
- Count the gain: taps, screens and decisions, before and after.

**Across journeys.** After all journeys, look at the menu structure as a whole. Draw the map of screens and the ways between them. Mark the steps that many journeys share, the screens that only one journey uses, the dead ends, the places where two journeys meet the same choice in two forms, and the options that are far from the moment that they matter. Propose a better structure, and show which journeys it makes shorter.

## 4. Expert heuristics

Review each screen and sheet: the inline card; Play; New game with the Fairy pieces, Cards and Your king sheets; A friend; Join a game; Looking for an opponent and "Opponent found"; Open games; Set up your side with its Menu; the board with Menu, Moves, Choose a move, All rules and each confirm; the end card; Profile with the badge sheet; Collection (4 tabs); Settings; Pick a name and a picture. See each list with 0, 1 and many items. Use a name of 3 characters and one of 20. For each screen and sheet, ask each question below. A "no" is a finding.

**Clarity and words**
- Does the player know where they are, what they can do, and what happens next?
- Is the game state always clear: whose turn, what the opponent did, how the game ends? After a day away, can the player see what changed? Does each game show the time left for the move?
- Term list: note each game term (card, power, king, seat, code, open game) and each screen where it shows. Two names for one thing, or one name for two things, is a finding.
- Errors: near the cause, plain words, the fix, no blame, the player's input kept. Empty states: why it is empty and one action that fills it. Buttons: a verb and an object.

**Efficiency, redundancy and clutter**
- How many taps does each journey take? Can a step go? Target: 3 taps or fewer from the inline card to the first move of a game with the defaults.
- Remove-until-it-breaks: imagine each element gone. If no journey gets worse, recommend that it goes.
- Content inventory: each piece of information and the journey step it serves. No step: cut it. On two screens: merge it.
- Does each screen have one main action, and is it the most visible? Is the board the hero on the seat and board screens?
- Are rare options behind one control, with good defaults shown?

**Navigation**
- Map each control label to the place that it opens. One label for two places, or two labels for one place, is a finding. Open each screen from each entry, and press Back.
- Is the way between the chat (inline) and the game (fullscreen) clear and smooth?

**Feedback and states**
- Time each wait: under 0.1 s it feels instant; over 1 s the tapped control needs a busy sign; over 10 s the screen needs words and a way out (`holdNext = '<tool>'` holds a reply).
- Can a mistake be undone or confirmed (resign, abort, a wrong move)?

**Game state and board**
- In 2 seconds on a phone: whose turn, the last move, check, the material.
- Are selection, legal moves, threats and the last move separate, clear marks? Does a move animate from its square to its new square?
- Is each card and power clear before use (what it does, its range) and after use (what changed)?

**GUI and graphic design**
- Blur test (CSS `filter: blur(6px)`): the board and the main action still stand out.
- Token audit: list each font size, weight, colour and radius on each screen with a script, and compare with the tokens in `src/style.css`. A value outside the tokens is `inconsistent`.
- At most 3 type sizes per screen; one left edge per column; spacing on the scale; one meaning per colour.
- Art: sharp at 3×, fills its frame, reads at its smallest phone size, the same art for the same thing on each screen.
- Icons: one style and weight, a label or a standard meaning.
- Compare each screen with the approved sample PNG. A difference that the owner did not ask for is a finding.
- Judge beauty last: first the journey check, then the look.

**Touch and access**
- Tap targets 44 × 44 pt or more (Android 48 dp), never under 24 px; board squares count. The main actions in the thumb zone; resign and abort out of easy reach.
- Contrast: text 4.5:1, large text 3:1; icons, marks, borders and focus rings 3:1. Measure it.
- Colour vision: emulate deuteranopia, protanopia and achromatopsia (Chromium DevTools Protocol `Emulation.setEmulatedVisionDeficiency`). Each mark keeps its meaning by its shape.
- Text at 200% and at 320 px width. Reduced motion keeps the state changes. Focus order, focus rings, screen reader labels, alt text for art with meaning.

**The host (ChatGPT)**
- Inline card: at most 2 actions, no scrolling area, clear at 360 px, fits the chat in light and dark mode.
- Fullscreen: no control under the composer or the safe areas.
- The chat and the widget tell one story, with the same names and the same state.
- Check the look against the OpenAI app guidelines. List each place where it breaks a host rule, with the risk at app review and the smallest change that keeps the game's look.

## 5. Theme and game feel

The owner, 2026-10-15: the graphic design is "rather boring, formal, uninspired". It "can be more thematic", for example "buttons can be like bricks (same style as the squares of the board) that are pressed in", "nested menus can be like chests inside chests", and "choosing kings should be more exciting". "Think creatively. Think like a game designer." Also: the king emblems had animations in the web game, and selecting cards "can be more exciting, can have some effects and animations".

Judge and propose, screen by screen:

- **Materials and world.** Does each control feel like an object of the King Down world (stone, wood, parchment, metal, the painted board)? Where is it a plain web form? Propose a material for each component family: buttons, toggles, segmented choices, rows, sheets, headers, the code tiles.
- **Metaphors.** Find the right game metaphor for each structure: a menu, a nested menu, a list of games, a profile, a collection, a waiting room. Use the owner's examples as a start, not a limit.
- **Moments.** The king choice, the card choice, the seat reveal (both sides Ready), the first move, a capture, a power, check, the win, a badge, "Opponent found", a rematch. For each: what is the anticipation, the reveal, the reward? What motion, light, sound or art makes it exciting? Reuse the web game's emblem motion, power vignettes, sounds and ceremony where they fit.
- **Feedback juice.** Press states (a brick that sinks), hover, selection glow, settle and bounce, particles from the emblems. Size each effect to its moment. Keep frequent effects under about 400 ms and never block input. Respect reduced motion.
- **Hierarchy within the theme.** A thematic look must still keep one clear main action, readable words and the board as the hero.
- **Cost.** The page limit is 4.4 MB. Prefer CSS, SVG and the existing art. Say what new art a concept needs.

For your best 3 concepts, make a mockup: an HTML and CSS page in your output folder that uses the real art from `public/ui/`, rendered to PNG at 393 px and at desktop width. Do not change the product code.

## 6. Categories, severity and ranking

Give each finding one category:

`inefficient` · `redundant` · `cluttered` · `unintuitive` (the player does not find the way) · `unclear` (the player sees it but cannot tell what it means) · `confusing` (the player expects one result and gets another) · `misleading` (clear words that say a thing the game does not do) · `inconsistent` · `ugly` · `bland` (correct but has no theme or life) · `access` · `host` (breaks a ChatGPT rule) · `improve` · `simplify` · `beautify` · `joy`

Give each finding a severity from 0 to 4 (0 not a problem, 1 cosmetic, 2 minor, 3 major, 4 blocks the journey), from its frequency, its impact and its persistence. Give the effort (S, M, L). Rank by severity for effort, and tag each: quick win, big bet, fill-in or drop.

## 7. Recommendations

- Give a concrete change for each finding: the new words, the new layout, or the visual change. A mockup helps.
- If a change goes against an owner decision in the spec, put it in a separate list, "Challenge a decision", with the decision row and your reason.
- Also list what works well and must stay.

## 8. Report

Write `report.md` in your output folder. If you cannot write it, put the full report in your final message. Write in ASD-STE100.

1. One line: your main judgement.
2. The top 10 changes, ranked. At least 3 of them change a full journey or the menu structure, not one screen.
3. The theme concepts: for each, the idea, the screens, the mockup files, the new art that it needs, and the cost.
4. The journey table: journey × persona × success × SEQ × taps × screens × time; today's shortest path; your ideal path and its gain. Then the journey maps, and the menu-structure map with your proposed structure.
5. All findings, by screen: category, severity, effort, surface, what you saw (screenshot), why it matters, the recommendation, the likely file.
6. A table of each screen against each heuristic block: the number of findings, or "checked, none".
7. "Challenge a decision" list.
8. What works well: keep it.
9. What you could not review, and why.
