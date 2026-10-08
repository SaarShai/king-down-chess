# King Down Chess: motion review

Independent review, 2026-10-08, code at `main` 860386f. Written in ASD-STE100. Repo paths: `src/...` and `docs/...`. Screenshots: `ux/shots/`. My probes of the live app: `ux/motion/probe/`. Prototypes: `ux/motion/proto/`.

## 1. Summary

1. The board already moves well (gaits, themed captures, the marker ripple, king effects). The work is to fill gaps, not to add a new layer.
2. The largest gap is the kings' powers. Freeze, Ice Wall and Sacrifice play no motion (`src/render/PaintedView.ts:116-118`). After a Freeze, nothing on the board shows the frozen piece (`probe/f1-after-freeze.png`, `probe/f3-after-reply.png`).
3. The second gap is cause and effect. Hint, check and threats show *where*, but not *why* or *which way*. The panel (tray, header, check sound) changes when a move starts, before the board shows it (`src/main.ts:591-596`).
4. The top ideas carry information first: F3 frozen-piece state, H3 board-first result, C1 hint ghost, E1 turn token and thinking ring, C2 check line, F1 arming from the king.
5. One small motion system holds it together. It has five durations already in the code (80, 160, 300, 450, 650 ms), five easings, a 38 ms board stagger, and ten rules that keep motion minimal, skippable and readable with Animations off.

## 2. Inventory of existing motion

| Where | What moves | Timing | Source |
|---|---|---|---|
| Moves | Gaits: walk, glide, hop | walk 440; glide min(480, 350+28/sq); hop 420; Fast ×0.5 | `gait.mjs`; `PaintedView.ts:119` |
| Captures | Themed deaths; shake on contact | ~900-1000; shake 240 | `king-captures.mjs`; `scene.mjs:580` |
| King falls | Topple at the end of the game | FALL 650 | `scene.mjs:39`, `:588` |
| Idle | Selected piece breathes; atmosphere; king element effects | 30 fps; periods 4-8 s | `PaintedView.ts:131-134`; `king-effects.mjs` |
| Markers | Pop and ripple from the selected piece; pulse; hover ghost | 300 pop, 38/sq | `marks.ts:33-34`, `:73-78` |
| Title | Lineup and kings rise; copy fades; hover lift; live kings | 520 + 45 stagger; 700; 220 | `style.css:599-607`, `:617`; `main.ts:1422-1424` |
| New game | Power vignettes (hover, focus, chosen); emblem effects | 3.2 s loop | `power-motion.ts/.css` |
| Buttons | 2 px press; colour; More options caret | 80-120 | `style.css:172`, `:177`, `:343`, `:397`, `:423-425` |
| Result card | Card kings topple | 500 after 150 | `style.css:473-476` |
| Workshop | Set A: gait bob, cross-fade, shake, gold ring | 480 / 250-300 / 560 / 560 | `src/workshop/motion.ts` |
| Sound | move, capture, check, shove, shot, chain, swap | launch; hit at contact | `sfx.ts:57-72`; `main.ts:584-597` |
| **Snaps (no motion)** | Freeze, Ice Wall, Sacrifice, Haste pass; Undo; review back; lesson "Not quite"; New game, rematch; promotion; board flip; all dialogs; tray, list, header text | 0 | `PaintedView.ts:116-118`; `main.ts:981-995`, `:901-921`, `:611-617`, `:954-979`, `:945-948`; `probe/promo-strip.png` |

Animations is Normal, Fast (half) or Off; reduced motion sets Off (`main.ts:1312-1317`). The reduced-motion CSS does not stop `el.animate()` (`docs/visual-design/workshop/WORKSHOP-revision-3-2026-10-07.md:1117`), so script motion must check the pace itself.

Keep as is: selection, gaits, themed captures, the title entrance, the picker vignettes. They set the style the proposals copy.

## 3. Proposals by area

These rules apply to every proposal:
- Fast halves all durations and staggers.
- Off and reduced motion show the end state, and the end state always keeps the information.
- A tap on the board or Escape skips to the end state (`main.ts:815`, `:1328`).
- DOM motion uses transform and opacity only.
- Board motion draws in the scene's `setDecorate` layers and uses `keepAwake(ms)`, never a second frame loop.

