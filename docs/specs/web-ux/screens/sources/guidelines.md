# Menus, screens and journeys: rules and patterns

Date: 2026-10-08. Scope: menus, screens, journeys, the move list and the Extras menu. This document adds to `docs/specs/web-ux/review.md` and `sources/motion-review.md` and does not repeat them: it gives the rules that decide what to hide, where it goes and how it moves.

## 1. Rules

Each rule is one test. The source follows the dash.

### Choice and disclosure

1. **A first game without Extras.** A new player finishes a first lesson and a first game and never opens Extras. — Progressive disclosure (NN/g).
2. **Two levels at most.** Every option is at most two steps from the game screen (Menu, then Extras). There is no third level. — NN/g: more than two disclosure levels usually fail.
3. **Hide only the rare.** An item that most games use stays in view: the board, the status line, Hint, Undo, the power button. Hidden items get much less use (desktop: 27% against 48–50%). — NN/g, hidden navigation study.
4. **A label with scent.** The overflow says what it holds: "Extras" as a word on desktop, never only "…". — NN/g, progressive disclosure (clear expectations).
5. **Three to five choices.** A decision screen shows 3 to 5 equal choices and marks one as the default. — Hick's law (Laws of UX).
6. **Long lists start short.** A list of more than 5 items shows the recommended item first and folds the rest. — Choice overload (Iyengar and Lepper 2000; Laws of UX).
7. **A default, not a setting.** Each setting has a default that suits most players. Delete a setting that few players change; move the rest to Extras. Test: the Menu sheet holds one setting (Sound); all other settings are in Extras. — NN/g, The Power of Defaults; Pennington, Free software UI.
8. **Recognition over recall.** Players see icons and names, never codes: no army codes, no LAN and no "!F:c7" by default. — Nielsen heuristic 6.
9. **Known places.** The board in the center; the moves beside it (desktop) or under it (phone); back and forward arrows; Rematch on the result. Test: a lichess player finds Undo, the moves and Resign in 5 s. — Jakob's law.
10. **One name, one place.** An action keeps its name, icon and place on every screen. Help is always in the same place. — WCAG 3.2.3, 3.2.6.

### Layout and navigation

11. **Frequent near, rare far.** Each-turn actions sit where the thumb rests: the bottom bar on a phone, beside the board on desktop. Resign and other rare actions sit far and small, with a confirm step. — Fitts's law; Hoober, thumb zones.
12. **A toolbar, not tabs.** The game's bottom bar holds actions, so a tap on it never changes the screen. Places (Learn, Play, Workshop) are screens, not bar items. — Apple HIG, Tab bars (navigation, not actions).
13. **Five at most.** A bottom bar holds 3 to 5 items. — Material 3, Navigation bar; NN/g (4 or fewer visible links on a phone).
14. **Sheets for short tasks.** On a phone, Menu, Extras and the full move list open as a sheet. Each sheet has a visible Close, closes with Back and Escape, never stacks, and never needs a drag. — NN/g, Bottom sheets; WCAG 2.5.7.
15. **The board never jumps.** Help, a piece card or the move list does not move the board or the action row (0 px). — review.md, item 1.

### Learning and empty states

16. **Learn by doing.** No slides before play. A tap on Learn puts a piece under the player's finger in 10 s or less. — NN/g, Mobile-app onboarding (no deck-of-cards tutorials); Duolingo.
17. **Fast first fun.** The first move comes in 30 s or less after the app opens; the first lesson ends in under 2 minutes. — Hodent, The Gamer's Brain; time-to-first-fun practice.
18. **Tips at the moment, once.** A tip shows once, the first time it applies (first power, check or promotion), and closes with one tap. — NN/g, contextual help.
19. **Empty states teach.** An empty area says what goes there and how to start, for example "Your moves show here." — NN/g, Empty states (status, learning cue, direct path).

### Game feel

20. **Every action answers.** Each tap gets a reply (sound, motion or both) in 100 ms or less. — Nielsen, response time limits; Swink, Game Feel.
21. **Juice with restraint.** Large effects go only to large events: capture, check, power, promotion, end of game. A quiet move gets a quiet reply, and a move has one peak beat at most. — Jonasson and Purho, "Juice it or lose it"; motion-review rule 10.

### Accessibility (WCAG 2.2 AA)

22. **Targets.** Every target is at least 24×24 px (2.5.8) and 44×44 px on touch (Apple HIG).
23. **Focus.** Focus is always visible (2.4.7). The bottom bar or a sheet never covers it (2.4.11).
24. **Not colour alone.** Every event in the move list has an icon and a word, not only a colour (1.4.1). Icons have text names (1.1.1) and 3:1 contrast (1.4.11).
25. **Motion can stop.** Motion that starts by itself and lasts more than 5 s can stop (2.2.2). Animations Off and Reduce Motion also stop script motion (2.3.3, AAA).

### Motion

