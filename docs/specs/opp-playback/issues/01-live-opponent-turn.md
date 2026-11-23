# Play the opponent's turn on the web board

Type: task
Status: claimed

Use Replay to show each new opponent turn on the web board. Start with the position before the turn and finish with the server position. Show the server position at once on entry, on a reconnect, after a gap of more than one turn, and with reduced motion.

A board tap ends playback and then acts on the current position. A new server position ends old playback before it can change the board again.

Check the web page's calls to the board with two clients, the match engine and the replica. Run the web game and play scenes browser checks.

## Answer

The page plays one new opponent turn from the server log with Replay. It shows symbols at once. A live checkmate plays the move before the king falls.

The test first records zero live plays for both pawn swaps, the Maester and queen swap, a normal move and Haste. The focused check now passes all 16 cases. It also checks a card, reload, reconnect, History, reduced motion and two ways to stop playback.
