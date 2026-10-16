# King Down private test guide

## Add King Down

The owner gives you private app access. Use two separate ChatGPT accounts for a game with another tester. Use the same account on the web and the iPhone to check saved games.

On the web:

1. Open ChatGPT settings and the Apps or Plugins page. The name can differ with your account.
2. Select **Add custom MCP server**, if your account shows it. Use `https://kingdown.dev/mcp`. Ask the owner for the client ID and the exact fields to use. This is a public PKCE client; it needs no client secret.
3. Sign in on the King Down consent page. Approve the connection. Use only a test account.
4. In a new chat, select King Down in the app selector. Say “play King Down”. The small card shows **Play** and **Your games**. Select **Play** to open the game.

On the iPhone:

1. Add the connection on the web first. Sign in to the same ChatGPT account in the iPhone app.
2. Open a new chat. Select King Down in the app selector, then say “play King Down”. Select **Play**.
3. If the connection or selector does not show, tell the owner. Private app access and menu names need a check on each account. Do not add an unapproved server or change your account plan.

This guide uses the repository's private connection notes. The owner checks the current host menus before the test starts. The old connection does not use the new address. Add the new connection and sign in again. The release ends the old plugin test games.

## Pick a game

- **Computer**: choose **Beginner**, **Casual**, **Club**, or **Strong**. Club is the first default. Pick **White**, **Black**, or **Random** under **You play**. Select **Start game**. The computer replies after your move.
- **A friend**: choose the features, then select **Start game**. On **Your game code**, select **Share** to send the invite. **Copy** beside it copies the full invite, with the six-character code and rule names. If the device cannot share, Share copies the full invite. If Copy fails, the page says “Select the invite and copy it” and selects the text. In **Your games**, the waiting row shows the known code and **Share**. The friend adds King Down, then says “Join King Down game K7QX2M” with your code. Or the friend types the code under **Join with a code** in **Play** and selects **Join**. Review the features in the preview. Select **Join and take White** or **Join and take Black**, as shown for the open side, or **Decline**. A code lasts seven days. The **Ends** line shows when the game ends if no friend joins. Use **Make a new code** if it expires.
- **A random player**: choose the features, then select **Start game**. In **Open games**, select a game with **Accept**, or select **Find an opponent**. This takes the oldest open game or opens yours. A repeated random-game request keeps one open game. For a friend or random game, use the app to choose features first. If a chat request has no features, open **Play** and set them there. After 25 seconds, **Play the computer while you wait** appears. Your open game stays for 24 hours, also when you close ChatGPT. When **Opponent found** appears, select **Switch now** or **Not now**. Switch now ends the computer game with no result. Use **Cancel my open game** to stop waiting.

At your first game with a person, pick a unique **Name** and a preset **Picture**, then select **Save**. Your opponent sees these. Your real name and provider photo do not show.

## Choose the features

The first defaults are Fairy pieces on, Arrangement on, Classic chess off, Cards off, and King powers off. The app then saves your last choices.

| Control | What it does |
|---|---|
| **Fairy pieces** | Draw seven back-rank pieces from the pool. Open the button that shows the number of **kinds** to choose the pool. The king and pawns stay in. Locked boxes keep enough pieces for the draw. |
| **Arrangement** | With Fairy pieces on, each player orders their own back rank. Tap two pieces to swap them. **Shuffle** gives a legal order. Keep bishops on opposite colours and the guard next to the king. |
| **Classic chess** | Shows with Fairy pieces off. On gives the normal start, castling, and en passant. Off gives the chess pieces in a random order, with King Down rules. |
| **Cards** | Both players get the same four cards. Open the button that shows the number of **cards** to choose the deal pool. Keep at least four checked. Both hands show. A card you play leaves only your hand. |
| **King powers** | Tap your king coin to choose a king and a power. With Cards on, only powers that are always on are available. With powers off, White uses Spirit and Black uses Shadow. |

For a game with a person, each player chooses their own king and order when these controls are on. Each selects **Ready**. The seat then says **Waiting for the other player.** Use **Menu → Abort** to cancel setup while it is available. The orders stay hidden until both players are ready. Setup lasts up to three days. An unfinished setup ends with no result.

## Play and return

Tap your piece, then its destination or a move choice. Tap a card or power coin to read its rule. Select **Use** if it shows, then tap a marked square or select **Choose a move**. **Cancel** clears that choice. **Stop here** ends a turn that permits another move. Check that the move stays after you reopen the game. Use **Your games** to return to an open game.

The board shows **Resign** and **Menu**. In a game with a person, it also shows **Offer draw**. Select **Offer draw** and confirm. Your opponent uses **Accept draw** or **Decline draw**, then **Accept** or **Decline** to confirm. **Resign** opens **Lay your king down?**; confirm **Resign** or select **Keep playing**.

Open **Menu** for **Abort**, **Claim the win** or **End game** when available. Before each side's first move, **Abort** ends the game with no result. After a missed first-move deadline, **End game** ends it with no result. After a later missed three-day deadline, **Claim the win** gives you the win. **Moves** shows the move list. **Reload** reads the current game.

The end card shows **You win**, **You lose** or **Draw**, with the end reason. Human games can show **Rating**, a **?** and a rating change. An earned badge shows **New badge**. **Rematch** keeps the features and swaps colours. Your opponent uses **Accept** or **Decline**. **Your games** opens the profile scroll. No email or push alert arrives. Open **Your games** to check your turn.

## Profile and settings

Open **Profile** from **Play**. The scroll shows open games first, then finished games. Tap an open game to resume. Totals show played, won, drawn, and lost. Only games with people change the rating. A **?** marks a new rating. Select **More** for older games. Tap a badge to read its goal or earned date.

Open **Collection** from Profile. **Pieces**, **Kings**, **Powers**, and **Cards** show their rules. Every item is **Unlocked**.

Open **Settings** from Play or Profile. **Symbols only** replaces painted pieces with flat symbols. **Show threats** shows red arrows from enemy pieces to pieces they can take. Settings and your record follow your account across devices and chats. **Name and picture** opens your identity controls.

## Send a test report

Use the private report channel that the owner gives you. The app has no Report or Block control in this build. Chat has no report tool. For a problem, send:

- Web or iPhone; app or browser version; date and time.
- Play mode, colour, computer level, and each feature switch.
- Steps you take; what you expect; what you see.
- The error words and a screenshot, if safe. Hide personal chat text and active friend codes.
- Whether reopening the game changes the result. If “Always ask” shows repeated approval prompts while you wait, record their number over 15 seconds.

Do not send tokens, keys, passwords, or a consent URL. If you cannot open the app, report the step where it stops.
