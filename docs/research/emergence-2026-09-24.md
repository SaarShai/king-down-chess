# Games where behavior emerges (2026-09-24)

> Recovery status, 2026-09-24: Design inspiration, with mixed source types. Examples and player anecdotes do not establish general enjoyment. [Catalog and qualifications](../cursor-recovery/2026-09-24-0213b442/RESEARCH.md) · [Adoption record](../cursor-recovery/2026-09-24-0213b442/EXECUTED.md).

Notes for King Down. Primary accounts only. This does not change the rules.

## Life

Conway’s Game of Life is a board of cells. Each cell looks only at its eight neighbors. Two or three neighbors: it stays. Three neighbors on an empty cell: a birth. Anything else: it dies. All of that happens at once. Martin Gardner published it in Scientific American in October 1970, from talks with Conway. It drew more reader letters than any column of his up to then. Conway picked the rules so that a simple start would change for a while and then die out, freeze, or loop — and so that nothing would obviously grow forever, even though some patterns seem to. Source: Gardner, “The fantastic combinations of John Conway’s new solitaire game ‘life’,” Scientific American, October 1970 (scan: https://stanford.edu/class/sts145/Library/life.pdf). Scholarpedia restates the same three tests: https://www.scholarpedia.org/article/Game_of_Life.

What people like: you set a few counters and something you did not draw walks across the board. What is less great: after the first setup, nobody is playing. It is a thing you watch.

## Small games people play

**Baba Is You** (Arvi Teikari, Game Developer, 2019). Words on the board are the rules. He adds a word, tries the obvious levels, and keeps the ones where two words do something surprising. When he found players could stack two words on one square, he rebuilt the rules to allow it, because “the player doing something utterly surprising” mattered. https://www.gamedeveloper.com/design/designing-i-baba-is-you-i-s-delightfully-innovative-rule-writing-system

**Into the Breach** (Justin Ma, Subset Games). The enemy shows its attack before it moves, so a loss is your fault, not a guess. The artillery’s push is usually more useful than its damage. Ma’s rule for what to keep: if it cannot be shown clearly, cut it. Playtesters read three sentences and still said “What.” An animated picture of the push beat the sentence. If every board wants the same choice, “you’re just a robot.” Sources: https://www.gamedeveloper.com/game-platforms/road-to-the-igf-subset-games-i-into-the-breach-i- and https://www.gamedeveloper.com/design/-i-into-the-breach-i-dev-on-ui-design-sacrifice-cool-ideas-for-the-sake-of-clarity-every-time-

**Vampire Survivors** (Luca Galante, PC Gamer). He did not start with a vision. He put things in “to try and make things fun,” and he does not mind a weapon being too strong if the player can choose the easy one or a harder one they like. Combos are the point: a weapon plus a passive item becomes a new weapon, and the first time it happens the game tells you. https://www.pcgamer.com/vampire-survivors-creator-didnt-have-a-vision-when-he-started-making-the-game-that-allowed-him-to-quit-his-job/ Players who stay a long time often say later runs feel the same (a patientgamers thread, 2025): https://www.reddit.com/r/patientgamers/comments/1onyhui/vampire_survivors_stands_for_everything_i_dislike/

**Balatro** (discussed by Mark Brown, GMTK). The fun is that you picked the joker, so the ridiculous score is yours. Showing the exact score in advance would turn it into a spreadsheet. Hiding it makes the best players do the arithmetic outside the game. https://gmtk.substack.com/p/balatros-cursed-design-problem

## What carries over

A pattern a person notices is the product. Life’s glider, Breach’s push, Baba’s stacked words, Survivors’ evolution. The rule list is not the product.

Three tests, stolen from those designers:

1. Conway: a simple start should change for a while, then end. Not die on move one, and not run forever.
2. Ma: if the right move is always the same, nobody is playing. And if you need three sentences, the picture failed.
3. Galante: the first time two pieces do something together, the game should show you. A broken combo the player chose is fine. A combo only the computer finds, on move one, is not a discovery.

## Applied

The board now says the verb the first time it happens in a game: the ogre pushed the guard, the archer shot, the beast kept taking, the maester swapped, the paladin left, the catapult threw, a piece was set down. A later repeat stays quiet. Into the Breach’s lesson was one clear picture, not three sentences. Mini Metro’s lesson was the same: one swipe, then the system. Vampire Survivors tells you the first time two things combine. That line is the tell. It does not add a rule.
