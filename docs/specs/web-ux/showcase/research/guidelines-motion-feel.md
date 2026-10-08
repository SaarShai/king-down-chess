# Research: UX guidelines, motion and game feel

Date: 2026-10-08. Research track for the showcase. Read with the motion review ([motion-review.md](../../sources/motion-review.md)): this file keeps its five durations and five easings and adds rules, sound, haptics and design moves.

Order: findings with sources (§1), the rulebook (§2), motion tokens (§3), the sound and haptic map (§4), then "For King Down": 14 design moves (§5).

## 1. Findings

### 1.1 Response and waiting

- **Three limits.** At 0.1 s a response feels instant. At 1 s the player notices the wait but keeps the thought. At 10 s attention goes, so show progress. [NN/g, response times](https://www.nngroup.com/articles/response-times-3-important-limits/)
- **The 400 ms pace.** Work flows when neither side waits more than about 400 ms. [Laws of UX, Doherty threshold](https://lawsofux.com/doherty-threshold/)
- **Game feel needs a short loop.** Swink defines game feel as real-time control of virtual objects in a simulated space, with polish on the interactions. "Real-time" means a correction cycle under about 100 ms. [Liz England, review of Swink's *Game Feel*](https://lizengland.com/blog/review-game-feel-by-steve-swink/)
- **Polish shows physics, and has a budget.** Polish makes the world feel self-consistent: particles at contact, squash and stretch. Swink says to make only the effects that the feel needs. [Swink, "Game Feel: The Secret Ingredient"](https://www.gamedeveloper.com/design/game-feel-the-secret-ingredient)

### 1.2 What motion is for

- **Four jobs.** Motion gives feedback, shows a state change, shows place and direction, and signals what a thing can do. Many motions at once compete. Motion that takes attention for the designer's gain is a dark pattern. [NN/g, animation purpose](https://www.nngroup.com/articles/animation-purpose-ux/)
- **Purpose, brevity, control.** Apple: do not add motion for its own sake; make motion optional; keep feedback brief and precise; avoid motion on frequent interactions; let people cancel motion, most of all motion they see more than once. Avoid sustained oscillation near 0.2 Hz. [Apple HIG, Motion](https://developer.apple.com/design/human-interface-guidelines/motion)
- **Disney principles in UI.** Anticipation prepares the eye. Staging gives one focus. Follow-through lets parts settle at different rates. Slow in and slow out is easing. Arcs feel alive. Timing carries meaning. Too much exaggeration annoys. [IxDF, Disney's 12 principles in UI](https://ixdf.org/literature/article/ui-animation-how-to-apply-disney-s-12-principles-of-animation-to-ui-design)

### 1.3 Duration and easing

- **Material 3 tokens.** 16 durations from 50 to 1000 ms (short 50–200, medium 250–400, long 450–600, extra-long 700–1000). Easings: standard (0.2, 0, 0, 1); standard decelerate (0, 0, 0, 1); standard accelerate (0.3, 0, 1, 1); emphasized decelerate (0.05, 0.7, 0.1, 1); emphasized accelerate (0.3, 0, 0.8, 0.15). Duration grows with the area or distance of the motion. [Material motion theming](https://github.com/material-components/material-components-android/blob/master/docs/theming/Motion.md), [M3 tokens](https://m3.material.io/styles/motion/easing-and-duration/tokens-specs)
- **Spatial and effects springs.** Position and size may overshoot. Color and opacity must not ("alpha shouldn't bounce"). Small parts use fast springs; full-screen changes use slow springs. [Material motion theming](https://github.com/material-components/material-components-android/blob/master/docs/theming/Motion.md)
- **Exit is faster than enter.** Mobile: enter 225 ms, exit 195 ms, complex 375 ms. Over 400 ms can feel slow. Tablet +30 %. Desktop 150–200 ms: faster and simpler. [Material, duration and easing](https://m1.material.io/motion/duration-easing.html)
- **Four transitions.** Container transform (a card grows into its page), shared axis (steps in one flow), fade through (no relation), fade (a dialog). [M3 transition patterns](https://m3.material.io/styles/motion/transitions/transition-patterns)

### 1.4 Juice and impact

- **Juice.** Small tweens, squash and sound turn a flat prototype into a lively one: much output for little input. [Jonasson and Purho, "Juice it or lose it"](https://www.youtube.com/watch?v=Fy0aCDmgnxg)
- **Screen shake adds impact,** but it is the first effect that accessibility guides ask to turn off. [Nijman, "The art of screenshake"](https://www.youtube.com/watch?v=AJdEqssNZ-U); [XAG 117](https://devdocs.xbox.com/build/game-principles/accessibility/xag-deep-dives/xag-117-visual-distractions-motion)
- **Hit stop.** Freeze the action for a moment at impact, so a hit feels heavy. A longer "boss stop" marks a big win. [Sakurai, "Stop for Big Moments!"](https://automaton-media.com/en/news/20220824-15208/)

### 1.5 Accessibility

- **Game Accessibility Guidelines, basic level:** a game-speed option; a haptics toggle; no flicker or repeating patterns; no information by sound alone or by fixed colour alone; large, well-spaced controls; interactive tutorials; simple language; settings that stay saved; start a game without deep menus. Intermediate: turn off background movement; practice without failure; remind controls and goals during play. [GAG full list](https://gameaccessibilityguidelines.com/full-list/)
- **Xbox guidelines.** XAG 103: every critical cue has a second channel, and colour is never the only channel. XAG 110: haptics are "always additional, never sole" and always adjustable. XAG 117: a way to stop moving, blinking or auto-updating content; let players turn off shake. XAG 118: photosensitivity. [XAG list](https://learn.microsoft.com/en-us/gaming/accessibility/guidelines), [XAG 103](https://devdocs.xbox.com/build/game-principles/accessibility/xag-deep-dives/xag-103-additional-cues), [XAG 110](https://devdocs.xbox.com/build/game-principles/accessibility/xag-deep-dives/xag-110-haptic-feedback)
- **WCAG.** 2.3.3: motion from interaction can be turned off, for example with `prefers-reduced-motion`. 2.3.1: no more than three flashes a second. 2.2.2: moving content that starts by itself and lasts over 5 s needs pause, stop or hide. [2.3.3](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html), [2.3.1](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html), [2.2.2](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html)

### 1.6 Teaching and choices

- **Teach through play.** Make the tutorial playable and the written guide a reference, not a gate. Choose good defaults from the device. Ask for nothing before play starts. [Apple HIG, Designing for games](https://developer.apple.com/design/human-interface-guidelines/designing-for-games)
- **World 1-1.** The first level teaches by arrangement, with no text, so players "gradually and naturally understand" and then play freely. [Game Developer, Miyamoto on World 1-1](https://www.gamedeveloper.com/design/how-miyamoto-built-i-super-mario-bros-i-legendary-world-1-1)
- **Four steps.** Learn one mechanic, meet a harder case, meet a twist, then show mastery (kishōtenketsu). [Game Developer, Hayashida](https://www.gamedeveloper.com/design/the-secret-to-i-mario-i-level-design)
- **Progressive disclosure.** Show the few options that most people need; put the rest one step away; more than two levels confuses. Label the step so its content is clear. [NN/g](https://www.nngroup.com/articles/progressive-disclosure/)
- **Hick, Fitts, peak-end.** More choices take longer. Large, near targets are faster. People judge an experience by its peak and its end. [Hick](https://lawsofux.com/hicks-law/), [Fitts](https://lawsofux.com/fittss-law/), [Peak-end](https://lawsofux.com/peak-end-rule/)
- **Nielsen heuristics** most used here: 1 status, 3 control and freedom, 4 consistency, 5 error prevention, 6 recognition over recall, 8 minimalist design, 9 errors that explain. [NN/g, 10 heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/)

### 1.7 Teasing without dark patterns

- **Show, explain, show the way.** Disable (show) a feature when people must know it exists; hide it only when it can never apply. Say why it is not available and how to get it. [Smashing, Hidden vs. disabled](https://www.smashingmagazine.com/2024/05/hidden-vs-disabled-ux/)
- **Dark patterns in games** are temporal (grinding, appointment play), monetary (pay to skip) and social. [Zagal, Björk, Lewis 2013](https://research.chalmers.se/en/publication/177148); [deceptive.design summary](https://www.deceptive.design/articles/dark-patterns-in-the-design-of-games)
- **What pulls players back** is autonomy, competence and relatedness, and these predict enjoyment. So a fair reward is a new skill or a new piece to play. [Ryan, Rigby, Przybylski 2006](https://doi.org/10.1007/s11031-006-9051-8)

### 1.8 Patterns in other games

- **Hearthstone history bar:** the 7–10 latest actions as small images at the board's side; hover shows the details; your actions and the opponent's have different borders. [Hearthstone wiki, History](https://hearthstone.wiki.gg/wiki/History)
- **Hearthstone feels physical:** the box opens, cards shuffle and drag like objects; board corners have toys to poke while the opponent plays. [GDC 2015, Sakamoto](https://gdcvault.com/play/1022036/Hearthstone-How-to-Create-an); [TouchArcade, BlizzCon 2014](https://toucharcade.com/2014/11/07/hearthstone-a-conversation-with-devs-at-blizzcon)
- **Into the Breach** shows each enemy attack before it happens. Subset found that this telegraph also made battles faster. [Wikipedia](https://en.wikipedia.org/wiki/Into_the_Breach); [GDC 2019 postmortem](https://gdcvault.com/play/1025772/-Into-the-Breach-Design)
- **Marvel Snap:** low complexity, much depth, games of about two minutes; one simple bluff mechanic lets the rest stay simple. [GDC 2023, "Designing MARVEL SNAP"](https://gdcvault.com/play/1029024/Designing-MARVEL-SNAP); [Pocket Tactics](https://www.pockettactics.com/marvel-snap/ben-brode-gdc)
- **Wordle share grid:** the result without the answer. Spoiler-free, and it made others curious. [Boston.com, 2022](https://www.boston.com/news/national-news/2022/01/04/he-made-wordle-for-his-partner-now-its-an-online-hit/)
- **A chess sound grammar:** Lichess ships Move, Capture, Check, Checkmate, Victory, Defeat, Draw, Error, Confirmation, Select, LowTime and a countdown. [lichess sounds](https://github.com/lichess-org/lila/tree/master/public/sound/standard)

### 1.9 Web platform facts for sound and haptics

- `navigator.vibrate(ms or pattern)` works in Chrome for Android after a user gesture. Firefox for Android returns true but does not vibrate. Safari does not support it. [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/vibrate); MDN compatibility data
- Safari on iOS 18 plays a haptic tick when an `<input type="checkbox" switch>` changes. Since January 2025 this needs a user gesture. It is a WebKit behaviour, not a standard: test it on each iOS release. [WebKit bug 285120](https://bugs.webkit.org/show_bug.cgi?id=285120)
- `navigator.audioSession.type = "ambient"` (Safari 16.4 and later) mixes game sound with the player's music and obeys the silent switch. [MDN, AudioSession.type](https://developer.mozilla.org/en-US/docs/Web/API/AudioSession/type); [Apple HIG, Playing audio](https://developer.apple.com/design/human-interface-guidelines/playing-audio)
- Apple, haptics: use them consistently for one cause each; match haptic strength to the picture; do not overuse; make them optional. "The best haptic experience is one that people may not be conscious of, but miss when it's turned off." [Apple HIG, Playing haptics](https://developer.apple.com/design/human-interface-guidelines/playing-haptics)

## 2. Rulebook (25 rules)

| # | Rule | Source |
|---|---|---|
| 1 | Answer every touch within 100 ms. A press shows at once. | Nielsen limits; Swink |
| 2 | After 400 ms of waiting, show that work goes on; after 1 s, show progress. Never a blank wait. | Doherty; Nielsen limits, heuristic 1 |
| 3 | The opponent's reply never starts before your move has landed and settled. | Disney staging; motion review rule 3 |
| 4 | Each motion has one job: feedback, state change, place or signifier. No job, no motion. | NN/g animation purpose; Apple Motion |
| 5 | Start at the cause, end at the effect. Text, sound and haptic change at contact. | Disney timing; Apple haptics (harmony) |
| 6 | One focus at a time. Play beats in sequence, not together. | Disney staging; NN/g |
| 7 | A tap skips, a new action cancels, Undo is one tap. Only Resign asks to confirm. | Apple Motion; Nielsen 3, 5 |
| 8 | Frequent actions get the least motion, rare moments the most. Repeats get shorter. | Apple Motion; peak-end |
| 9 | Juice on a budget: one peak beat (650 ms or less) per move, one sequence 900 ms or less, the result 2.6 s or less and skippable. | Juice talk; Swink; motion review §5 |
| 10 | Enter decelerates. Exit accelerates and takes about 70 % of the enter time. Travel eases at both ends. | Material duration and easing; M3 tokens |
| 11 | Duration grows with distance and area. Desktop menus run faster than phone menus. | Material motion theming; Material duration |
| 12 | Position and scale may overshoot a little. Opacity and colour never overshoot. | M3 spatial and effects springs |
| 13 | The same thing moves the same way everywhere. A thing that opens grows from where it lives. | Nielsen 4; M3 container transform |
| 14 | Every motion ends on a still frame that keeps the information. Animations Off shows that frame. | WCAG 2.3.3; motion review |
| 15 | Obey `prefers-reduced-motion` and the in-game Normal / Fast / Off. Script motion checks it too. | WCAG 2.3.3; XAG 117; GAG game speed |
| 16 | No flashes over 3 a second, no shake of the whole board, no loop without a reason. Idle motion longer than 5 s can stop. | WCAG 2.3.1, 2.2.2; XAG 117, 118; Apple Motion |
| 17 | Never one channel alone: colour with shape, sound with picture, haptic with both. | XAG 103, 110; GAG |
| 18 | Haptics are short, rare and tied to one cause. A switch turns them off. | Apple haptics; XAG 110; GAG |
| 19 | Sound follows the device: the silent switch mutes the game, and the player's music keeps playing. | Apple Playing audio; MDN AudioSession |
| 20 | Teach by play: a board first, words last. Introduce, develop, twist, conclude. | Apple games; Miyamoto; Hayashida |
| 21 | Show the few options most turns need. Fold the rest one level down, never more than two levels. | NN/g progressive disclosure; Nielsen 8 |
| 22 | One primary action per view. Few, large choices at each decision. | Hick's law |
| 23 | Main actions are large and near the thumb; 44 px minimum. | Fitts's law; Apple games; GAG |
| 24 | Show, do not make players remember: reach, threats and targets appear on the board. | Nielsen 6; Into the Breach |
| 25 | Tease locked things in place: say what it does and how to earn it. No timers, no prices, no guilt. | Smashing; Zagal et al.; Ryan et al. |

## 3. Motion tokens

Keep the motion review's values. Add a wait, a linger and the exit rule. Fast halves every duration except `tap` and `wait`. Off and reduced motion show the end frame at once.

| Token | Normal | Fast | Use | Material neighbour |
|---|---|---|---|---|
| `--t-tap` | 80 ms | 80 ms | Press, switch thumb, square highlight on pointer down | short2 (100) |
| `--t-quick` | 160 ms | 80 ms | Text swap, hover, chip in or out, a figure lifts | short3 (150) |
| `--t-pop` | 300 ms | 150 ms | Marks appear, one pulse, a card rises, a dialog fades in, a refused piece returns | medium2 (300) |
| `--t-move` | 450 ms | 225 ms | A piece travels, a sheet slides, a container transform, a rewind | long1 (450) |
| `--t-peak` | 650 ms | 325 ms | The one peak per move: a cast, a promotion, a king falls, an unlock | long4 (600) |
| `--t-seq` | 900 ms max | 450 ms | Cap for one move with all its beats | extra-long3 (900) |
| `--t-story` | 2600 ms max | 1300 ms | Result, lesson done. A tap skips | — |
| `--t-wait` | 400 ms | 400 ms | Hold to read; delay before a "thinking" sign shows | Doherty |
| `--t-linger` | 1200 ms | 600 ms | A trace fades: the last-move trail (W11), a ghost | — |

| Easing | Curve | Use |
|---|---|---|
| `--ease-out` | cubic-bezier(.2, .8, .2, 1) | Enter, arrive, settle. Near M3 emphasized decelerate. |
| `--ease-in` | cubic-bezier(.55, 0, .9, .4) | Exit; the last leg of a shot or cast before contact. Near M3 emphasized accelerate. |
| `--ease-inout` | cubic-bezier(.45, 0, .55, 1) | Travel on screen: a piece glides, a card grows into a page. |
| `--ease-pop` | cubic-bezier(.34, 1.56, .64, 1) | Scale or position only: marks, card lift, chip in. Never opacity or colour. |
| `--ease-fall` | cubic-bezier(.5, 0, .7, 1.3) | A king falls, a card lands: one small settle at the end. |
| `linear` | linear | Only for time: the thinking ring, a clock. |

Staggers: 38 ms for each square of distance; 45 ms for each list item or card in a deal; 60 ms for each square of a power wave; 100 ms for each tile of a share strip.

Scaling rules:
- **Exit:** 70 % of the enter time, with `--ease-in`.
- **Desktop menus and sheets** (fine pointer): × 0.8. Board motion is game time and does not change with the device.
- **Repeats** (move M6): from the third time in a session, × 0.7. Follow-through shortens first; contact stays.
- **One helper** wraps `el.animate()`, reads the pace and reduced motion, and returns `finished`. CSS alone does not stop script motion.

```css
:root { --t-tap:80ms; --t-quick:160ms; --t-pop:300ms; --t-move:450ms; --t-peak:650ms;
        --t-wait:400ms; --t-linger:1200ms; --pace:1; }
:root[data-pace="fast"] { --pace:.5; }
@media (pointer: fine) { :root { --pace-ui:.8; } }
@media (prefers-reduced-motion: reduce) { :root { --pace:0; } }
/* board:  transition-duration: calc(var(--t-move) * var(--pace)); */
/* menus:  transition-duration: calc(var(--t-pop) * var(--pace) * var(--pace-ui, 1)); */
```

## 4. Sound and haptic map

Haptic column: the Android pattern in ms (`navigator.vibrate`), then whether iPhone can play its one tick. iPhone can tick only inside the player's own tap.

| Event | Sound, at contact | Haptic | Picture it pairs with |
|---|---|---|---|
| Your piece lifts | very soft wood tick, 30 ms | 8 · iPhone yes | Lift, reach ripple |
| Your piece lands | `move` (exists) | 12 · iPhone yes | Settle |
| Opponent piece lands | `move`, 5 % lower, 3 dB quieter | none | Tell, then travel (M1) |
| Capture | `capture` (exists), after the hit stop | 20 · iPhone yes (yours) | 50 ms stop, themed death |
| Archer shot | `shot` (exists): quiet release, hit at contact | 15 at the hit | Arrow line |
| Beast bite | `chain` (exists), one semitone higher for each bite, 4 steps max | 10 for each bite, 3 max | 40 ms stop for each bite |
| Ogre shove | `shove` (exists) | 25 | Push, then follow |
| Maester swap | `swap` (exists) | none | Cross-slide |
| Promotion | new: two rising notes, 300 ms | 20 | Peak beat |
| Check | `check` (exists), when the checker lands | on you: [30, 40, 30]; given: none | Check line (C2) |
| Power cast | new, one for each king: Frost glass chime, Flame flare, Stratus air rush, Mud low thud, Spirit bell, Shadow hush; 300–650 ms | 30 at contact | Three beats (M4) |
| Refusal | new: soft muffled knock, 60 ms. No buzzer | [10, 30, 10] | Shake and a reason (M9) |
| King Down | new: low bell at the fall. Then win: three rising notes; loss: two soft falling notes; draw: one open chord | [40, 60, 80] at the fall | Board-first result (H3) |
| Hint | new: soft bright tick | none | Ghost move (C1) |
| Lesson goal met | new: light chime | 15 | Gold glint |
| Lesson done, unlock | new: stamp and chime | 20 | Stamp, paint fill (M11) |
| Card lift, play, deal (future) | paper lift; card lands at contact; deal: six ticks 45 ms apart | 8 · 15 · none | M12 |
| Your turn in a link game (future) | soft two-note call, only when the tab is hidden or the wait is over 5 s | none | Turn disc |
| Buttons, menus, switches | none | none (iPhone's own switch tick) | 80 ms press |

Rules:
- One board sound for each beat. Priority: King Down, check, capture (shot, bite), power, promotion, shove or swap, move. A lower sound inside the same 100 ms drops.
- Board sounds are the loudest. Interface sounds sit 12 dB lower. Use 2 or 3 pitch variants (±3 %) for move and capture, so repeats do not tire the ear.
- Haptics answer the player's own actions, check on you and King Down. Never the opponent's quiet moves. Defaults: on with a touch screen, off with a mouse. Settings has one Haptics switch.
- Set `navigator.audioSession.type = "ambient"` where it exists. Sound has one switch and keeps today's on/off.

## 5. For King Down: 14 design moves

Each move says what it borrows, what the player sees, when, and for how long. All times are at Normal; Off shows the end frame.

**M1. The opponent's tell.** *Borrows:* Disney anticipation; Nielsen's 1 s limit; Doherty.
- Your move lands and settles. The reply starts no earlier than 500 ms after the landing.
- If the computer needs more than `--t-wait` (400 ms), its portrait breathes once each 2 s. After 1 s a thin ring fills (linear). No spinner, no "thinking" text that moves the layout.
- 160 ms before the move, the chosen figure lifts 3 px and its shadow sharpens. Then it travels (`--t-move`). The eye is on the piece before it moves, so a phone player does not miss it.

**M2. Hold to read, open to learn.** *Borrows:* Hearthstone and Marvel Snap card zoom; M3 container transform; Nielsen 6.
- Hold any piece for 400 ms (mouse: hover 400 ms; keyboard: I on a focused square). The figure lifts 4 px (`--t-quick`). A card rises from it (`--t-pop`, scale 0.92 to 1): portrait, name, the short line ("Shoots without moving, even over other pieces"). Its reach appears on the board in its marker colours, 38 ms for each square.
- Release: the card drops back into the figure (exit, 210 ms). Nothing changes on the board.
- "More" on the card: the card grows into the Guide page (`--t-move`). Back shrinks it into the piece. Works for enemy pieces too.

**M3. Preview before you commit.** *Borrows:* Into the Breach telegraphs; Nielsen 5.
- Arm a power: its targets appear as a wave from your king (60 ms for each square).
- Hover or press a target: the result shows at 40 % opacity in `--t-quick`. Freeze: ice on the figure and a "1 turn" badge. Flight: a ghost of the piece on the empty square. Haste: the second-move squares, faint.
- Release or tap again to commit. Move away to cancel. No confirm dialog.

**M4. A cast in three beats.** *Borrows:* Disney anticipation and follow-through; Hearthstone's hero power; Swink's polish.
- Anticipation, 120 ms: your king portrait dips to 97 % and its colour rises (Frost blue, Flame red).
- Action, 300 ms: the effect travels from the king to the target, `--ease-in` to contact. Sound, haptic and the status line change at contact.
- Follow-through, 230 ms: the mark settles (ice climbs the figure, the wall stands) and stays as the still state mark.
- Total 650 ms: this is the move's one peak.

**M5. A small stop at contact.** *Borrows:* Sakurai's hit stop; "Juice it or lose it".
- A capture: the attacker holds still for 50 ms at contact, then the taken piece's death plays. A Beast chain: 40 ms at each bite. King Down: 120 ms, and all idle board motion stops.
- No screen shake. The board never moves as a whole.
- Cost: 50 ms. The player feels weight, not delay.

**M6. Motion that learns.** *Borrows:* Apple (no long motion on frequent actions, no waiting on repeats); peak-end.
- The first sight of an effect (a power, a Beast chain, King Down) plays in full.
- From the third time in a session, it plays at 0.7 of its time. Contact keeps its moment; follow-through shortens.
- The result sequence (2.6 s) plays in full once a session, then 1.2 s. A tap skips at any time.

**M7. The board is the first lesson.** *Borrows:* Miyamoto's World 1-1; Hayashida's four steps; GAG interactive tutorials.
- Each new-piece lesson is four small boards, about 60 s in all, with no text page first. The line on screen has 8 words or fewer.
- Introduce: one piece, one goal. Develop: two goals. Twist: the surprise rule. For the Guard: "Take the Guard." The try fails with a soft shake and "Only a king can take a Guard." The player then takes it with the king. Conclude: a short win with the piece.
- After 8 s with no move, the goal move plays once as a ghost (G2 in the motion review).

**M8. First sight.** *Borrows:* Hearthstone keyword tooltips; progressive disclosure.
- The first time a piece type is in your game, a small tag pops over it at the start (`--t-pop`, 45 ms between types): "Archer · hold to read". Three tags at most; the rest wait for the next game.
- The tag stays until your first move, then folds into a 6 px dot at the figure's base. The dot goes after you hold that piece once, or after three games.

**M9. A refusal that teaches.** *Borrows:* Nielsen 9; the motion review's shake.
- An illegal drop: the piece returns on its arc (`--t-pop`) and shakes twice (±3 px, 240 ms). A soft knock plays, never a buzzer.
- The status line gives the reason in plain words: "A Guard cannot be taken, except by a king." It stays until your next action. No red flash.
- The third refusal for the same piece in one game adds "Show me": the piece's legal moves play once.

**M10. History chips, not a move list.** *Borrows:* the Hearthstone history bar; the owner's request for a folded, livelier list.
- The closed Moves line shows the last 6 moves as chips: piece icon and verb mark (arrow, cross for a take, bow for a shot, chain for a bite, snowflake for Freeze). Your chips have a solid edge, the opponent's a dashed edge, so colour is not the only signal.
- A new chip slides in from the right in `--t-quick`, when the piece lands. The oldest chip fades out.
- Hold or hover a chip: the board plays that move once as a ghost (`--t-move`), then returns. A tap on the line opens the story list (container transform).

**M11. An honest tease.** *Borrows:* Smashing's "show and explain"; Zagal's dark patterns (what not to do); Ryan's competence; Marvel Snap's reveal.
- Locked pieces and modes sit in place as silhouettes. One line says what it does and how to earn it, with the crown rule of the unlock proposal ([PROGRESSION.md](../../../../PROGRESSION.md): a win at Casual or stronger earns a crown; Maester, Ogre and Guard open at 2, 5 and 9 crowns). Example: "Maester: swaps places with a friend. 1 more crown." Progress shows as crown pips. A loss never takes a crown away. No timer, no price, no streak.
- Tap a silhouette: a 3 s vignette plays once on a 3 × 3 board, then stops on its end frame. "Try it" opens one practice board that you cannot lose.
- On unlock: one peak (650 ms). Paint fills the silhouette from the base up; stamp sound; 20 ms haptic. Then "Play with it" (main), which starts the one-minute lesson, and "Later".

**M12. The card hand (card mode, future).** *Borrows:* the Hearthstone hand and drag; the Marvel Snap card play; Fitts.
- On the opponent's turn, the hand folds to a 24 px strip of card tops at the lower edge. On your turn it rises (`--t-pop`).
- Drag a card: it follows the finger and tilts up to 8° toward the motion. Legal targets light, 38 ms for each square.
- Drop on a target: the card lands flat and shrinks into the square (`--t-move`), then the effect plays as in M4. Drop elsewhere: the card returns on an arc (`--t-pop`). A card you cannot play stays dim and gives its reason on hold. Keyboard: pick the card, then the square.
- The deal of six fans out 45 ms apart, `--t-pop` each: about 525 ms.

**M13. A share strip for the daily game.** *Borrows:* the Wordle grid.
- After today's game: a strip of up to 10 tiles. Each tile is a key moment or 5 moves. Shape and colour show who gained, never where, so nothing is spoiled.
- The tiles turn one by one: 100 ms apart, 300 ms each. Share copies the strip as text with the day number.

**M14. Quiet by default, felt on purpose.** *Borrows:* Apple's good defaults; GAG and XAG settings; WCAG 2.3.3.
- First run reads the device: reduced motion sets Animations Off; a touch screen turns Haptics on; the silent switch mutes sound.
- Settings has one Feel row: Animations (Normal, Fast, Off), Sound, Haptics (only where the device can). The settings stay saved.
- With all three off, the game keeps every piece of information: still marks, text and shapes.
