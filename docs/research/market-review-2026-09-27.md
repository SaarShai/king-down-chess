# King Down Chess — review, market research and ten suggestions (2026-09-27)

Owner request: review everything done for the game, research similar chess games and platforms (especially successful indie ones), and give ten suggestions.

## 1. Where the game stands

**Strong**
- **Rules with evidence behind them.** Random Chess960-style armies from the King Down cast (Archer, Guard, Maester, Beast, Ogre; Paladin in custom setups). Every default was measured in the balance lab (hundreds of thousands of computer games): 87% of games are decisive when played out, and piece values are fitted.
- **A real opponent.** A tuned search with a learned evaluation, four skill levels, Hint, Undo, and move explanations ("The archer shot without moving").
- **Distinct look.** Painted storybook figures from the original King Down art; every capturing piece has its own capture animation; a stone board inspired by the original capital tiles; new synthesized sounds timed to the hits.
- **Clean, simple UI** (simplified today): New game · Guide · Settings, Hint · Undo · Resign, moves, captures; works on a phone.
- **Shareable setups** (8-letter army codes, FEN links), autosave, open-source repo.

**Missing** (compared with the games below)
- The current game is **not publicly deployed**: the public link is an older prototype; the new version is only in the repo.
- **No way to play someone who is not in the room** (only computer or pass-and-play).
- **No teaching path** for the six new pieces beyond a rules table and hover text.
- **Nothing that brings a player back**: no daily board, puzzles, progression, or post-game review.
- **The King Down identity is only half used**: kings' powers are built and measured but off; cards are unbuilt.
- **Animations cannot be sped up or skipped.**

## 2. What the research found

| Game / platform | What it does well | What players miss or criticize | Why it succeeded (or not) |
|---|---|---|---|
| **Really Bad Chess** (Zach Gage, 2016) | Random pieces, but a generator balances boards to a target difficulty; ranked climb from rank 15 (you get the stronger army) to 100 (the computer does); daily board (one try) and weekly board, same for everyone. | — | Made chess fun for people who never enjoyed it: no openings to study. Randomness *balanced*, not raw. |
| **5D Chess With Multiverse Time Travel** (2020) | One wild, memorable idea; puzzles, four AI personalities, variants, online and local play; ~96% positive on Steam. | Hard to learn. | Went viral as a meme on YouTube and TikTok: watching people struggle is entertaining. |
| **Gambonanza** (2025) | Chess roguelike, tiny board, capture-everything goal, crumbling board; 200,000+ units in two weeks for a solo developer. | Critics mixed (Metacritic 64). | Rides the chess-roguelike wave; short runs and progression. |
| **Pawnbarian** | 5×5 chess-move roguelike, 15–30 min runs, clean UI, endless mode; ~91% positive. | — | "Just the basics" of chess needed; every threat is readable. |
| **Shotgun King** | Strong hook, short runs, lo-fi charm. | Steep learning curve, difficulty spikes, randomness that undercuts tactics, repetition. | Hook sold it; the criticism is about onboarding and fairness. |
| **Chess 2: The Sequel** (Sirlin) | Six asymmetric armies; aimed to reduce draws and memorization. | Few players; snowballing leads. | Launched on Ouya: no audience. Good design did not overcome poor reach. |
| **Battle Chess** (and remakes) | Animated capture fights, the classic "chess with character". | Animations become slow and tedious; players ask to skip them or play fast. | Presentation sold it; speed options kept it playable. |
| **Knightmare Chess** (cards) | One rule-bending card per turn, point-costed decks, great art; praised for variety. | Some players miss predictability. | Proof that chess plus cards works for a fantasy audience — the King Down tabletop's own design space. |
| **Chess.com** | Named bots with personalities (Martin, Mittens) became memes; monthly themed bots (cat bots: 120M games); Puzzle Rush (+58% revenue per user); Game Review redesign (+25% usage). | Paywalls. | Personality, daily habits, learning tools, creators. |
| **Lichess** | Everything free, no ads; puzzles, Puzzle Storm, free analysis, studies; 5M+ games a day. | — | Free and complete; community trust. |
| **Onitama (digital)** | Five-minute games, random setup, quick tutorial, AI + pass-and-play + online. | — | Short, clear, taught in minutes. |
| **ChessCraft** | Custom-variant sandbox; 280,000+ community uploads. | Bugs. | Creativity and sharing. |
| **Browser portals** (CrazyGames, Poki) | Large chess audiences; multiplayer chess is a top board category. | — | Zero-install reach. |
| **Board Game Arena** | 11M+ registered users, 1,000+ games. | — | Where tabletop fans play board games online. |
| **Chess.com variants** | 4-Player Chess is the most popular variant; Duck Chess spiked in 2023. | — | Social, novel, easy to find a game. |

