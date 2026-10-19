# GUI previews 2026-10-19: the journey and shell screens

Status: in-progress
Type: task

## Why and the rule
Saar, 2026-10-19: "by the time i get back - everything must be sleek and pixel-perfect and faultless and beautiful to look at and a joy to use." His standing rule: a taste call needs his approval. So this lane builds a PREVIEW of the recommended pick of each item below, on its own branch, at award-level craft. Nothing merges until he approves the item on his approval page. Build each pick exactly as its option text says; do not build the other options; add no idea that the item does not name. Where a pick leaves a detail open, choose the most restrained and clear answer, and name it in your answer as a taste choice.

Record: copy this ticket to docs/specs/gui-previews-2026-10-19/issues/<this file name> in the repo, set its Status to done, and add the check results at the end.

Screens before the change: /private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/lanes/gui-review/gallery/ (INDEX.md names each image). The expert reviews: /private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/lanes/gui-expert/panel.md, /private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/lanes/gui-review/suggestions.md, review-astra.md, review-opus.md; /private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/lanes/gui-expert/argon-1.md, argon-2.md.
Proof for each item: before and after screenshots of each screen it changes, at the sizes where it shows (plugin harness: 390x844 and 1280x800, light and dark; web: 390x844 and 1440x900), saved as /private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/lanes/gui-prev-journey/previews/A<n>-<screen>-<size>-<theme>-before.png and -after.png. Take the before shots from the branch base, the after shots from your commit. A test for each behaviour change. npm test and the plugin-ui browser check pass. One commit per item.
Art: new or changed images only through Codex's built-in image_gen on the ChatGPT plan (never the paid images API). Match the painted cast (public/pieces/painted-2d/, docs/2d-first-pieces/) and keep every page under its size limit (the plugin page HTML stays under 1,000,000 bytes).

### A4 One way to start a game in the plugin

Problem: The new-game screen has two start buttons (Play now at the top, Start game at the bottom). Two starts make the player stop and think.

Build: **One start: “Start game” at the bottom**. Remove the full-screen “Play now”; saved games fold into one row when you have games. A friend game says “Create invite”.

Why this pick: One start per screen (Hick’s law). Quick play stays on the inline Home card.

Other options (do not build): Keep a quiet quick-play row in setup (A small row, not a big red button.)

### A6 Guide in the plugin, and a safer menu

Problem: The plugin has no Guide. In the menu, Resign sits among the other rows.

Build: **Add the Guide; Resign last after a gap**. One Guide row opens the six lessons and returns to the same game. On the web, “Keep playing” becomes the main button in the resign dialog.

Why this pick: The six short lessons help new players in ChatGPT too, and Resign at the end of the menu prevents a wrong tap.

Other options (do not build): Link only to the Collection (Smaller change.)

### A7 Phone title screen balance

Problem: On a phone the title group sits high with empty space below.

Build: **Centre the existing group**. Same twelve figures, centred for the screen height.

Why this pick: Centring the same group is a small change with a calmer first view.

Other options (do not build): Make the kings bigger (More drama, more change.)

### A11 Small text repairs

Problem: Some reading text uses the capital title font (profile name, the setup veil), and long rule text runs very wide.

Build: **Repair these spots only**. Profile name and the veil in the reading font; rule text at most 68 characters wide.

Why this pick: Sentence case in the reading font is easier to read; the headings keep the title font.

Other options (do not build): Replace the whole type scale (Bigger change.)

### A19 Setup hint cut off on phones

Problem: On a phone, the hint “select the coin to change” is cut by “…”. The approved sample keeps the hint in this line and an icon-only coin.

Build: **Let the line wrap**. Same words, two lines on a phone.

Why this pick: Letting the line wrap keeps your words and the sample.

Other options (do not build): Shorter words (For example “tap to change”.); A labelled “Change king” button (The panel’s redesign.)

### A21 Guide captions touch on phones

Problem: Two lesson captions touch on a phone. A gap between tiles would break your joined “piece shelf” (Lessons A).

Build: **Padding inside each tile**. Shelf stays joined; words unchanged.

Why this pick: Padding inside each tile keeps the shelf joined.

Other options (do not build): A 12 px gap between tiles (Separate ledges.); Shorter captions (New words.)

### A23 Player name before a name is chosen

Problem: Before the player picks a name, a long host code shows as the name on the seat bar, in Settings and as the Profile title. On a phone it also cuts the setup hint. It touches your player-name words.

Build: **Show “You” on the board and “Profile” as the title**. Until the player picks a name. We first check what a real host sends.

Why this pick: A plain word reads well and hides a code that means nothing to a player.

Other options (do not build): Ask for a name before the first game (One more step at the start.); Keep as it is (The host code stays until the player picks a name.)

### A25 Short sheets fill the full height on a wide screen

Problem: On a wide screen the Menu, Resign and king sheets stand full height with much empty space, and they hide the board. Today the sheet stands as a full page on purpose.

Build: **Fit the sheet to its content**. Tall sheets scroll inside a top limit. Phones stay full screen.

Why this pick: A sheet that fits its content keeps the board in view and still scrolls when it is tall.

Other options (do not build): Anchor short sheets to one side of the board (The board stays fully in view.); Keep as it is (Full-height sheets on a wide screen.)

### A26 King picker: which power is chosen

Problem: The chosen power looks almost the same as the others, and powers that are always on look like buttons. A third red style shows. The new web pictures and a “No power” choice are a scope question for you.

Build: **Clear ring on the chosen power; always-on powers look flat**. The dialog also fits its content.

Why this pick: A clear mark on the chosen power and a flat look for always-on powers make the choice easy to read.

Other options (do not build): Only a stronger fill on the chosen power (Smallest change.); Keep as it is (No change to the picker.)

### A28 Name in use: the message shows far from the field

Problem: When a name is in use, the field shows no mark, and the message shows below Save, far from the field. A fix needs words at the field.

Build: **Show “This name is in use.” under the field**. The same words the Save message uses.

Why this pick: The player sees the problem where they type, with the words the game already uses.

Other options (do not build): Show a short “Taken” mark next to the field (New, shorter words.); Keep as it is (The message stays below Save.)

### A31 Open games: rule icons with no labels

Problem: Open games shows a row of rule icons with no labels, and the legend under it wraps badly. The turn mark sits on the row edge. It touches your range-tile legend.

Build: **Write the filter in words**. For example the rule names in place of the icon row.

Why this pick: Words say what the filter does at a glance.

Other options (do not build): Keep the icons, add a label under each (More height.); Keep as it is (Icons only.)


## Plan and checks

Build A4, A6, A7, A11, A19, A21, A23, A25, A26, A28 and A31 in this order. Make one commit for each item. Keep all work on this branch.

For each item, save the base and commit images at device scale 2. Check phone and wide views. Use both plugin themes. Add a test for each change in use.

Run the type check, unit tests and the named browser runner. Keep the page below 1,000,000 bytes. Check the images at full pixel size. Record each open taste choice.

## Results

Base: bc62f4eec18f58b9e99c426422e362a6b5a8dc56

### A4

One Start game button stays in setup. Friend setup says Create invite. Saved games open from a count row. Home keeps quick play. Tests cover the start labels, the folded row and quick-start recovery. Type check passes.

Taste: use the native disclosure mark and the current row style.

### A6

Guide opens the six current lessons. A separate board holds each lesson. It sends no game command. Return to game keeps the live game. Resign is last with a 16 px gap. The web confirm gives Keep playing the main style. Tests cover each lesson goal, live rules and the return path.

Taste: use the current joined shelf in three columns. Use the current board art and rule text.
