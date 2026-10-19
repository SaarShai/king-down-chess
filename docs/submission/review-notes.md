# Review notes

The text for the portal's **Review details** (Metadata & Skills → Review information → Review details). Never put it in the ZIP ([checklist.md](checklist.md), rows 15 and 46). Replace the two values in `<ANGLE BRACKETS>` in the portal only. The password goes only into the portal field. Do not write it in this file or in a commit.

## Text to paste

> **Sign-in.** King Down uses its own account page. Use the review account below. It needs no email code and no second factor.
>
> 1. In ChatGPT, connect King Down. ChatGPT opens the King Down page.
> 2. On the King Down page, select **Sign in with email and password** (under the Google and GitHub buttons).
> 3. Enter the email and the password below, then select **Sign in**.
> 4. Select **Continue**, then **Allow connection**.
>
> Email: `<REVIEW_EMAIL>`. Password: `<REVIEW_PASSWORD>`.
>
> **Sample data.** The account has one finished game against a friend (won), a rating, three badges, and one game against the computer where it is your move. It also has an active game against review-friend where it is their move. Open that game from Your games to test Block player. Test case P5 resigns a game against the computer. The active game against review-friend stays for the Block check.
>
> **Block a player.** In a game against a person, open Menu, select **Block player** and confirm. After a game ends, its end card also offers **Block player** or **Unblock player**. The same Menu offers **Unblock player**. A block ends follows, stops Find and joins to open games, and hides messages. The current game continues. A block also stops new rematch offers and accepts. Unblock does not restore follows. Profile also lists blocked players, with Unblock for each player. You can use it after the game ends.
>
> **Online status.** In Settings, **Who sees when you are online** has three choices: Everyone, Friends only and Nobody. Friends only is the default. Friends are players who follow each other. King Down has no way to follow a player yet, so Friends only shows your time to nobody for now. The website and the app use the same value.
>
> **Surfaces.** King Down needs its board in the chat to play a move: the chat model does not see the position and does not choose moves. Please test King Down on the ChatGPT surfaces that show app screens: the website, the iOS app, the Android app and the desktop app. King Down does not claim Codex, because Codex shows no board. If the app can be limited to these surfaces, please limit it.

## Annotation appeal (use only if the automated review flags a hint)

> kingdown_move, kingdown_computer and kingdown_choose have destructiveHint false. Each call adds one turn or one setup choice to the player's own game record. It deletes, overwrites or sends nothing outside that game. The board in the chat makes each call; the model cannot call them. Tools that end a game, cancel, take a seat, use an invitation or send to another player (resign, abort, draw, claim, cancel, accept, find, join, invite, say, rematch, report, block, handle, settings) have destructiveHint true.

## Sources

- Sign-in: approval D8 a. The form is in `src/plugin/consent.html`; `plugin-deploy/review-signup-hook.sql` refuses every other password sign-up, and `plugin-deploy/oauth-audience-hook.sql` refuses a password sign-in for every other address; `npm run plugin:db:seed-review` adds the sample data (`tools/plugin-db/seed-review.ts`). The owner tests with a separate test account, so the review account keeps this data ([checklist.md](checklist.md), owner step 2).
- Surfaces: approval D15 a; checklist row 39 and open question 2. 17 of the 26 tools are for the board only (rehearsal R16).
