# Emergence, deeper notes (2026-09-24)

> Recovery status, 2026-09-24: Design inspiration, with mixed source types. These examples do not establish that adding interactions improves this game. Catalog and qualifications (`dd34fa5:docs/cursor-recovery/2026-09-24-0213b442/RESEARCH.md`) · Adoption record (`dd34fa5:docs/cursor-recovery/2026-09-24-0213b442/EXECUTED.md`).

Goes past `docs/research/emergence-2026-09-24.md`. New primary pages only. This does not change pieces or rules.

## The Battle of Polytopia — simple 4X, tribes, surprise and mess

Felix af Ekenstam (Midjiwan) built Polytopia by boiling a Civilization-style game down until it fit a phone: remove as much as possible and keep what still feels fun. He wanted the map to read like chess — “exactly like this moved there,” with clear tile edges — because detailed modern 4X art made it hard to see what was going on. Color and low-poly contrast exist so grass, fruit, and units separate at a glance. Source: GamingonPhone interview with Felix and Christian Lövstedt, 2024: https://gamingonphone.com/interviews/midjiwan-interview-delves-into-the-battle-of-polytopias-early-days-concept-stage-monetization-strategies/

Tribes: Felix did not give each tribe a pile of hardcoded special powers. Regular tribes share the same creatures and abilities; the surprise is a head start down one tech branch from the biome (coast already knows fishing; fruit land already knows foraging). Players praise that they can identify with a tribe. Special tribes (mythic species) are the ones with truly different tools. Same interview.

Christian Lövstedt (CEO) wrote Midjiwan’s design stance: keep the surface simple, let depth show up as people play; art should carry information so you do not need a wall of text. Felix’s seven principles include “Informative Art Design” and “Elimination of Redundancy.” Source: https://mobidictum.com/christian-lovstedt-midjiwan-polytopia-minimalism/

What people call messy: a Steam/PC review says late maps become “one giant visual mess” — units and buildings pile up on a small board, you cannot rotate freely, zoom is limited, and you can miss a unit’s turn amid the clutter. The same review likes the bite-sized pace and cute tribes, then complains combat and building flatten into spam. Source: TheGamer review, Jamie Latour, 2021: https://www.thegamer.com/battle-of-polytopia-review/

Praise vs complaint in one line: players and Midjiwan praise readable minimalism and tribe identity; critics say the same crowded map stops being readable.

## Bad North — tiny rules, readable failure

Plausible Concept (Oskar Stålberg, Richard Meredith, Martin Kvale) told Nintendo UK that Bad North hides the combat sim: you mostly place squads on a grid; soldiers decide when to swing. The art rule is readability — no explicit stats sheet, so every clash must be visible and understandable. Grid tiles make “this tile vs the next” a clear prediction. Sound backs the eye: you should hear swords and arrows and still know the fight with eyes closed.

Failure is the lesson: you rarely clear the campaign first try; you restart with more knowledge. The team cut action count and UI weight so people who like the *idea* of strategy can play without learning a binder of abstract systems first. Depth comes from watching battles fail and succeed. Source (opened): https://www.nintendo.com/en-gb/News/2018/April/Interview-Taking-on-hordes-of-invading-Vikings-in-Bad-North-1368315.html

## Chess UI that telegraphs — Chess.com and Lichess

**Chess.com legal-move dots.** Help Center: dots appear when you select a piece and show every legal destination. On by default for new accounts; toggle under Settings → Gameplay → Show Legal Moves (mobile: More → Settings → Board). Source (opened): https://support.chess.com/en/articles/8708625-how-do-i-turn-on-off-the-legal-moves-dots-on-the-board

**Chess.com arrows and square marks.** Help Center: right-click-drag draws an arrow; right-click a square highlights it (colors via modifiers). Left-click clears. Opponent does not see your marks. Source (opened): https://support.chess.com/en/articles/8568781-how-can-i-draw-arrows-on-the-board-like-streamers-do

**Chess.com last-move highlight.** Live Chess board settings include “Highlight Move”: when on, the squares of the move just played light up. Same settings panel also repeats Show Legal Moves. Source: https://support.chess.com/en/articles/8614003-how-do-i-manage-my-live-chess-settings

**Lichess board telegraphs.** Official preference strings name the features: “Board highlights (last move and check)” and “Piece destinations (valid moves and premoves),” plus “Snap arrows to valid moves” and analysis “Show best move arrows.” Source: Lichess translation source `preferences.xml` in lila: https://raw.githubusercontent.com/lichess-org/lila/master/translation/source/preferences.xml — settings live at https://lichess.org/account/preferences/game-display and https://lichess.org/account/preferences/game-behavior

Forum confirmation (opened): staff/players point “helper dots” to Game display → Piece destinations: https://lichess.org/forum/general-chess-discussion/why-are-there-green-helper-dots-during-rated-games

## Jonathan Blow — good difficulty vs bad difficulty

In a MonsterVine interview about *Order of the Sinking Star*, Blow states the cut he and the team refined: **good difficulty** means you are thinking hard about things that are directly relevant to the level’s idea; **bad difficulty** is when the idea is hard to see in the first place, or you do tiring generic work (scrambling objects, solving an invisible maze in your head) that is not special to that idea. They cut bad difficulty and keep good difficulty. Messy levels with too many objects get hammered until the cool idea is clear. Source (opened): https://monstervine.com/2026/05/order-of-the-sinking-star-jonathan-blow/

(Blow on Stephen’s Sausage Roll, for adjacent puzzle feel: surprises “aren’t contrived, they spring naturally from the game as it has already been set up” — Polygon, 2016: https://www.polygon.com/2016/4/18/11450516/stephens-sausage-roll-preview-jonathan-blow-bennett-foddy/ — secondary to the good/bad difficulty page above.)

## Five things a chess-like board game should do in the interface

No new pieces. No new rules. Each line ties to a source above.

1. Make the board read like a clear chess diagram — every tile edge and “this moved there” obvious — so density never becomes Polytopia’s “visual mess” (Felix / TheGamer).
2. Prefer art and motion that show what happened over a wall of stats or tutorial text (Midjiwan “Informative Art Design”; Bad North hidden sim).
3. After a loss or a bad stand, the player should see why it failed without opening a manual — restart with knowledge, like Bad North’s readable failure loop.
4. Always mark the last move’s squares, and when a piece is selected show legal destinations as dots (Chess.com and Lichess board highlights / piece destinations).
5. Cut “busywork” UI and clutter that hides the idea you want the player to think about; keep difficulty that is about the real board idea (Blow’s good vs bad difficulty).