Easings: `out` (.2,.8,.2,1), `inout` (.45,0,.55,1), `pop` (.34,1.56,.64,1), `in` (.55,0,.9,.4), `fall` (.5,0,.7,1.3).

### A. Title, first run, loading

**T1 · Title becomes the board** (title to game; both)
- Problem: Play and Learn cut from the dark title to the light game in one frame (`01-title-first-*` to `02-after-title-play-*`). They look like two products.
- Shows: one place, which a cut cannot show. The title floor and its warm light carry into the board.
- Storyboard (600 ms): 0-200 the copy and lineup fade (`out`). 100-500 the night layer lifts 1→0 (`inout`) while the floor moves to the board rectangle (one FLIP transform). 300-600 the army musters (T2).
- Smaller version: the title fades 250 ms, and a night tint over the game fades .6→0 in 400 ms.
- Off: today's cut.
- Cost: S (small version) or M (FLIP). Files: `main.ts:1398-1430`, `style.css`. Phone risk: low.
- Value: M. Adds.

**T2 · The army musters** (New game, rematch, load; both)
- Problem: pieces snap in (`main.ts:954-979`). The back rank is a random draw, so the setup is news.
- Shows: the drawn rank arriving file by file, the same on both sides, so the two armies plainly mirror.
- Storyboard (~750 ms): back-rank pieces rise into place (opacity 0→1, 24 px→0, 360 ms `out`, the title's `rise`), files a→h, 38 ms per file, both armies at once. Pawns rise as one row 80 ms later. A loaded saved game fades in at once in 200 ms.
- Off: snap. A tap ends the muster.
- Cost: M. Files: `scene.mjs` (an entrance offset per figure), `PaintedView.ts`, `main.ts`. Phone risk: low.
- Value: M. Adds, and it ties the game to the title.

**T3 · The last move plays when a game opens** (link, Continue; both)
- Problem: a friend's link opens on the new position. Only the square the piece reached is marked (owner, 2026-10-04, `main.ts:399`).
- Shows: the friend's move once, with its gait and sound. The owner's rule stays.
- Storyboard: 0-300 the board shows the earlier position; at 300 the last move plays (440-480 ms); then today's still.
- Cost: S. Files: `main.ts` (`view.sync(prev)`, then `animateMove`). Phone risk: none.
- Value: H for link games. Simplifies: no need to read the move list.

### B. Board and moves

**B1 · A refused tap shows its cause** (`main.ts:814-862`; mostly new players)
- Today a text notice appears in the panel, away from the eye.
- Storyboard: 0-240 the piece shakes (0, -3, 3, -3, 3, 0 px; the scene's shake). 0-300 the cause glints: a frozen badge pulses, the Guard shows a shield, Holy Light shows gold at the king, or the check line flashes.
- Off: the text only.
- Cost: S (`scene.mjs:580`, refuse paths, `marks.ts`). Value: M. Adds; the notices can get shorter.

**B2 · The Beast's chain plan** (both)
- "Click victims in order" (Guide text), but chosen victims are not drawn: `refresh()` gives the view no pending list (`main.ts:390-402`).
- Storyboard: each pick draws a path segment from the Beast (160 ms `out`) and pops a number chip (300 ms `pop`).
- Off: all at once.
- Cost: S-M (`main.ts`, `marks.ts`). Value: M. Simplifies.

**B3 · A short last-move trail** (both)
- A faint ground trail from the from-square to the to-square fades 1.2 s after the move. The still board keeps the owner's rule.
- Cost: S (`PaintedView.ts` drawMarks). Value: M.
- This touches the 2026-10-04 decision (question 1).

**B4 · Undo, review and lesson retries rewind** (`main.ts:981-995`, `:901-921`, `:611-617`; both)
- Problem: the board snaps. Undo removes two plies at once. `probe/f4-undo-60ms.png` already shows the final board at 60 ms.
- Storyboard: newest ply first, each piece slides back (260 ms `inout`). A taken piece rises back (200 ms `out`, from 150 ms). 60 ms gap between plies; two plies take ~640 ms.
- Off: snap.
- Cost: M (`scene.mjs` reverse glide and restore, `PaintedView.animateUndo`, `main.ts`). Phone risk: low.
- Value: M-H. Adds.

**B5 · Promotion transforms the pawn** (both)
- Problem: the pawn snaps into the new piece (`probe/promo-strip.png`), and there is no promotion sound.
- Storyboard (650 ms): 0-300 a gold ring pops at the pawn's feet. 100-500 a light column rises and fades. 250-450 the pawn cross-fades to the new piece. 450-610 it settles (scale 1.06→1).
- Off: snap.
- Cost: M (`scene.mjs` promotion plan, `ghost()`, `sfx.ts`). Value: M. Adds.

**B6 · The board turns with a cue** (`main.ts:945-948`)
- The flip is instant. A 180° turn would show upside-down painted figures, so use a cue instead.
- Storyboard: a night tint fades in over 150 ms, the board flips, and the tint fades out over 200 ms. "You play Black" slides up 12 px, then fades after 1.5 s.
- Cost: S. Value: L-M.

### C. Hint, check, threats

**C1 · The hint plays its move as a ghost** (`main.ts:885-896`; `marks.ts:144`; mostly new players)
- Problem: two identical gold outlines (`06-game-hint-desktop.png`), with no direction.
- Storyboard (P2): 220-640 the bulb glows while the engine thinks (400 ms). 640 a dashed outline on the from-square. 680-1240 a see-through piece (opacity .6) travels with its gait. 1200-1500 a solid outline pops on the to-square. The ghost then rests at .38. The key-moment "better move" (`main.ts:1075`) uses the same ghost.
- Off: dashed from, solid to, ghost at .38. Direction stays readable.
- Cost: S (`marks.ts` dashed first square; `scene.ghost()` in the over layer with `keepAwake(600)`).
- Value: H. Simplifies.

**C2 · Check shows its cause** (`PaintedView.ts:186-190`; `style.css:130`; both)
- Problem: a red ellipse at the king only. An Archer or Death Touch can check through other pieces, so the cause is often hidden. The check sound plays when the move starts (`main.ts:591`).
- Storyboard (P2):
  - 10-260 a red ground line draws from the checking piece to the king (`out`).
  - 220-540 the king's ring pulses once.
  - 670-1070 the line thins to dashed (.55) and stays while the check stands.
  - A double check draws two lines. Shot checks draw a low arc.
  - Move `snd.check()` into the strike callback, so it plays when the piece lands (`docs/lessons/art-and-motion.md:17-18`).
- Off: the dashed line and the ring.
- Cost: S (`PaintedView.ts`, `main.ts`). Value: H.

**C3 · New threats show the attacker** (`main.ts:527-547`; `07-game-threats-phone.png`; learners)
- When a threat is new after the last move, a red line from the attacker draws in over 400 ms, then fades over 300 ms. Old threats stay still. Pointing at a piece redraws its lines.
- Off: the markers only.
- Cost: S-M (`threatsIn()` must return attackers; DOM layer). Value: M.

### D. Captures, material, move list

**D1 · The taken piece reaches the tray at the hit** (both)
- Problem: `refresh()` runs before `animateMove()` (`main.ts:593-596`). "White took" showed the pawn at 0 ms while the Knight's capture played for more than 1 s (my probe log). The header and check text also change when the move starts.
- Storyboard (P4): 470 the hit. 470-590 the pawn icon appears at the victim's body (`pop`). 590-1040 it flies down, then across, under the move list. 1040-1200 the tray slot pops 1.3→1. If the tray is off-screen (phone), there is no flight.
- Off: the tray updates when the move ends.
- Cost: S (split `refresh()`: board state before the move, panel after the hit). Value: M. Fixes a spoiler.

**D2 · The newest move glows in the list** (`main.ts:445-455`)
- A gold wash on the new entry over 900 ms (P4). In review, the highlight slides 160 ms between entries.
- Cost: S. Value: L-M.

**D3 · Material balance (optional)**
- A "+2" chip by the tray rolls to its new value at the hit (160 ms).
- Cost: S. Value: L-M. Owner question (question 5).

### E. Turn, computer, two players

**E1 · Turn token and thinking ring** (`main.ts:428-431`; both)
- Problem: whose turn it is lives in text only. "thinking…" shows for ~300 ms and adds a header line on desktop (`probe/c3-check-thinking.png`).
- Storyboard (P3):
  - A 26 px disc in the army colour (`style.css:159-160`) turns over in 320 ms (`inout`); the text cross-fades (140 ms out, 160 ms in).
  - While the computer thinks, a ring fills over its time budget (beginner up to 700 ms, club up to 800 ms, strong 200-4000 ms; `src/ai/skill.ts:15-21`), then fades.
  - On check, the ring turns red and pulses once.
- Off: the disc swaps at once; a still dashed ring shows while the computer thinks.
- Cost: S. Value: H. Simplifies: it replaces the "thinking…" line and its layout jump.

**E2 · Hot-seat hand-off**
- The board edge on the side to move warms with a gold line (300 ms), and the token flips.
- Cost: S. Value: M.

**E3 · Link copied** (`main.ts:1126-1137`)
- A check mark draws in the button (240 ms) and the label cross-fades.
- Cost: S. Value: L.

### F. Kings' powers

**F1 · Arming spreads from the king** (`main.ts:792`; `style.css:707`; `18-powers-armed-*.png`; both)
- Problem: all runes pop at the same time, because an armed power has no selected piece (`marks.ts:72-78`, `from` is null).
- Storyboard (P1):
  - 320-740 the king flares in its element colour.
  - From 360 a ground wave leaves the king (480 ms). Each rune pops when the wave reaches it, 60 ms per square.
  - Cancel: the runes shrink back toward the king (200 ms).
- Off: all at once (today).
- Cost: S (`marks.ts` with `from` = the king's square; flare in `PaintedView.ts`). Value: M-H. It teaches that the power belongs to the king.

**F2 · The board plays the power** (`PaintedView.ts:116-118`; `docs/painted-game/README.md:27`; both)
- Problem: Freeze, Ice Wall, Sacrifice and a Haste pass play nothing. Strike, Flight, Leap and March use the normal gait. The New game vignettes promise a motion that the board does not keep.
- Shows: the vignette's own motion (`power-motion.ts` SCENES):
  - Freeze: an ice bolt from the king. Ice Wall: an ice dome rises.
  - Strike: a fire trail. Flight: a gust. Sacrifice: a beam turns the pawn.
  - Leap: an arc over own pawns. March: dust prints. Death Touch: a tendril from the king. Haste: ghost steps.
  - For the opponent's power, their king flares first for 300 ms.
- Storyboard (P1): 0-300 flare, 300-650 the effect travels (`in`), 650-950 impact. Each cast stays under 900 ms.
- Off: the end state plus the F3 marks.
- Cost: L for all twelve; M for Freeze, Ice Wall and Sacrifice first (`scene.mjs` plan types, as `docs/painted-motion/README.md:31` describes). Phone risk: M (particle counts).
- Value: H. The big bet.

**F3 · Frozen and walled pieces keep a mark** (`pos.marks`, `src/rules/engine.ts:1025`; `:1695-1704`; both)
- Problem: no board mark after a Freeze (`probe/f1-after-freeze.png`, `probe/f3-after-reply.png`). Only "!F:c7" in the list says it happened. Walled pieces are the same.
- Storyboard (P1):
  - 1950-2400 ice climbs the figure from the feet.
  - 2400 a snowflake badge pops, with a turns-left ring when `RULES.markTurns` > 1.
  - If the owner tries to move the piece: it shakes (280 ms) and the badge pulses.
  - Thaw: cracks draw (200 ms), three shards fall (320 ms), the badge scales out.
  - Ice Wall: a dome rises (300 ms) and fades when the ward ends.
- Off: the tint and badge at once. Use a light tint, not grey, because a frozen piece still gives check (`engine.ts:1692`).
- Cost: S-M (`PaintedView.ts` reads `pos.marks`; a tinted `scene.ghost()`). Value: H.
- Use the countdown branch's square ring (83f442f) as this badge, not a second mark.

**F4 · Uses-left tick** (`main.ts:496-525`)
- The count digit rolls down (140 ms out, 160 ms in). At 0, the button desaturates over 200 ms.
- An always-on power that acts (March, Holy Light, Death Touch) glints on its emblem once.
- Cost: S. Value: M. It makes passive powers visible.

### G. Guide and lessons

**G1 · Guide move diagrams** (`15-guide-*.png`; `style.css:482-490`; mostly new players)
- Problem: each card is a portrait and text. The Archer capture text is one long sentence: "classic shots (diagonal-adjacent or orthogonal-2) plus either forward diagonal at distance 2, through blockers" (`texts.json`).
- Storyboard (P6), with each heading lit while its part plays:
  - MOVES: gems sweep around the Archer, 38 ms each, with no gem on occupied squares.
  - CAPTURES: the shot pattern spreads out at 60 ms per ring, and enemies get sights. The Archer shoots over its own pawn without moving.
  - Ogre: MOVES, then the CAPTURES ring, then SPECIAL chevrons and the shove.
  - The diagram rests on a still frame with all marks. It plays when the card scrolls into view; a tap replays it.
- Off: the still frame.
- Cost: M (a new `guide-motion.ts` built like `power-motion.ts`). Value: H.
- Simplifies: the Archer text can become "Shoots the red squares without moving, over any piece." The diagram can also serve the title lineup and Workshop Set B1 (`WORKSHOP-revision-3...md:1119`). It changes the Round 2 portrait slot (question 3).

**G2 · Lesson coach marks** (`src/lessons.ts`; `16-lesson-phone.png`; new players)
- Problem: "Tap your archer, then the marked enemy pawn." The pawn is marked only after the Archer is selected, so the first step has no mark.
- Storyboard: the lesson piece pulses twice (600 ms each), then rests with a faint ring. After selection, the target pulses once. With no move for 8 s, the goal move plays as a C1 ghost.
- The piece is computable: the from-square of a legal move where `goal(pre, m)` is true (`lessons.ts:19-54`).
- Cost: S-M (`main.ts:629-647`, `marks.ts`). Value: H. Simplifies.

**G3 · Lesson result** (`main.ts:611-617`)
- Done: the progress icon stamps (scale 1.4→1, 200 ms; `style.css:256-258`).
- Wrong: the move plays, the piece shakes, a 300 ms pause, then a B4 rewind.
- Cost: S with B4. Value: M.

### H. Choices, result, dialogs

**H1 · Capture-or-push buttons show the outcome** (`main.ts:741-757`; `22-capture-or-push-phone.png`)
- Each button gets a 3×2 vignette (capture: red ring; push: slide and follow with chevrons). It loops on hover and focus only, as in the picker.
- Cost: S-M. Value: M. Replaces the paragraph.

**H2 · Choices open from their square** (`main.ts:702-718`, `:741-757`)
- The sheet grows from `view.screenOf(sq)` (scale .9→1, 200 ms) with no board blur, and shrinks back on close (140 ms).
- Cost: M. Value: M. It changes the modal look (question 4).

**H3 · Result: the board first, then the card** (`main.ts:1012-1037`; `23-result-*.png`; both)
- Problem: `setFallen` and `showModal` run in the same tick (`main.ts:1030`, `:1036`). The backdrop hides the board's king fall (`probe/c2-end.png`), and then the card's kings topple again (`style.css:473-476`).
- Storyboard (P5):
  - 0-434 the mating move. 440-660 the check line. 700-1040 crosses pop on the king's attacked free squares.
  - 1150-1800 the king falls (650 ms `fall`), with dust.
  - 1850-2200 a gold ring under the winning piece.
  - 2250 the board dims. 2300-2600 the card rises with its king already down. Key moments follow, 45 ms apart.
  - Resign: the king falls at once, with no line. Draw: no fall.
- Off: the card at once with its king already down. A tap at any beat goes to the card.
- Cost: S for the order; S-M for the crosses. Value: H. Simplifies: one topple, not two.

**H4 · One entrance and exit for all dialogs**
- Open: 200 ms fade and 12 px rise. Close: 140 ms. Phone sheets slide 240 ms. Fade the blur layer; never animate the blur.
- Cost: S (`dialog[open]` and `@starting-style`). Value: L-M.

### I. Settings and Workshop

- **I1 · The Animations setting shows itself:** a small pawn in the row steps at the chosen pace (440 ms, 220 ms, or a jump). Cost S. Value L-M. Simplifies.
- **I2 · The Workshop opens over the game:** the sheet slides up 240 ms and down to close. Cost S. Value L.
- **I3 · The Try it board moves** (`sandbox.ts` has no motion): the board's ripple (38 ms) and a 200 ms token slide. Cost S-M. Value M.

### J. Turn countdown (branch only)

**J1 · The countdown ring ticks** (83f442f: "no glow, no motion")
- Each own turn, the arc advances (300 ms) and the digit rolls.
- When the wait ends: a gold close (300 ms), a scale-out (300 ms), and one gold sweep across the button (500 ms) (P3).
- Off: today's still ring.
- Cost: S. Value: M. It changes the branch's "no motion" line (question 2).

## 4. Top 10

| Rank | ID | Name | Value | Cost | Simplifies or adds | Prototype |
|---|---|---|---|---|---|---|
| 1 | F3 | Frozen and walled pieces keep a mark | H | S-M | Adds missing state | P1 |
| 2 | H3 | Result: the board first, then the card | H | S | Simplifies | P5 |
| 3 | C1 | Hint plays its move as a ghost | H | S | Simplifies | P2 |
| 4 | E1 | Turn token and thinking ring | H | S | Simplifies | P3 |
| 5 | C2 | Check shows its cause, sound at contact | H | S | Adds a mark, removes a search | P2 |
| 6 | F1 | Arming spreads from the king | M-H | S | Adds | P1 |
| 7 | D1 | Taken piece reaches the tray at the hit | M | S | Fixes a spoiler | P4 |
| 8 | G1 | Guide move diagrams | H | M | Simplifies | P6 |
| 9 | G2 | Lesson coach marks | H | S-M | Simplifies | none |
| 10 | T3 | Last move plays when a game opens | H (link) | S | Simplifies | none |

Next: F2 (start with Freeze, Ice Wall and Sacrifice), B4, B5, B2, and J1 if the owner allows it. A first release could be F3, H3, C1, E1, C2, F1, D1 and T3. They touch only `marks.ts`, `PaintedView.ts`, `main.ts`, `style.css` and `index.html`, with no new frame loop.

## 5. Motion system

**Tokens** (all taken from timings the code already uses):
- `--dur-tap` 80 ms: press feedback (`style.css:172`).
- `--dur-quick` 160 ms: text swap, digit roll.
- `--dur-pop` 300 ms: pops and single pulses (`marks.ts:33` POP_MS).
- `--dur-move` 450 ms: travel (`gait.mjs` walk 440, glide up to 480).
- `--dur-peak` 650 ms: a king falls, a pawn promotes (`scene.mjs:39` FALL).
- One sequence lasts at most 900 ms. The result may last 2.6 s, and a tap skips it.

**Staggers:** 38 ms per square on the board (`marks.ts:34`); 45 ms per list item (`style.css:603`); 60 ms per square for a power wave, so the source reads.

**Easings:** `out` to arrive and settle; `inout` for travel; `pop` for marks appearing; `in` for a projectile hitting; `fall` for a king falling.

**Pace:** Fast ×0.5. Off and reduced motion show the end state. Put one helper in `src/render/` that wraps `el.animate()` with the pace and reduced-motion check and returns `finished` (`WORKSHOP-revision-3...md:1117`).

**Rules:**
1. Move only what changed, or what waits for a choice.
2. Start at the cause and end at the effect.
3. One focus at a time: play beats in sequence.
4. Every motion ends on a still frame that keeps the information. If a motion has no still meaning, cut it.
5. Never block input: a tap skips, and a new action cancels.
6. The same thing moves the same way everywhere: the vignette is a promise the board keeps, and the Guide uses the board's markers.
7. Loop only while the player decides.
8. Text and sound change at contact, not at launch; sound imports the picture's timing.
9. DOM: transform and opacity only, no animated blur. Canvas: decorate layers plus `keepAwake`. Measure anchors through the figure's transform (`art-and-motion.md:8-9`).
10. At most one 650 ms peak beat per move.

**How motion ties the dark title to the game:**
- **One light:** title gold is good news everywhere (hint, wait over, winner, lesson done). Red is danger; blue is powers.
- **One verb:** the title's `rise` is the entrance for the army, dialogs, the result card and the lesson stamp.
- **One floor:** T1 carries the title floor into the board.
- **One source of power:** the title kings' element effects start F1 and F2.
- **The night returns at the end:** the result's dim layer uses `--night` at about 40%.

## 6. Prototypes

Folder: `.../scratchpad/ux/motion/proto/`.
- Shared files: `kit.js` and `kit.css` (tokens, a seekable timeline, Replay, Normal/Fast/Off) and `icons.js` (five repo icons inlined).
- Art loads read-only by `file://` path from `public/ui/`.
- Each page passed headless Chromium with no page errors and no broken images. Frames come from `window.seek(ms)`, so they repeat exactly.

| ID | File | Shows | Strip / video |
|---|---|---|---|
| P1 | `p1-freeze.html` (4980 ms) | F1 wave, F2 bolt, F3 ice, badge, refused shake, thaw; F4 count | `p1-freeze-strip.png` (12 frames) / `.webm` |
| P2 | `p2-hint-check.html` (3500 ms) | C1 knight ghost; C2 check line, pulse, dashed rest | `p2-hint-check-strip.png` (11) / `.webm` |
| P3 | `p3-turn-token.html` (4520 ms) | E1 flip, thinking ring, red check; J1 tick, gold close, sweep | `p3-turn-token-strip.png` (11) / `.webm` |
| P4 | `p4-capture-tray.html` (1240 ms) | D1 icon to tray at the hit; D2 list glow | `p4-capture-tray-strip.png` (9) / `.webm` |
| P5 | `p5-result.html` (2860 ms) | H3 line, crosses, fall, glint, then the card | `p5-result-strip.png` (9) / `.webm` |
| P6 | `p6-guide-diagram.html` (6950 ms) | G1 Archer and Ogre diagrams, headings in sync | `p6-guide-diagram-strip.png` (12) / `.webm` |

- To make new frames: `node strip.mjs <name> <ms,...> .stage [--video] && python3 strip.py <name> <cols> <scale>`.
- Limits: the prototypes model canvas effects in DOM. P6's rook flash uses a CSS filter; the product should use opacity only. P2's knight arc is simpler than the real hop.
- Probes (read-only, localhost:5173): `probe/freeze.mjs`, `probe/check.mjs`.

## 7. Open questions for the owner

1. **B3:** may a faint from-square trail show for about 1 s and then fade? The still board keeps the 2026-10-04 rule.
2. **J1:** may the countdown ring tick and glint, although the branch says "no motion"?
3. **G1:** should the diagram replace the Round 2 portrait, sit under the text, or show when the portrait is tapped?
4. **H2:** may the choice dialogs open beside their square with no board blur?
5. **D3:** do you want a material number? King Down values differ from classic ones (Archer 505, Ogre 318; `docs/RULES.md:180`, `:195`).
6. **F2 order:** Freeze, Ice Wall and Sacrifice first?
7. **Sounds:** add sounds for power casts, promotion, a win and a lesson done (`sfx.ts:57-72` has none)?
8. **T1:** may the title dissolve into the board in place of today's cut?
9. **H3 draws:** what do the kings do: stand, bow, or nothing?
10. **E2:** should the board turn to the side to move in hot-seat games? Today it never turns there (`main.ts:946`).
