# 05 — Teaching King Down in the first game

2026-10-15. Code paths: `.claude/worktrees/fault-round-2/src/`.

## Summary

| Option | What the player sees | Extra taps | Build cost | Evidence |
|---|---|---|---|---|
| **A. Just-in-time notes** (smallest) | One line in the context note when a new piece first does something | 0 | `screens/board.ts`, `context-line.ts`, `read.ts`; one model test | **Strongest fit** |
| B. A + the chat as tutor | A, plus the model knows the pieces in play; "Ask in chat" in the All rules sheet | 0 (+1 to ask) | A + `app.ts`, `server.ts`, tests | Mixed for on-demand help |
| C. Guided first game | A fixed army, three pointed prompts, a scripted computer | 0–1 (Skip) | A + `match/setup.ts`, new `teach-model.ts`, `settings.ts` + migration, computer move code | Weak for a chess-like game |

**Recommendation: build A now. Add the zero-tap part of B (model context) next. Do not build C.**

## 1. What the code does today

- Fairy pieces are on by default (`match/setup.ts:22`): a back rank draws 7 pieces from 10 kinds (`docs/RULES.md` §2).
- A tap on a piece shows "White archer." and one rule sentence (`read.ts:189-207`, `screens/board.ts:228-230`). The **All rules** button opens a sheet (`board.ts:240`).
- Nothing explains an *enemy* archer shot, ogre push or beast chain. It only shows as a moved piece.
- The widget calls `updateModelContext` only when `setWidgetState` is absent (`app.ts:75`) and never calls `sendMessage` (`ui/message`). The model gets "Your move, move 3." and no rules (`plugin/server.ts:66-76`).
- I did not find "Play now" in this worktree. The options assume it opens a Beginner solo game with a random, automatic army.

## 2. How strong games teach in the first minute

