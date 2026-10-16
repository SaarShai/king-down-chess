# Directory listing

The listing fields live in [package/plugin.json](package/plugin.json) under `extensions.com.openai.interface`. This file shows the same text for review. Keep the two copies the same. Limits are from [O1], [O4] and [O5] (research report 01, section 4).

| Field | Limit | Value | Length |
|---|---|---|---|
| `name` (package ID) | 64; lowercase, numbers, single hyphens | `king-down` | 9 |
| `displayName` | 30, one line | King Down | 9 |
| `shortDescription` (subtitle) | 30, one line | Chess with king powers | 22 |
| `developerName` | 80 | Saar Shai | 9 |
| `category` | one allowed value | Entertainment | — |
| `longDescription` | 4,000 | below | 1,162 |
| `defaultPrompt` (starter prompts) | 3; 128 each; unique; no `@` | below | 36 each |
| `capabilities` | 20 labels; 120 each | below | 25–36 |
| `logo`, `composerIcon` | square, 48–4,096 px, ≤ 5 MiB | `./assets/logo.png` (512 × 512, copy of `public/icons/icon-512.png`) | 409 KiB |
| `websiteURL` | HTTPS, ≤ 1,024 | https://kingdown.dev | — |
| `supportURL` | HTTPS, ≤ 1,024 | https://kingdown.dev/support.html | needs a deploy |
| `privacyPolicyURL` | HTTPS, ≤ 1,024 | https://kingdown.dev/privacy.html | — |
| `termsOfServiceURL` | HTTPS, ≤ 1,024 | https://kingdown.dev/terms.html | — |
| `brandColor`, `brandColorDark` | optional | not set (owner's choice) | — |
| `screenshots` | optional; 706 px wide, 400–860 px tall | not set; the directory no longer shows them [O3] | — |

## Name rules checked

- The name is not one generic word, and it has no "Plugin", "MCP" or "MCP Server" [O3].
- No text compares King Down with another product.
- No text gives pricing, subscriptions, trials, discounts or promotions [O3]. *Inference:* the word "free" stays out of the listing.

## Long description

> King Down is a chess variant by Saar Shai. Before each game you choose the features: kings with powers, new pieces such as the archer, the ogre and the paladin, cards, and your own back-rank arrangement. Classic gives normal chess.
>
> With King Down in ChatGPT you can:
> - play against the computer at four levels, from beginner to strong;
> - start a friend game and send your friend a 6-character invitation code;
> - join a friend's game with a code;
> - play a random King Down player in Daily games, with days for each move;
> - see your active games and which ones wait for your move;
> - see your rating, totals and badges;
> - offer or accept a draw, resign, or cancel a game before it starts.
>
> You play the moves on the King Down board in the chat. ChatGPT can start, open and end games for you, but it does not see the board position and does not choose moves for you. Every piece, king power and setup is unlocked; there is nothing to buy and there are no ads. Games against people use five preset messages only, with no free text chat.
>
> You sign in with a King Down account. Limitations: moves need the board, so the full game works where ChatGPT shows app screens.

Each claim matches a tool in `src/plugin/server.ts`: levels (`kingdown_create`), invitation codes (`kingdown_invite`, `kingdown_join`), random Daily games (`kingdown_create` kind `random`), the games list (`kingdown_games`), the profile (`kingdown_profile`), draw, resign and abort (`kingdown_draw`, `kingdown_resign`, `kingdown_abort`), the five presets (`PRESETS` in `src/match/protocol.ts`). Moves are app-only tools (`kingdown_move`, visibility `app`).

## Starter prompts

1. Play King Down against the computer.
2. Is it my turn in any King Down game?
3. Show my King Down rating and badges.

## Capabilities

- Play against the computer
- Play friends with an invitation code
- Play random opponents in Daily games
- Show ratings, totals and badges