26. **Motion with a job.** Each motion shows where a thing comes from, what changes, or what to do next. If it shows none of these, cut it. — Material motion (informative, focused, expressive); Apple HIG, Motion.
27. **Short.** UI motion takes 150–300 ms, travel 300–500 ms, and one sequence less than 1 s (the result is the one exception). Things enter with deceleration and leave with acceleration. — Material 3 tokens (short4 200, medium2 300, long2 500, extra-long4 1000 ms). The repo tokens (80, 160, 300, 450, 650 ms) already fit.
28. **One focus.** One thing moves at a time. List items stagger 30–50 ms. A sheet grows from the button that opens it and goes back into it. — Material motion system (container transform, shared axis).
29. **It ends still.** Every motion ends on a frame that keeps the information; Off shows that frame. — Apple HIG, Motion; motion-review rule 4.

## 2. Reference patterns

| Product | Take | Avoid |
|---|---|---|
| lichess | Zen mode: one switch hides the page around the board. Letters or figurines in the move list, as a choice. Phone app: a bottom bar with a menu button (flip board, resign, settings). Result: Rematch, New opponent, Analysis. | The very long Preferences page; many small links around the board. |
| chess.com | Game Review: one icon per move class (star for best, "??" for a blunder, a book for an opening move); a one-line coach sentence per key move; Key moments with Next; Retry a key move. Figurines in the move list. | Many review numbers (accuracy, rating guess); upsell and badge clutter; tabs plus a More tab. |
| Chess Royale (SayGames) | One large Play button; boards and pieces as rewards. | Ads, coins, a shop. |
| Hearthstone | Main menu: a few large doors. In a game: one gear in a corner, and Concede is in that menu. The History tray: a column of small icons, one per action, a border colour per side, only the last 7–10, details on hover or long press. | Long reward screens after a game. |
| Clash Royale | One large Battle button. In a battle: only the play controls and one emote button. The battle log and replays have their own place. | Chests, timers, many currencies. |
| Duolingo (and its chess course, 2025) | A lesson starts before any account. The lesson screen shows only the task, a progress bar and an X. Feedback comes in a bar from the bottom, with a sound, after each answer. Short lessons, then Continue. Chess: how pieces move first, then mini-puzzles, then short games against one coach character. | Streak guilt, energy limits, many notifications. |
| Monument Valley | The title is the world. The first level teaches with almost no text. One small icon opens the options. Restrained motion; each touch has a sound. | Controls with no label at all: chess actions need names. |
| Apple Chess (macOS) | The board fills the window. Hint is one arrow. The move log, Take Back and speech are in the menus, out of the way. | Discovery: players do not find the move log. |

### What this means for each surface

| Surface | Pattern |
|---|---|
| Title | One main door (Learn on a first visit, Play after that), one second door, one quiet link (Hearthstone, Clash Royale; decision W3). |
| Game setup | Three game cards with one default; all else under More (Round 3). Start game always in view. |
| In a game | The board, a status line, the each-turn actions, one Menu button (the Hearthstone gear, the lichess "…"). A quiet default needs no Zen switch. |
| Settings | No Settings screen: Sound is in Menu, all else in Extras (rule 7). |
| Move list | Collapsed to the last move; the full list on request; icons and sentences (section 3). |
| End | The outcome first, one main action (Rematch), then Review and New game (W8); up to 3 key moments, later with Retry (chess.com). |
| Extras | One sheet, three short groups, no third level (rule 2). |

### A sorting test for Extras

Ask of each control: "Does a new player need this to finish a game?" If yes, it stays in view or in Menu. If no, it goes to Extras. "Is it a designer tool?" If yes, it goes behind `?lab=1` (W6).

The controls in `index.html` today sort like this:
- **In view:** the board, the status line, Hint, Undo, the power button (power games only), the last-move line, Menu.
- **Menu sheet:** New game, Guide, Sound, Extras, and Resign last, with a confirm.
- **Extras:** Board (Show threats, Piece letters, Coordinates, Look, Reset view, Flip board); Game (Copy moves, Send the game link, Always promote to queen, Notation, Game story); Workshop; Animations; Account.
- **Removed or lab:** Thinking time (W1), Cancel selection, the lab armies and Clay (W6).

In a link game, Send the game link is the main action after each move, so it stays in view there.

## 3. A move list that is fun to read

**Shape**
- **Collapsed by default.** One line under the board shows the last move as a sentence with icons. A tap on it (or on "Moves · 12") opens the full list: a sheet on a phone, a fold on desktop. The fold keeps its state.
- **One turn, one card.** A card holds your move and the reply under one number. A Haste turn is one card with two steps. A Freeze with a free move shows both.
- **Quiet moves fold.** A run of quiet moves becomes one line ("3 quiet moves"). Captures, checks, powers and promotions always show.
- **A tap on a row shows that board** (review, with the B4 rewind).

**Row:** side disc, piece icon, short sentence, event icon. Six words or fewer, in player words, with no squares; the board shows the squares when the player taps the row. Chess players can turn on notation (letters or figurines) in Extras.