**King Down's own audience:** the 2014 Kickstarter had **2,299 backers pledging $205,958**. Previews praised the art and sculpts and called it modern chess. Their main concern was that it may be too strategic for beginners.

## 3. What players are looking for

1. **An opponent at any time.** Variant games die when the online lobby is empty. That happened to Chess 2 and to Battle vs Chess. The winners always pair a good computer opponent with a way to play friends.
2. **Short sessions and a reason to return.** Examples: Wordle's one puzzle a day, 5-minute Onitama games, 20-minute runs in the roguelikes, Puzzle Rush.
3. **A gentle way in.** A steep learning curve is the most common complaint about chess variants.
4. **Randomness that feels fair.** Really Bad Chess balances its random boards. Shotgun King is criticized when luck overrides skill.
5. **Personality.** Named bots, character art, and animated captures that stay fun because they can be sped up.
6. **Something to share.** The Wordle grid, 5D Chess clips, and Chess.com's streamer events.
7. **Free and frictionless.** Lichess and Wordle need no sign-up, no ads, and no install.

## 4. Ten suggestions (most impact for the effort first)

Effort: **S** = days, **M** = one to two weeks, **L** = more. None changes the default rules.

1. **Release it publicly and invite the backers (S).** Put the current build on a stable public URL (GitHub Pages or itch.io) as an installable web app that works offline. Then tell the 2,299 Kickstarter backers, and submit to CrazyGames and Poki. *Why:* reach decides whether a variant game lives; Chess 2 had good design and no audience. *We have:* a static build and a public repo.
2. **Play a friend by link, with no server (S–M).** After each move, the game makes a link that holds the whole game. The friend opens it, moves, and sends it back, over chat, email, or Discord. *Why:* it removes the empty-lobby problem at zero running cost. Real-time online play can come later, once there is an audience. *We have:* setups and moves already serialize.
3. **A daily King Down board (S).** Every day, everyone gets the same random army against the computer, with one try. The result can be shared without spoilers ("King Down #41 — won in 23 moves vs Club ♚"). A harder weekly board can follow. *Why:* this is what Wordle and Really Bad Chess do, and random armies are a natural daily seed. *We have:* the seeded army generator and skill levels.
4. **Learn each piece by playing (M).** Six one-minute lessons on the painted board, one per new piece. In each, the player does the piece's signature move in a tiny position: the Archer shoots without moving, the Guard cannot be taken, the Maester swaps, the Beast chains bites, the Ogre shoves, the Paladin jumps friends. *Why:* the steep learning curve is the most common complaint about chess variants; Onitama wins praise for teaching in minutes. *We have:* the rules guide, move explanations, and FEN positions.
5. **King Down puzzles (M).** Mine the balance lab's hundreds of thousands of games for positions where a King Down move wins material or mates, such as an Archer shot through blockers or a Beast chain. Offer them one at a time, plus a timed streak mode. *Why:* Puzzle Rush and Puzzle Storm are among the most-used features on Chess.com and Lichess. Puzzles also teach the new pieces. *We have:* the games, the engine, and the positions.
6. **Opponents with faces (S–M).** Turn the four skill levels into characters from the cast, each with a painted portrait, a one-line personality, and a playing bias: for example, a Maester who loves swaps as the beginner and the Frost King as the strongest. *Why:* Chess.com's named bots became memes, and its themed bots drew 120M games. *We have:* the art and the skill levels.
7. **A handicap ladder (M).** A ranked climb against the computer. The random-army generator gives you the stronger army at low ranks and the computer the stronger army at high ranks, like Really Bad Chess's rank 15 → 100. *Why:* it gives solo play a goal and rewards players who are learning. *We have:* measured piece values, so the generator can hit a target imbalance.
8. **Key moments after each game (M).** When the game ends, the engine marks the three biggest swings and any King Down tactic that was missed, and replays them with the painted animations. *Why:* Chess.com's Game Review redesign raised its use by 25%, and free analysis is a main reason players choose Lichess. *We have:* the engine, the move history, and the move explanations.
9. **An opt-in "King Down mode" with kings' powers (M, owner decision).** Each side picks its king's power at the start, shown as a painted card. Offer only the powers the lab measured as making games more decisive (Darkness, March, Leap), never the ones that raise draws (Death Touch, Strike). Classic stays the default. *Why:* powers and cards are the tabletop game's identity, and Knightmare Chess shows players enjoy rule-bending cards. *We have:* six built, tested powers and the measurements.
10. **Animation speed and skip (S).** Offer Normal, Fast and Off, and let a click skip the animation that is playing. Optionally let players save a capture as a short clip to share. *Why:* Battle Chess shows that animated captures delight at first and then feel slow. 5D Chess spread through clips. *We have:* the capture animations and reduced-motion support.

