# Research: digital card battlers and arena games

Track: card battlers and arena games, for the King Down redesign showcase ([brief](../BRIEF.md)). Date: 2026-10-08.

Games: Marvel Snap, Hearthstone, Legends of Runeterra (LoR), Clash Royale, Gwent, Pokémon TCG Pocket (Pocket), Balatro, Slay the Spire (StS) and Inscryption.

Method: web search and direct reads of the pages. Some pages refused a direct read (HTTP 403). A finding marked **[s]** comes from the search summary of the linked page, not from a direct read. Treat it as less certain.

## Findings

### Board readability

**F1. Fewer rows, bigger art.** Gwent had eight rows on screen (four for each side, hands included). The team said the rows did little for play and made the card art too small to shine. Homecoming (2018) cut the board to two rows for each side **[s]**.
Sources: [Engadget](https://www.engadget.com/2018/04/14/gwent-card-game-overhaul/), [TechRaptor](https://techraptor.net/content/gwent-homecoming-preview).

**F2. One hand, one main action.** Clash Royale puts the menu, the cards and the chests in the lower half of a phone, in reach of one thumb. One colour (yellow) marks the main action. A pop-up blurs the screen behind it, so the eye goes to the one thing to do. Menus are rarely more than one level deep. The shop shows at most six items.
Source: [The Rookies, Clash Royale UX breakdown](https://www.therookies.co/blog/game-design-ux-best-practices-detailed-breakdown-of-clash-royale/).

**F3. Eight words.** Ben Brode (Second Dinner): if a screen has more than eight words, players do not read them. Marvel Snap averaged 11 words a screen, Hearthstone 9.
Source: [mobilegamer.biz, Brode on Marvel Snap](https://mobilegamer.biz/second-dinners-ben-brode-reveals-marvel-snaps-recipe-for-success-literally/).

**F4. Show the enemy's plan.** In StS each enemy shows its next action as an icon over its head: attack (with the damage and the number of hits), block, buff or debuff. Reviewers call this the game's central idea: you decide with facts, not guesses. StS 2 puts two intents side by side, not on top of each other **[s]**.
Sources: [LessWrong review](https://www.lesswrong.com/posts/MEimkSwwuRgiPaZaY/review-slay-the-spire), [Untapped, enemy intent](https://sts2.untapped.gg/guides/how-to-read-enemy-intent) [s].

**F5. Icons as metaphors, text on demand.** Inscryption's cards carry sigils, not text. Daniel Mullins found that symbols with numbers and arrows "quickly get muddled", so each sigil is one clear picture. A click on a sigil opens its page in an in-game rulebook.
Source: [Thumbsticks, Mullins interview](https://www.thumbsticks.com/magic-myst-pokemon-inspire-inscryption/).

**F6. Who acts next is a place, not a sentence.** LoR has an attack token that changes sides each round. Marvel Snap puts a glowing border on the name of the player who reveals first. The cube at the top centre shows the stakes now and the stakes at the end.
Sources: [Inven Global, the LoR board](https://www.invenglobal.com/articles/10266/the-legends-of-runeterra-board-explained), [Out of Games, how to play Snap](https://outof.games/realms/marvel-snap/guides/255-how-to-play-marvel-snap/), [PCGamesN, who reveals first](https://www.pcgamesn.com/marvel-snap/who-reveals-first).

**F7. A short, coded history.** Hearthstone's History tray sits on the left of the board. It holds the last 7 to 10 actions as small tiles, newest on top. A blue border marks your actions, a red border the opponent's. A hover shows the details.
Source: [Hearthstone Wiki, History](https://hearthstone.wiki.gg/wiki/History).

### Inspect and preview

**F8. Inspect on demand.** In LoR you right-click a card, then point at a keyword for its meaning. A card with one keyword shows its name; a card with many shows only small icons.
Source: [Dot Esports, LoR keywords](https://dotesports.com/lor/news/legends-of-runeterra-effect-keywords-and-mechanics-explained) [s].

**F9. See the result before you commit.** LoR's Oracle's Eye is an orb between the two Nexuses. It opens when an action can be predicted and shows the board after the action and its triggers. It never shows hidden information: unrevealed cards stay backs, and random results stay hidden.
Source: [League Wiki, Oracle's Eye](https://wiki.leagueoflegends.com/en-us/LoR:Oracle%27s_Eye).

**F10. Name the move while the player chooses.** In Balatro, when you select cards, the name of the poker hand shows over the score before you play it. A "Run Info" page lists every hand and its level.
Source: [Balatro Wiki, Poker Hands](https://balatrowiki.org/w/Poker_Hands).

**F11. Hold to step into the art.** A Pocket "immersive card" fills the screen when you hold it: the art becomes a short animated scene with music. It changes no rule; it changes the feel of owning the card **[s]**.
Sources: [Bulbapedia, immersive card](https://bulbapedia.bulbagarden.net/wiki/Immersive_card_(TCG_Pocket)), [pocketcards.net](https://pocketcards.net/blog/immersive-cards-3d-art-pokemon-tcg-pocket).

**F12. Hidden gestures fail.** A design critique of Pocket finds that you can flip and swipe packs, and move cards to see effects, but nothing on screen says so. Type advantage also leaves the screen too fast; the critic wants it to stay in view.
Source: [Pratt IxD, Pocket critique](https://ixd.prattsi.org/2025/09/design-critique-pokemon-tcg-pocket-android-app/).

**F13. Show what you can play.** Hearthstone gives visual cues on the cards you can play. When you have done every possible action, the End Turn button lights up, often with the line "Job's done".
Sources: [Wikipedia, Hearthstone](https://en.wikipedia.org/wiki/Hearthstone), [Hearthstone Wiki, Turn](https://hearthstone.wiki.gg/wiki/Turn).

### The reveal and the turn

**F14. Short games, staged reveals.** A Marvel Snap game has 6 turns and lasts under five minutes (Brode took the short length from Clash Royale). Both players play at the same time; the cards reveal together. The three locations reveal one a turn: the left one at the start, the middle one on turn 2, the right one on turn 3 **[s]**. Brode took the simultaneous reveal from board games and the Snap from backgammon's doubling cube; the team tried nine versions of it.
Sources: [Deconstructor of Fun](https://www.deconstructoroffun.com/blog/2023/5/23/marvel-snap-the-definitive-deconstruction), [mobilegamer.biz, Brode](https://mobilegamer.biz/second-dinners-ben-brode-reveals-marvel-snaps-recipe-for-success-literally/), [TheGamer, locations](https://www.thegamer.com/marvel-snap-complete-locations-guide/).

**F15. A kind word for a loss.** When a Snap player retreats, the screen said "You Lose!". Second Dinner changed it to "Escaped!", so a smart retreat feels like a small win.
Source: [mobilegamer.biz, Brode](https://mobilegamer.biz/second-dinners-ben-brode-reveals-marvel-snaps-recipe-for-success-literally/).

**F16. A timer that shows only at the end.** A Hearthstone turn lasts at most 75 seconds. The timer is invisible until about 20 seconds remain; then a burning rope crosses the board to the End Turn button. Players also use the full rope to annoy and to push the opponent to concede.
Sources: [Hearthstone Wiki, Turn](https://hearthstone.wiki.gg/wiki/Turn), [Out of Games, roping](https://outof.games/realms/hearthstone/guides/553-hearthstone-why-do-people-rope-explained/).

**F17. Presence without secrets.** When a Hearthstone player aims a card, the opponent sees the red arrow move. The opponent sees where the card sits in the hand, but not which card it is, until the play locks in.
Source: [Hearthstone Wiki, Targeted](https://hearthstone.wiki.gg/wiki/Targeted).

### Juice: feedback, sound, impact

**F18. Weight in the hand.** Hearthstone's team wanted every action to feel tactile. Cards waver in the hand and slam down on the board. A minion with 6 or 7 attack shakes the screen a little, 8 or more shakes it harder with dust, and a hero's death shakes it most **[s]**.
Sources: [Wikipedia, Hearthstone](https://en.wikipedia.org/wiki/Hearthstone), [TV Tropes, Hearthstone S–Z](https://www.tvtropes.org/pmwiki/pmwiki.php/HearthstoneHeroesOfWarcraft/TropesSToZ) [s].

**F19. Layered feedback that shows the cause.** An analysis of Balatro: the feedback is the product; without it the game is a calculator. Five channels stack on a score: the card moves, the counter rolls, the screen reacts, particles burst, and each scored card plays a higher note. The Jokers fire one at a time, left to right, so the player sees which one did what.
Source: [Blake Crosley, Balatro design guide](https://blakecrosley.com/guides/design/balatro) (an outside analysis; its timings are estimates).

**F20. The player sets the pace.** Balatro has a game speed setting up to 4. Many players pick 2; some ask for a step between 2 and 4.
Source: [Steam discussion, Balatro speed](https://steamcommunity.com/app/2379780/discussions/0/6426156954538745672) [s].

**F21. Feel over precision.** LocalThunk compares balance to hanging a picture: if it feels level, that is better than technically level but feeling askew.
Source: [Rogueliker, LocalThunk interview](https://rogueliker.com/balatro-interview/).

**F22. One object carries the score.** Inscryption keeps damage on a weighing scale, with teeth as weights. The first side five teeth down loses. Near a loss, the scale strains and its clinks rise in pitch.
Sources: [Wikipedia, Inscryption](https://en.wikipedia.org/wiki/Inscryption), [Mechanics of Magic](https://mechanicsofmagic.com/?p=26987).

**F23. A transformation moment.** When a LoR champion meets its condition, it levels up: the card and all its copies change at once, with an animation.
Source: [League Wiki, Champion](https://wiki.leagueoflegends.com/en-us/LoR:Champion).

### First-game onboarding

**F24. Tailor the first days.** Marvel Snap shapes the first 1 to 4 days (about 4 hours). New players meet bots first, with set outcomes. The Snap button stays off for the first 10 to 20 games; then a scripted game against the computer teaches it.
Sources: [Deconstructor of Fun](https://www.deconstructoroffun.com/blog/2023/5/23/marvel-snap-the-definitive-deconstruction), [Marvel Snap Zone, beginners](https://marvelsnapzone.com/how-to-play-marvel-snap-for-beginners/).

**F25. Fix the first turn by design, not by a feature.** New Snap players had no card to play on turn 1. The team did not add a mulligan; it made Quicksilver always start in the opening hand. The unlock order teaches combinations: three "On Reveal" cards come before Odin, who triggers them again.
Source: [mobilegamer.biz, Snap onboarding](https://mobilegamer.biz/second-dinner-reveals-the-secrets-of-marvel-snaps-onboarding-and-card-design/).

**F26. Suggest, never force.** Clash Royale's Training Camp starts in the arena at once. The King asks the player to place a Knight, but any card works. The first three tutorial battles have faster Elixir and no time limit **[s]**.
Sources: [Clash Royale Wiki, Training Camp](https://clashroyale.fandom.com/zh/wiki/%E8%AE%AD%E7%BB%83%E8%90%A5) [s], [The Rookies](https://www.therookies.co/blog/game-design-ux-best-practices-detailed-breakdown-of-clash-royale/).

**F27. Earn the modes by playing, not by winning.** Hearthstone's tutorial is three fights and can be skipped. The Apprentice Track then gives about 100 XP for every game, win or lose, and the other modes are rewards on it. Its loading screens show tips **[s]**. Its team admits a problem when new players meet veterans with big collections.
Sources: [Hearthstone Wiki, New player experience](https://hearthstone.wiki.gg/wiki/New_player_experience) [s], [PCGamesN](https://www.pcgamesn.com/hearthstone-heroes-of-warcraft/heartstone-team-know-there-s-work-to-be-done-making-new-players-comfortable).

**F28. A gentle hand after a bad start.** If an StS run ends before the Act 1 boss, Neow offers two simple blessings next time, for example the first three fights at one health. A run that reached the boss gets four richer choices.
Source: [Slay the Spire Wiki, Neow](https://slaythespire.wiki.gg/wiki/Neow).

### Home hub and menus

**F29. The core first, the rest in one door.** As Hearthstone added modes, players called its menus buried and confusing **[s]**. Blizzard renamed "Play" to "Hearthstone", put the big modes on the main menu and moved the rest into one "Modes" door. Its UI designer also says the UI is the whole game, because there is no world to walk in: every object in the box has its place **[s]**.
Sources: [Out of Games, main menu overhaul](https://outof.games/news/3578-hearthstones-main-menu-gets-an-overhaul-play-is-now-hearthstone-battlegrounds-out-of-beta-mercenaries-joins-the-fun/), [GDC Vault, Sakamoto 2015](https://gdcvault.com/play/1022036/Hearthstone-How-to-Create-an), [Mein-MMO](https://mein-mmo.de/en/hearthstone-weg-zum-megahit063,32034/).

**F30. News without interruption.** Marvel Snap scrolls its news across the home background. It does not block the Play button.
Source: [Deconstructor of Fun](https://www.deconstructoroffun.com/blog/2023/5/23/marvel-snap-the-definitive-deconstruction).

**F31. Toys for the wait.** Each Hearthstone board has corner objects to click: a catapult, a gryphon that turns its head. They change nothing in the game and only you see them. They fill the opponent's turn.
Sources: [Out of Games, board interactions](https://outof.games/hearthstone/341-hearthstone-hypothesis-why-do-the-game-board-interactions-exist), [Wikipedia, Hearthstone](https://en.wikipedia.org/wiki/Hearthstone).

### Collection and progression

**F32. No packs, cosmetic upgrades.** Marvel Snap has no card packs. Upgrades change only the look of a card; each upgrade raises the Collection Level, which gives new cards along a road.
Source: [Deconstructor of Fun](https://www.deconstructoroffun.com/blog/2023/5/23/marvel-snap-the-definitive-deconstruction).

**F33. Choose your path.** Gwent's Reward Book is a set of trees. The player spends reward points and picks which node to open next.
Source: [KeenGamer, Gwent guide](https://www.keengamer.com/articles/guides/beginners-guide-to-gwent-the-witcher-card-game/).

**F34. Three states of a locked thing.** Balatro's collection shows a locked Joker with a padlock, and a hover gives the goal that unlocks it. An unlocked Joker that you have not found yet shows as "?".
Source: [Steam discussion, Balatro collection](https://steamcommunity.com/app/2379780/discussions/0/4364626348107687715) [s].

**F35. Small, fast unlock steps.** StS adds 3 or 4 cards or relics to the pool at each level of a character, about every 2 to 3 runs, win or lose.
Source: [Steam discussion, StS unlocks](https://steamcommunity.com/app/646570/discussions/0/1742232339944759355) [s].

**F36. Show the threat ahead.** At the start of each StS act the map shows the act's boss, so the player can plan for it.
Source: [LessWrong review](https://www.lesswrong.com/posts/MEimkSwwuRgiPaZaY/review-slay-the-spire).

**F37. Ritual where it is rare.** Pocket slows the pack opening on purpose: you swipe to tear the pack, then pull out the cards one by one. A critic calls it deliberate friction that gives emotional weight **[s]**.
Sources: [Pratt IxD](https://ixd.prattsi.org/2025/09/design-critique-pokemon-tcg-pocket-android-app/), [Inverse](https://inverse.com/gaming/pokemon-tcg-pocket-collecting-cards).

### Emotes and social signals

**F38. Few emotes, none to mock.** Hearthstone has six emotes: Greetings, Well Played, Thanks, Wow, Oops, Threaten. A "Lucky" emote left in alpha because players spammed it at every good play. The team recorded "Good game" but did not ship it, for fear of early "gg". Squelch hides an opponent's emotes, and the opponent never learns it.
Source: [Hearthstone Wiki, Emote](https://hearthstone.wiki.gg/wiki/Emote).

**F39. Emotes carry emotion, so give a mute.** Supercell first refused to mute Clash Royale emotes, because strong emotions are core to the game. The crying and laughing King emotes became taunts, and a later update added a mute **[s]**.
Sources: [TouchArcade, June 2016](https://toucharcade.com/2016/06/14/supercell-doubles-down-on-never-muting-emotes-in-clash-royale) [s], [TouchArcade, September 2016](https://toucharcade.com/2016/09/19/clash-royale-update-adds-emote-mutenew-tournaments-cards-and-more/) [s].

**F40. Social without contact.** Pocket's Wonder Pick lets you take one random card from a pack that another player opened. Marvel Snap deck codes copy a deck from a website in one paste.
Sources: [Wikipedia, Pocket](https://en.wikipedia.org/wiki/Pok%C3%A9mon_Trading_Card_Game_Pocket), [Deconstructor of Fun](https://www.deconstructoroffun.com/blog/2023/5/23/marvel-snap-the-definitive-deconstruction).

### Matchmaking and waiting

**F41. The wait teaches.** Hearthstone shows tips on its "Finding opponent" and "Starting game" screens **[s]**.
Source: [Hearthstone Wiki, New player experience](https://hearthstone.wiki.gg/wiki/New_player_experience) [s].

**F42. A dropped line is not a loss.** Clash Royale lets a player rejoin after a disconnect and hides the opponent's disconnect, so nobody can exploit it. Pocket keeps a battle alive when the app closes and asks for two confirmations before a concede.
Sources: [The Rookies](https://www.therookies.co/blog/game-design-ux-best-practices-detailed-breakdown-of-clash-royale/), [Pratt IxD](https://ixd.prattsi.org/2025/09/design-critique-pokemon-tcg-pocket-android-app/).

### What they do badly

**F43. Timers and gates.** Supercell first let some Clash Royale chests open at once. Reports say the timers made players wait to enjoy a win and open the app many times a day; the March 2025 update removed the timers and slots, and rewards now drop after each battle **[s]**.
Sources: [Supercell, chest experiment](https://supercell.com/en/games/clashroyale/blog/news/chest-experiment-king-tower-levels-1-9), [EGW News](https://egw.news/gaming/news/26988/clash-royale-march-2025-update-brings-major-change-zXrplBuv1) [s].

**F44. FOMO and no agency.** Marvel Snap critics point to time-limited offers and a monthly pass. Second Dinner itself named an "overall lack of agency" in getting new cards and random caches that feel bad **[s]**.
Sources: [GINX](https://www.ginx.tv/en/dev-address-lack-of-agency-card-acquisition-january-2025-patch-update) [s], [snap.fan](https://snap.fan/news/is-marvel-snap-too-aggressive-with-monetization/) [s].

**F45. Friction that feels like a toll.** Pocket's trading needs tokens, a refilling stamina and equal rarity. Players called it predatory and cancelled the paid pass; the developers promised changes **[s]**. Packs refill every 12 hours.
Sources: [VGC](https://www.videogameschronicle.com/news/pokemon-tcg-pockets-trading-feature-is-changing-after-fan-backlash) [s], [Wikipedia, Pocket](https://en.wikipedia.org/wiki/Pok%C3%A9mon_Trading_Card_Game_Pocket).

**F46. Noise.** Emote spam (F38, F39), rope stalling (F16), menus that grow with each mode (F29) and too many rows (F1).

## What the best of them share

1. **One focus at a time.** One main action, one moving thing, one reveal (F2, F14, F19).
2. **Information is visible and fair.** Show the opponent's threat and the result of your own choice; never show what is hidden (F4, F9, F17).
3. **Depth folds; it does not vanish.** Icons at rest, text on a hold or a hover (F5, F8, F11).
4. **Impact scales with consequence.** Small moves are quiet; big moments are loud and rare (F18, F23, F37).
5. **Features unfold with play.** The new player gets one thing, then the next (F24, F25, F27).
6. **Kind framing.** Losses, retreats and drops do not punish (F15, F28, F42).

## For King Down

Three rules for every move below:
- **Eight words.** A message during a game has eight words or fewer. A longer rule goes on the piece card or in the Guide (F3).
- **Skip and pace.** A tap skips any motion. Extras has one Pace setting: Calm, Brisk (default) and Instant (F20). With reduced motion, each moment below shows its end frame at once.
- **No toll.** No timer on a reward, no time-limited offer, no "Lucky", no lock that only money opens (F43–F45).

**K1. Hold to read any piece.** Borrows: StS intents (F4), LoR inspect (F8), Inscryption's sigil-to-rulebook (F5).
- What: a long press on any piece, yours or the enemy's, marks every square it attacks with a small cross. A card slides in at the board edge: the painted figure, the name and one line ("Archer: shoots without moving."). The Guard shows a small shield mark, so "only a king can take it" is a picture too.
- When: a hold of 250 ms on touch, a 400 ms hover with a mouse, or Space on a focused square.
- How long: the crosses fade in over 150 ms, stay while the finger stays, and fade out over 120 ms.
- Why: the reach of the six new pieces is the biggest unknown in King Down. It also fixes D-10 (a tap on an enemy piece gives a refusal). Future: the same hold reads a power card and a friend's Workshop piece.

**K2. Marks for moves that do more than move.** Borrows: Oracle's Eye (F9), Balatro's hand name (F10).
- What: when you select a piece, a target square where more happens than a move gets a small mark in place of the dot: an arrow for an Ogre push, two arrows for a Maester swap, a link for a Beast bite that can chain on. With a mouse, a hover on that square shows a faint ghost of the result (the pushed piece on its new square).
- When: at selection. How long: the ghost fades in over 120 ms; there is no extra tap.
- Why: the result shows before the commit, so the rules teach themselves. Like the Eye, it never shows the computer's answer.

**K3. The power reveal.** Borrows: Marvel Snap's reveal (F14), the LoR level-up (F23).
- What: when a king uses a power, its emblem on the player strip turns over to the power face (200 ms). The status line names it ("Frost king: Freeze"). Then the board plays the effect from the king to the target. One pip on the emblem goes dark.
- When: the full beat (at most 900 ms) on the first use of each power in a game; 400 ms after that.
- Always-on powers (Holy Light, Mercy, Death Touch, Darkness, March) do not reveal. The first time one of them changes a move, its area shows for 600 ms with one line: "Holy Light shelters this piece."
- Future: a played card uses the same beat. It lies face down, then turns over at the moment of its effect.

**K4. A turn token.** Borrows: the LoR attack token and the Snap priority glow (F6).
- What: a small token with the king's emblem sits on the strip of the side to move. At the turn change it slides to the other strip (240 ms). While the computer thinks, a thin ring fills around it.
- Why: the turn becomes a place, not only the words "Your move". It replaces a line that moves the layout.

**K5. A move tray, not a move list.** Borrows: the Hearthstone History tray (F7).
- What: one row holds the last six events as piece icons. Your events have a filled ring and the opponent's an open ring (a shape, not only a colour). Special events add one small mark: a bite, a push, a swap, a freeze. A tap or hover gives one sentence: "Their Ogre pushes your pawn."
- When: a new event slides in from the right in 200 ms. The full story stays folded behind the row (the screens spec, "The moves").

**K6. The first game in one tap.** Borrows: Snap's first match and Quicksilver (F24, F25), the Clash Royale Training Camp (F26).
- What: on the first visit, the main title door says "Play your first game". One tap opens a board against Beginner (pick W1). For this game only, the army draw always gives the player an Archer and a Beast (the planned starter pieces, docs/PROGRESSION.md). This is a draw rule for one game; it needs the owner's yes. One coach line, "Your Archer shoots without moving. Try it.", and the Archer pulses twice, then stops.
- The player may play any move; the line leaves after the first move. Lessons stay one tap away.
- Why: a first game, not a menu, is the first memory. The guaranteed pieces fix the first turn by design.

**K7. Features unfold; they never lock.** Borrows: the Snap button that appears after 10 to 20 games (F24), Hearthstone's track that rewards play, not wins (F27).
- What: in New game, Kings' powers shows as one sealed row: six king emblems in shadow and the text "Opens after 3 games · Open now".
- After the third game (any result), the row opens with one 400 ms light sweep. The result card offers "Your king has a power now. Try Freeze." That game is against Beginner; the computer's king has a power too and uses it early, so the player sees one.
- "Open now" always works. Card mode, online play and Workshop sharing unfold in the same way, one at a time.

**K8. The piece shelf: yours, met, locked.** Borrows: the three Balatro states (F34), the StS boss shown in advance (F36).
- What: the Guide shows the six new pieces in three states. Yours: full paint. Met (you played against it, for example in the daily game, if the daily draws from the full pool as PROGRESSION decision 4 recommends): full paint with a small "?" and "Met in today's game". Locked: the real figure in silhouette with its goal ("2 more wins at Casual").
- No timer, no buy button. The silhouette is a CSS filter on the real art, not new art.

**K9. The wake: one ritual for each unlock.** Borrows: Pocket's pack tear (F37), the LoR level-up (F23).
- What: when the crowns reach the next piece (2, 5 and 9 wins in the proposal), the result card ends with its silhouette. The player taps or drags it up. The paint fills from the base to the head in 600 ms, with one chime. Then two buttons: "Try it · 1 min" (the planned short lesson) and "Later".
- Why: this happens four times in a player's life. Here the slow ritual earns its time; everywhere else the motion stays at 120 to 400 ms.

**K10. Impact by consequence.** Borrows: Hearthstone's slam and shake tiers (F18), Balatro's layered channels and rising notes (F19), Inscryption's sound of strain (F22).
- A move: the piece settles in 120 ms with a soft stone tap.
- A capture: the taken figure tips over and flies to the captured row at the moment of contact (220 ms), with a deeper tap.
- A Beast chain: each bite plays one step higher in pitch, and the status line counts ("Beast bites ×3").
- Check: the line from the checking piece and one low note.
- The king falls: the only board shake in the game, 3 px for 200 ms, then the topple.
- With reduced motion there is no shake and no flight; the sound stays, unless it is off.

**K11. Lay your king down.** Borrows: Snap's "Escaped!" (F15), Pocket's two-step concede (F42), StS's gentle Neow (F28).
- What: Resign lives in the Menu. Its question shows your king figure and asks "Lay your king down?". On yes, your own king topples (the toppling king of today) and the result says "You laid your king down." The name of the game becomes the gesture.
- After two losses in a row against the computer, the result adds one quiet choice: "Next game: hints ready". It never comes on by itself and never mentions a streak.

**K12. Four words to the opponent.** Borrows: Hearthstone's six emotes, the lost "Lucky" and the invisible Squelch (F38), the Clash Royale mute (F39).
- What (online and link games): a tap on your own king figure opens four lines: Hello, Well played, Wow, Oops. The line shows as a bubble by your strip for 1.6 s.
- At most one line every 4 s, and five in a game. A mute sits on the opponent's strip; the opponent never learns of it.
- No chat, no taunt, no "gg" before the end. Against the computer, the computer's king says "Well played" once, only when you win.

**K13. The waiting table.** Borrows: Hearthstone's tips while it finds an opponent (F41), Clash Royale's rejoin (F42).
- What: while a friend opens your link (later, while online play finds a match), the two kings face each other: the real king art, one on each side. Below them is one true fact from docs/RULES.md: "Did you know? An Ogre can push a Guard." Cancel is always in view.
- A match found in under 1.5 s skips this screen. If a player drops, the board holds and says "Waiting for Sam to come back". Nobody loses by the drop alone.

**K14. Card mode: the deal and the hand.** Borrows: Hearthstone's cues on playable cards and its arrow without the card's name (F13, F17), Balatro's triggers in order (F19), Snap's staged reveal (F14).
- What: the deal of six cards fans in face down and turns over left to right, 80 ms apart (under 700 ms in all).
- A card you can play now sits 4 px higher with a crisp edge. A card you cannot play lies flat with a small lock mark; a hold gives the reason (for Salvation: "No captured piece can return").
- Online, the opponent sees which card slot you lift, but not the card, until you play it.
- When it is not your turn, the hand folds into one stack of card backs with a count, so the board stays clear.

**K15. A toy for the wait.** Borrows: Hearthstone's board corners (F31).
- What: while the computer thinks, a tap on a figure in the captured row makes it wobble and say its name once ("Maester").
- Nothing marks this on screen. It teaches the names in dead time and changes nothing in the game.