Examples of in-app copy:
- "Your archer shoots their knight." (Archer icon, gun-sight)
- "Their ogre shoves your rook." (Ogre icon, teal chevrons)
- "Your pawn becomes a queen." (up arrow, queen icon)
- "Frost king freezes your bishop." (snowflake, blue rune)
- "Check!" in red with the king icon; "Checkmate. You win!" with a fallen king.

**Event icons** use the board marker shapes and colours of Round 2, so one thing looks the same everywhere: a gold gem (move), a crimson ring (capture), a gun-sight (Archer shot), teal chevrons (Ogre shove), violet arrows (Maester swap), a blue rune with the king's emblem (power), a crown with a red burst (check), a tower (castle), an up arrow (promotion), linked rings with a count (Beast chain). The piece icons are the rulebook icons of Round 4 (`public/ui/icons/`).

**Voice:** one verb for each piece, for the owner to choose. Examples: the Archer "shoots", the Ogre "shoves", the Maester "swaps", the Beast "eats". `describeMove()` in `src/move-text.ts` already writes a full sentence for each move for screen readers. A short player version can come from the same code, and the full sentence stays as the row's accessible name.

**Key moments and story**
- The result shows up to 3 "Moves to look at again", with the same rows and a star (W8).
- An optional Game story (in Extras): 3 to 5 beats of one line each, for example "First capture on move 4", "Freeze stops their queen", "Checkmate on move 23". This is the chess.com one-line coach summary, with no engine score.
- Sports live timelines and game kill feeds use the same idea: icon, verb, icon, read in one look.

**Motion when a move joins** (tokens from motion-review §5)
1. The row joins at contact, not at launch (motion rule 8), so the list never gives away the move.
2. In the collapsed line, the old sentence slides up and out and the new one slides in (8 px, 160–200 ms, deceleration; shared axis Y).
3. The event icon pops at the hit (300 ms, `pop`). The icon of a captured piece flies from the board to the row or the tray (D1).
4. Check: the row icon pulses red once. Power: the emblem glints once. Promotion: the pawn icon cross-fades into the new piece.
5. The newest row has a gold wash for 900 ms (D2).
6. Off and Reduce Motion: the row is there at once, with all icons and the same information.

**Test:** a player looks away for one computer move, then reads the collapsed line and says what happened in 2 s, with no square names.

## Sources

- NN/g: [Progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/), [Hidden navigation](https://www.nngroup.com/articles/hamburger-menus/), [Bottom sheets](https://www.nngroup.com/articles/bottom-sheet/), [Mobile-app onboarding](https://www.nngroup.com/articles/mobile-app-onboarding/), [Empty states](https://www.nngroup.com/articles/empty-state-interface-design/), [The power of defaults](https://www.nngroup.com/articles/the-power-of-defaults/), [10 heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/), [Response times](https://www.nngroup.com/articles/response-times-3-important-limits/).
- Laws of UX: [Hick's law](https://lawsofux.com/hicks-law/), [Fitts's law](https://lawsofux.com/fittss-law/), [Jakob's law](https://lawsofux.com/jakobs-law/), [Choice overload](https://lawsofux.com/choice-overload/).
- H. Pennington, [Free software UI](https://ometer.com/free-software-ui.html) (2002). S. Hoober, How do users really hold mobile devices? (UXmatters, 2013).
- Material 3: [Navigation bar](https://m3.material.io/components/navigation-bar/guidelines), [Bottom sheets](https://m3.material.io/components/bottom-sheets/guidelines), [Motion tokens](https://m3.material.io/styles/motion/easing-and-duration/tokens-specs) (values as in [Flutter Durations](https://api.flutter.dev/flutter/material/Durations-class.html)), [The motion system](https://material.io/design/motion/the-motion-system.html).
- Apple HIG: [Motion](https://developer.apple.com/design/human-interface-guidelines/motion), [Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars).
- W3C: [What's new in WCAG 2.2](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/).
- Game UX: C. Hodent, The Gamer's Brain (2017); S. Swink, Game Feel (2008); Jonasson and Purho, [Juice it or lose it](https://www.gamedeveloper.com/design/video-is-your-game-juicy-enough-) (2012); [time to first fun](https://bugnet.io/blog/how-to-measure-player-time-to-first-fun).
- Products: [chess.com Game Review](https://support.chess.com/en/articles/8584089-how-does-game-review-work), [chess.com move classes](https://www.chess.com/blog/tf0ch/all-types-of-moves-in-game-review), [Hearthstone History](https://hearthstone.wiki.gg/wiki/History), [Hearthstone Game Menu](https://hearthstone.wiki.gg/wiki/Game_Menu), [Duolingo chess course](https://www.chessdom.com/duolingo-launches-a-chess-course/), [Apple Chess guide](https://support.apple.com/guide/chess/welcome/mac), [Chess Royale](https://apkpure.net/chess-royale-play-and-learn/com.xten.starfall). lichess, Clash Royale and Monument Valley: from use of the products.
