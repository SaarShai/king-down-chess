# Keep the selected game during command recovery

Status: approved

The owner asks: "fix the wrong-game display on staging and verify the fix with the test accounts. keep the playtest going, and only ask me when absolutely necessary."

The scope is the confirmed wrong-game display from the staging playtest, F-077. A submitted computer-game turn can still be pending when the player opens a friend game. The friend URL must show that friend game. Recovery of a player move or computer reply must retain the original command and its game without changing the selected game. Keep the existing Create, Find and setup continuations.

Use the existing game runtime and recovery path. Add a regression at the real boundary. Deploy only to the isolated staging project. Verify with the saved staging test accounts through normal UI. Keep production, account security and game rules unchanged.

Work and evidence: [ticket 01](issues/01-pending-command-route.md).