- **Marvel Snap.** The first round uses "only 50 percent of its full set of mechanics" and is "designed to be impossible to lose"; play starts as a guest ([Alliance](https://alliance.xyz/essays/removing-web3s-friction-pt-1-progressive-onboarding-and-games)).
- **Clash Royale.** "Five short tutorials"; each adds one element; later ones make the player show what they learned ([Apple](https://developer.apple.com/app-store/onboarding-for-games/)).
- **Hearthstone.** Easier matchmaking raised new-player win rates by about 15% ([TouchArcade](https://toucharcade.com/2017/01/05/ben-brode-talks-hearthstone-new-player-experience)).
- **Balatro.** No formal tutorial. The designer calls signposting an "extended low-calorie tutorial" ([Game Developer](https://gamedeveloper.com/design/balatro-creator-unveils-a-few-slick-signposting-strategies)).
- **Monument Valley.** Two instructions only ("Tap the path to move Ida", "Hold and rotate"). The player finds the rest by experiment ([Mechanics of Magic](https://mechanicsofmagic.com/2025/05/09/a-monumental-valley-of-puzzles-too-much-of-a-stretch/)).
- **Duolingo.** A lesson comes before sign-up. The growth lead reports about 20% more daily users after the move ([Intercom](https://www.intercom.com/blog/?p=15014)).
- **Chess.com variants.** A "?" pop-up gives each variant's goal and its difference from chess ([Chess.com](https://www.chess.com/article/view/how-to-play-variants-on-chess-com)).
- **Lichess variants.** One sentence first: "Captured pieces can be dropped back on the board instead of moving a piece" ([Lichess](https://lichess.org/variant/crazyhouse)).

Pattern: play starts at once; each new rule is one short line at the moment it matters; the first opponent is soft. (inference)

## 3. What the evidence says

- **Controlled data.** One study tested eight tutorial designs on more than 45,000 players ([Andersen et al., CHI 2012](https://grail.cs.washington.edu/projects/game-abtesting/chi2012/chi2012.pdf)):
  - Tutorials raised play time "by as much as 29%" only in the most complex, least familiar game. In the two simpler games, the effect was "negligible".
  - Instructions given "as closely as possible to when they were needed" gave +16% play time and +40% progress in the complex game, against an up-front manual.
  - Restricting player freedom gave no benefit.
  - On-demand help helped in one game, had no effect in one and harmed one.
  - Players "learn more from experimentation than from reading text".
- **Platform guidance.** "Let them start self-directed gameplay as soon as possible"; "teach one step at a time using short and clear instructions" ([Apple](https://developer.apple.com/app-store/onboarding-for-games/)).
- **Inside ChatGPT.** Do not drop users "into a multi-step onboarding flow" ([OpenAI](https://developers.openai.com/blog/what-makes-a-great-chatgpt-app)).
- **The chat as tutor.** `ui/message` posts a user message, and the host "MAY request user consent"; `ui/update-model-context` informs later turns without a reply ([MCP Apps spec](https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx)). The host can refuse a message ([sunpeak](https://sunpeak.ai/docs/mcp-apps/app/requests/send-message)). In ChatGPT the message shows in the chat ([forum, 2026-06-30](https://community.openai.com/t/ui-message-host-implementation-changed-from-window-openai-sendfollowupmessage/1385362)), and a tap can fail while the model writes ([forum](https://community.openai.com/t/widget-button-interactions-do-not-reliably-scroll-or-execute-while-assistant-is-still-responding/1379719)). I found no ChatGPT game app that uses the model as a rules tutor.

For King Down (inference): the chess part is familiar, so a tutorial adds little. The new pieces are the unfamiliar part, so short notes at the right moment help there.

## 4. Options

### A. Just-in-time notes (smallest)

**What and when.** Each note shows once per piece kind per game, only at Beginner (the quick-start level), so no saved flag is necessary.

- First turn, in the context note under "Your move.": *"New pieces in this game. Tap any piece to read its rule."*
- When an enemy piece first does something that chess does not have, the context line tells what happened and why:
  - Archer shot: *"The archer took from 2 squares away. Archers shoot without moving."*
  - Ogre push: *"The ogre pushed a piece 1 square and followed it."*
  - Beast chain: *"The beast took twice. After a take, a beast may take again."*
  - Paladin capture: *"The paladin left the board. It leaves after it takes anything but a pawn."*

**Taps.** 0. Notes do not block and need no reply.

**Build.** The move record already holds `captures` and `shove` (`board.ts:225`). Add a "teach" rank in `context-line.ts`, a word table beside `readText` in `read.ts`, and a per-game set of shown kinds in `board.ts`. One test. About 50 lines.

**Risks.**
- Check, refusals and draw offers must stay above the teach rank.
- The words must follow rule toggles, so use the source of `readText` (for example `ARCHER_READ`).
- Players who are not new but pick Beginner also see the notes. They are short and show once per kind.

### B. A plus the chat as tutor

**What and when.**
- No tap: at game start the widget sends model context with the pieces in play and their rule lines (from `readText`). The tool description adds: "The player may be new. If they ask, explain only the pieces in play, one sentence each." A typed "what just happened?" then gets a correct answer.
- One tap: **Ask in chat** in the All rules sheet sends *"Explain the King Down archer in two short sentences."*

**Taps.** 0 for the context; +1 to ask, and the player must look at the chat.

**Build.** `app.ts`: send `updateModelContext` at game start in all hosts, and add a `sendMessage` helper that handles `isError`. `board.ts`: the button. `server.ts`: tool description and reply text. Tests in `server.test.ts` and `client.test.ts`.

**Risks.**
- The message shows in the chat; the host can refuse it; a tap can fail while the model writes.
- On a phone in fullscreen, the answer may be off-screen. (inference)
- Without the exact rule text, the model can state rules wrongly.
- Evidence for on-demand help is mixed.

### C. Guided first game (Snap / Clash Royale style)

**What and when.** The quick-start sample uses a fixed army (archer, guard, ogre). Turn 1: *"Tap your archer."* (its square pulses), then *"Archers take from 2 squares away. Make any move."* Turn 3: *"Your guard cannot be taken, except by a king."* The computer pushes with its ogre early, and A's note explains it. **Skip** ends the guide; no prompt blocks a move.

**Taps.** 0–1.

**Build.** A fixed draw in `match/setup.ts`; a new `screens/teach-model.ts` with a test; hooks in `board.ts`; a `taught` field in `settings.ts` plus a migration; a scripted computer move.

**Risks.** Most code. A fixed army hides the random-army identity. A scripted computer can feel fake. Prompts go out of date when `RULES.md` changes. The data shows no gain from directed tutorials in familiar games.

## 5. Which option the evidence supports

**Option A.** It gives each instruction when it is needed, the one tutorial feature with a measured gain (+16% play time) in an unfamiliar game. It does not restrict the player; restriction showed no benefit. It leaves the chess part to experiment, as the reference games and the Apple and OpenAI advice suggest. The soft Beginner opponent does the "cannot lose" work of Snap and Hearthstone.

Add B's zero-tap model context next: it is cheap and makes the chat a correct fallback. Keep "Ask in chat" optional, because the evidence for on-demand help is mixed. C costs the most and has the weakest evidence for a game close to chess.

## Summary (6 lines)

1. Today a rule line shows only when the player taps a piece; enemy fairy moves go unexplained.
2. Data from 45,000 players: tutorials help only in unfamiliar games; help at the moment of need adds +16% play time.
3. Strong games teach by play: one short line at a time, and a soft first opponent.
4. Option A: zero-tap notes at Beginner when a new piece first acts; about 50 lines in three files.
5. B adds the chat as tutor; C is a guided, fixed first game at the highest cost.
6. Build A now, then B's model context. Skip C.