**Also considered, not in the ten:** real-time online matchmaking (needs an audience first); a Board Game Arena port of the full tabletop game with cards, a separate project; 3–4 players (4-Player Chess is Chess.com's most popular variant, and the tabletop game supports 4) is a large design and rules project for the owner; a roguelike campaign, a large bet on the current trend; more languages.

## 5. Confidence and limits

- Game facts come from store pages, Wikipedia, and review sites. Chess.com's numbers come from an industry analysis by Naavik. A few summaries come from secondary sites (chessroguelike.com, grokipedia), so treat those figures as indicative.
- There are no sales figures for Really Bad Chess or 5D Chess. Their success is inferred from review counts and coverage.
- None of these suggestions has been tested with players. Suggestions 1–3 are the cheapest way to get real player data.

## 6. Chess roguelikes (added 2026-09-27, owner question)

**What exists:** a real and growing niche with ten or more titles since 2022. Most are single-player only.

| Game | Where | Idea | Reception |
|---|---|---|---|
| Shotgun King | Steam | You are a lone king with a shotgun against a full army | Praised hook; criticized learning curve, difficulty spikes, repetition |
| Pawnbarian | Steam, mobile, browser (GX.games) | One hero moves as chess pieces played from a card deck, 5×5 dungeons | ~91% positive |
| The Ouroboros King | Steam, Android | Build an army of classic and **new fairy pieces**, plus relics, items and bosses; 15–45 min runs | 80% of 472; reviewers note the starting pieces decide too much |
| The Rookery | Steam | Craft an army: pieces, boosts, relics, consumables; 40 difficulty tiers | 94% of 77 |
| Usurper | Steam | Crazyhouse-style deckbuilder: start with a king, drop pieces from a deck; has online play | 82% of 34 |
| Passant | Steam | Collect pieces and rule-changing items across rounds | 79% of 365 |
| Gambonanza | Steam, mobile | Tiny board, capture everything, 150+ rule-bending "Gambits" | 200,000+ copies in two weeks; critics mixed |
| Master of Piece | Steam (early access, Feb 2026) | Deckbuilder with chess-like mercenaries on a grid | New |
| Checkfall | **Free in the browser** (itch.io demo) | Branching Balatro / Slay-the-Spire map; after each battle a fairy enchants one piece | Early demo |
| Others, free on itch.io | Browser | Roguelike Chess, HOT PIECES, MEGACHESS, Beyond The Board, Pawnbarian Classic | Small |

**The common pattern:**
- Start with a small army.
- Fight escalating computer armies and bosses.
- After each win, pick a reward: a new piece, a relic, or a rule-bending card.
- Runs last 15–45 minutes; the meta-progression unlocks new starting options.

**Common complaints:** the start of a run decides too much, difficulty spikes, repetition.

**What none of them has:** a designer-made fairy cast with a tabletop pedigree and finished art; a deck of spell cards already designed and illustrated (Strike, Leap, Haste, Frost Bite…); an engine whose piece values were measured over hundreds of thousands of games. These are exactly King Down's assets.

**Recommendation:** worth doing, as a second mode *after* the unlock progression (`docs/PROGRESSION.md`), because progression is its natural meta layer. A sketch, "The King's Road":
- Pick one of the four elemental kings.
- Start with the king, pawns and two pieces.
- Win battles on the full 8×8 board against rival armies.
- After each win, choose one reward: a new King Down piece, a one-use spell card from the tabletop deck, or a relic.
- The bosses are the rival kings with their powers.

This finally puts the cards into play and differentiates the mode with full-board chess and the King Down cast. The niche is crowded, so it succeeds only if it looks and feels distinctly King Down.

Sources for this section: [Ouroboros King](https://store.steampowered.com/app/2096510/The_Ouroboros_King/), [GameSpew impressions](https://www.gamespew.com/2024/07/the-ouroboros-king-impressions/), [The Rookery](https://store.steampowered.com/app/3074200), [Usurper](https://store.steampowered.com/app/2347280), [GamingOnLinux on Usurper](https://www.gamingonlinux.com/2024/01/usurper-turns-chess-into-a-deck-building-roguelike/), [Passant](https://store.steampowered.com/app/3353100/Passant_A_Chess_Roguelike/), [Gambonanza](https://en.wikipedia.org/wiki/Gambonanza), [Master of Piece](https://www.gamespress.com/Plan-Like-Chess-Fight-Like-a-Roguelike-Master-of-Piece-Comes-to-Steam-), [Checkfall](https://adelyons.itch.io/checkfall/devlog/1554858/checkfall-a-chess-roguelike-free-in-your-browser), [itch.io chess roguelikes](https://itch.io/games/free/tag-chess/tag-roguelike), [Chess-like Rogue-like bundle](https://store.steampowered.com/bundle/44785/Chesslike_Roguelike_Bundle/), [Pawnbarian](https://store.steampowered.com/app/1142080/Pawnbarian/), [Shotgun King](https://opencritic.com/game/14838/shotgun-king-the-final-checkmate/reviews).

## Sources

- Really Bad Chess: [Game Developer](https://www.gamedeveloper.com/design/how-zach-gage-breaks-all-of-the-rules-in-i-really-bad-chess-i-), [Wikipedia](https://en.wikipedia.org/wiki/Really_Bad_Chess), [Slate](https://slate.com/technology/2016/10/really-bad-chess-proves-that-games-dont-need-to-be-fair.html), [TouchArcade](https://toucharcade.com/2016/10/14/really-bad-chess-review/)
- 5D Chess: [Steam](https://store.steampowered.com/app/1349230/5D_Chess_With_Multiverse_Time_Travel/), [Know Your Meme](https://knowyourmeme.com/videos/222513-chess)
- Gambonanza: [Wikipedia](https://en.wikipedia.org/wiki/Gambonanza), [Steam](https://store.steampowered.com/app/3509230/Gambonanza/)
- Pawnbarian: [Steam](https://store.steampowered.com/app/1142080/Pawnbarian/), [Thinky Games](https://thinkygames.com/reviews/pawnbarian-a-dense-and-intricate-deck-building-gem/), [Pocket Gamer](https://www.pocketgamer.com/pawnbarian/review/)
- Shotgun King: [OpenCritic](https://opencritic.com/game/14838/shotgun-king-the-final-checkmate/reviews), [Wikipedia](https://en.wikipedia.org/wiki/Shotgun_King:_The_Final_Checkmate), [Turn Based Lovers](https://turnbasedlovers.com/review/shotgun-king-the-final-checkmate-review/)
- Passant: [Steam](https://store.steampowered.com/app/3353100/Passant_A_Chess_Roguelike/); chess roguelike comparison: [chessroguelike.com](https://chessroguelike.com/best-chess-roguelike-games)
- Chess 2: [Wikipedia](https://en.wikipedia.org/wiki/Chess_2:_The_Sequel), [Kotaku](https://kotaku.com/meet-the-guy-whos-making-a-sequel-to-chess-1623746114)
- Battle Chess: [Wikipedia](https://en.wikipedia.org/wiki/Battle_Chess), [Legacy of Games](https://legacyofgames.com/2025/12/29/battle-chess/), [HIARCS forum](https://hiarcs.net/forums/viewtopic.php?t=10204); Battle vs Chess: [Steam reviews](https://steamcommunity.com/app/211050/reviews/?browsefilter=toprated)
- Knightmare Chess: [Wikipedia](https://en.wikipedia.org/wiki/Knightmare_Chess), [Chess Variant Pages review](https://www.chessvariants.com/cards.dir/kmrevw.html)
- Chess.com: [Naavik](https://naavik.co/f2p-mobile/how-chess-com-100xd-mobile-revenue-in-10-years/), [bot personalities](https://chessiverse.com/compare/best-chess-bot-personalities), [Mittens](https://en.wikipedia.org/wiki/Mittens_(chess)), [variants forum](https://www.chess.com/forum/view/general/the-most-popular-chess-com-variant-is)
- Lichess: [Puzzle Storm](https://lichess.org/page/storm), [ChessSolve comparison](https://chesssolve.com/blog/lichess-vs-chess-com)
- Onitama: [Pixelated Cardboard](https://www.pixelatedcardboard.com/onitama-review/), [Wikipedia](https://en.wikipedia.org/wiki/Onitama)
- ChessCraft: [App Store](https://apps.apple.com/us/app/chesscraft/id6739758339), [FAQ](https://chesscraft.ca/faq)
- Wordle: [Wikipedia](https://en.wikipedia.org/wiki/Wordle)
- Portals and platforms: [CrazyGames chess](https://www.crazygames.com/t/chess), [Poki chess](https://poki.com/en/chess), [Board Game Arena 2025](https://en.boardgamearena.com/news?id=1025), [Discord Chess in the Park](https://support-apps.discord.com/hc/en-us/articles/26502048134551-Discord-Chess-in-the-Park-FAQ)
- King Down: [Kickstarter](https://www.kickstarter.com/projects/673576049/king-down), [BoardGameGeek](https://boardgamegeek.com/boardgame/165302/king-down), [Casual Game Revolution preview](https://casualgamerevolution.com/blog/2014/09/modern-day-chess-a-preview-of-king-down)
