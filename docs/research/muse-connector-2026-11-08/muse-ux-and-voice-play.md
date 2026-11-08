# Muse connector research: user experience and voice play

Date: 2026-11-08. Scope: the user-experience side of a King Down connector for Meta Muse. Read only. No sign-in, no form, no access request.

Tags: [verified: source] means that the source states the fact. [inferred] means that this report derives it. [unknown] means that no public source answers it. Secondary sources (blogs, trackers) carry the word "secondary".

## 0. Summary

- Muse is Meta's personal AI agent. It launched on 2026-09-08 in the US on the Muse app (iOS, Android), muse.ai on the web and WhatsApp. A Mac app and voice mode followed. Muse on AI glasses is "coming", with no date. [verified: https://about.fb.com/news/2026/09/introducing-muse-personal-ai-agent/] [verified: https://about.fb.com/news/2026/11/introducing-muse-ai-voice-expressive-avatars/]
- Correction to the brief: the brief says that Muse is "on the Meta AI app, web and AI glasses". That text describes **Meta AI Connectors** (dev.meta.ai), a separate developer preview. **Muse Connectors** (platform.muse.ai) is the program for Muse. Muse runs in its own Muse app, not in the Meta AI app. [verified: https://dev.meta.ai/products/connectors] [verified: https://www.meta.com/help/superintelligence/1331373868832401/] Whether one connector can serve both programs is [unknown].
- No public source documents how Muse shows a connector's result: text, image, card, link or widget. No source says that Muse renders MCP Apps widgets. Plan for text first. [verified: https://platform.muse.ai/docs] [verified: https://modelcontextprotocol.io/extensions/apps/overview] (Muse is not in its client list) [verified: /Users/za/Documents/king down chess (new)/independent-review/development-blueprint.md:469]
- No game, puzzle or trivia connector is listed. King Down can be the first game connector. [verified, secondary: https://postfa.st/blog/meta-muse-connectors-list]
- Voice chess prior art agrees on one method: match what the user says **against the list of legal moves**, never against free text. When more than one move matches, offer a short list of choices. Let "no" cancel. Read the board as piece lists, not as 64 squares. [verified: https://github.com/lichess-org/lila/blob/master/ui/voice/src/move/voice.move.ts] [verified: https://lichess.org/page/blind-mode-guide]
- Recommendation: a small set of tools (3 reads, 3 writes in version 1). Each move result contains the computer's reply and the new position, so play needs no extra read calls and no extra approval prompts. The board is a short spoken summary, plus a piece list, plus a letter grid on screens, plus a link to view on kingdown.dev. The link is extra. It never replaces play in chat.

## 1. What Muse is, and how users meet connectors

### 1.1 Product and surfaces

| Fact | Tag |
|---|---|
| Muse "doesn't just answer questions, it actually does the work". It runs on a cloud computer (Muse Secure VM) and uses the Muse Spark model. | [verified: https://about.fb.com/news/2026/09/introducing-muse-personal-ai-agent/] |
| Launch 2026-09-08, US. Surfaces: Muse app (iOS, Android), muse.ai, WhatsApp. Glasses "coming soon". Free with a usage limit; paid plans for more use. | [verified: https://about.fb.com/news/2026/09/introducing-muse-personal-ai-agent/] |
| Mac app that works with files, apps and browser tabs. WhatsApp by message or voice mode. | [verified: https://ai.meta.com/muse/] |
| Later markets: Singapore (October 2026), Japan (secondary). Canada and Mexico are named by secondary sources only. | [verified: https://about.fb.com/news/2026/10/muse-is-now-available-in-singapore-the-worlds-first-personal-ai-agent-built-for-everyone/] [verified, secondary: https://postfa.st/blog/meta-muse-connectors-list] |
| Voice mode with an expressive avatar rolls out from 2026-11-05 in the US on mobile, web and Mac. The user can interrupt. Muse "handles it in the background as you talk". Voice is "coming soon to AI Glasses and Muse Charm". | [verified: https://about.fb.com/news/2026/11/introducing-muse-ai-voice-expressive-avatars/] |
| Connect 2026 (2026-09-23): Muse comes to AI glasses "in the coming months". The user calls it by name, and it can act on what the glasses see. | [verified: https://about.fb.com/news/2026/09/the-biggest-news-from-connect-2026/] |
| The glasses post names no glasses model and no date for Muse. It does not mention Meta Ray-Ban Display for Muse. | [verified: https://about.fb.com/news/2026/09/introducing-ray-ban-meta-audio-glasses-new-styles-plus-muse/] |
| As of 2026-11-08, no source confirms that Muse is live on any glasses. | [unknown] |
| Muse can make documents, images, code and single-page web tools ("artefacts"). It shows new files and images in the conversation and saves them to the Library. | [verified: https://www.meta.com/help/superintelligence/2074655449783957/] |

### 1.2 How users add and control connectors

| Fact | Tag |
|---|---|
| The user asks in chat ("Connect my Gmail") or goes to Settings > Connectors > Connect, then authorises. | [verified: https://www.meta.com/help/artificial-intelligence/1687253048996149/] |
| Approved connectors are discoverable "by the Muse agent and in Settings > Connectors". Featuring is a separate editorial choice. | [verified: https://platform.muse.ai/docs §7] |
| Many connectors can be limited to read-only. Disconnecting stops data exchange, but Muse memories and history can keep what it already used. | [verified: https://www.meta.com/help/artificial-intelligence/1687253048996149/] |
| Some calendar connectors can push updates to Muse; Muse flags this before connect. Whether a third-party connector can push (for example "your opponent moved") is not documented. | [verified: https://www.meta.com/help/artificial-intelligence/1687253048996149/] [unknown] for third parties |
| Muse builds a "skill" (saved instructions) for a connector after a working test, for custom connectors. | [verified, secondary: https://parallel.ai/articles/meta-muse-custom-integrations.md] |

### 1.3 Approval prompts (human-in-the-loop checks)

| Fact | Tag |
|---|---|
| Reads and writes from platform connectors default to "Ask on first use". Choices: Allow once, Always allow, Deny. Sensitive writes ask every time; choices Allow once, Deny. Always allow can be revoked. | [verified: https://platform.muse.ai/docs §3.3] |
| A tool that combines reads and writes is a write. | [verified: https://platform.muse.ai/docs §3.2] |
| Allow once covers only the action and details shown. If details change after approval, a fresh approval is necessary. | [verified: https://platform.muse.ai/docs §3.4] |
| The Help Center adds scopes: allow once, for the current task, for a specific site, or always for a connector; and deny. "See task details" shows more context. Settings > Permissions has "Ask for some actions" and "Always ask". | [verified: https://www.meta.com/help/artificial-intelligence/1385290430137537/] |
| Approval requests appear in a dialog apart from the conversation. | [verified, secondary: https://parallel.ai/articles/meta-muse-custom-integrations.md] |
| An unofficial API wrapper shows a "pending_user_confirmation" state and an expiry time on each approval request. | [verified, secondary and unofficial: https://useapi.net/docs/api-muse-v1/post-muse-chats-chatId-approvals-approvalId] |
| How an approval appears in voice mode or on glasses. | [unknown]. The voice post does not mention approvals. [verified: https://about.fb.com/news/2026/11/introducing-muse-ai-voice-expressive-avatars/] |

### 1.4 How connector results appear

| Surface | What is known | Tag |
|---|---|---|
| App and web | Muse shows text and the files and images that it makes. A connector's own image, card, link or button display is not documented. | [verified: https://www.meta.com/help/superintelligence/2074655449783957/] [unknown] for connector output |
| Widgets (MCP Apps) | Not documented. MCP Apps' own client list does not name Muse or Meta. Treat as "no" until Meta confirms. | [verified: https://modelcontextprotocol.io/extensions/apps/overview] [inferred] |
| Voice (app, web, Mac) | Muse speaks its answers. It does background work during the talk. | [verified: https://about.fb.com/news/2026/11/introducing-muse-ai-voice-expressive-avatars/] |
| Glasses without display (Ray-Ban Meta, Oakley Meta) | Voice in and voice out only. | [inferred] from the hardware; Muse on glasses is not live [unknown] |
| Meta Ray-Ban Display | The lens shows apps, messages and directions; the Neural Band gives gesture input. Whether Muse or a connector can show a board there is not documented. | [verified, secondary: https://www.euronews.com/2025/09/18/meta-ray-ban-glasses-just-got-a-display-and-you-can-control-it-with-your-hand] [unknown] for Muse |
| Muse Terms | Meta uses "commercially reasonable efforts to display Connector Content accurately". AI deviations can occur. | [verified: https://platform.muse.ai/terms] |

Consequence: the model reads the tool result and writes or speaks its own answer. Every result must therefore hold short, exact, speakable sentences that the model can repeat without change. [inferred]

## 2. Launched connectors, games, and conversation memory

### 2.1 Connectors

- Launch and later partners (2026-09 to 2026-10): Meta apps (Facebook, Instagram, Threads, Messenger), Gmail, Google Calendar, Outlook, OpenTable, Ticketmaster, Duffel, Plaid, Link by Stripe, Shopify, Peloton, Withings, Spotify; then Notion, Granola, Asana, Box, Dropbox, Slack, Zoom, GitHub, Canva, Figma, Stripe, QuickBooks, Zapier and more. [verified, secondary: https://postfa.st/blog/meta-muse-connectors-list]
- Connect 2026 named shopping (Walmart, Best Buy, Sephora and more), payments (Shop Pay, PayPal), travel (Expedia), groceries (Instacart) and work (Notion, Granola, GitHub, Box). [verified: https://about.fb.com/news/2026/09/the-biggest-news-from-connect-2026/]
- Small business: Asana, Box, Canva, Dropbox, Figma, Shopify, Slack, Stripe, Zoom and others. [verified, secondary: https://unite.ai/meta-adds-small-business-skills-and-app-connectors-to-muse-ai-agent]
- Entertainment: Spotify, Ticketmaster, Fever (announced), Klook (Japan). **No game, puzzle or trivia connector** is named in any source. [verified, secondary: https://postfa.st/blog/meta-muse-connectors-list] [unknown] whether Meta reviewers have a game-specific policy.
- Terms forbid real-money gambling, including cashing out virtual goods. King Down has no money, so this rule does not block it. [verified: https://platform.muse.ai/terms] [inferred]

### 2.2 Multi-turn tasks and memory

| Fact | Tag |
|---|---|
| Muse "isn't strictly turn-by-turn". The user can follow up without restating context. Side chats keep topics apart, and Muse stays aware across them. | [verified: https://www.meta.com/help/superintelligence/1331373868832401/] |
| Muse remembers context from past conversations, preferences, and "context from any Connectors you've linked". | [verified: https://www.meta.com/help/superintelligence/995796179982326/] |
| Muse keeps working after the app closes and returns when something changes or it needs approval. It sets reminders and scheduled tasks and can monitor things (example: daily rain alerts). | [verified: https://about.fb.com/news/2026/09/introducing-muse-personal-ai-agent/] [verified: https://ai.meta.com/muse/] |

Consequences for King Down [inferred]:
- Do not trust the model to keep a game ID across days. Each tool must accept "my current game" (no ID) and pick the most urgent game on the server.
- Muse memory can keep facts from tool results. Results must hold only game data, never another player's private data.
- A user can ask Muse for a scheduled check ("tell me when it is my turn"). The connector needs a cheap read tool for this. Push from a third-party connector is [unknown].

## 3. Prior art: board games through voice and chat

### 3.1 Systems

| System | Move input | Board readout | Confirm, undo, errors | Tag |
|---|---|---|---|---|
| Lichess voice (web) | Offline speech model (Vosk). Closed vocabulary: files a–h, NATO words (alfa…hotel), ranks one–eight, piece names, "takes", "castle", "promote". Fillers ("um", "the") are ignored. The heard phrase is matched by cost against the **legal move list**. | Coloured or numbered arrows on the board for each candidate move. | A preferred move plays after a timer (0 to 5 s) unless the user says "no". "yes" plays at once. A colour or number picks another candidate. A partial phrase (only a square or piece) shows the destinations as choices. "undo", "oops" and "takeback" request a takeback. "help" lists the words. | [verified: https://github.com/lichess-org/lila/blob/master/ui/voice/lexicon/move-en-lex.json] [verified: https://github.com/lichess-org/lila/blob/master/ui/voice/src/move/voice.move.ts] |
| Lichess blind mode (screen reader) | Typed SAN (e4, Nf3). | "p N" lists white knights; "s 1" or "s f" scans a rank or file; "l" reads the last move; "c" clocks. Piece lists use one fixed order. Identical output is not repeated. Clocks are spoken as words. | Abort, Takeback, Resign, Draw as typed words. | [verified: https://lichess.org/page/blind-mode-guide] [verified: https://lichess.org/page/blind-mode-changelog] |
| Chess.com voice control (web) | Hold space, speak. "Knight to f three", "Bishop c four", "E two to e four"; "takes" or "captures"; "king side", "short"; "A eight bishop" for promotion; "horse" for knight. | Speaks whose move it is, the opponent's moves, results. | Unknown speech: "Please repeat." Ambiguity: the user adds a file, a rank or "from". Commands: resign, draw, rematch, new game. No undo named. | [verified: https://support.chess.com/en/articles/12872404-how-do-i-make-moves-using-my-voice] |
| Blindfold Chess (Alexa skill) | "move B8 to A6" only (square to square). Castling by the king's squares. | None; the user keeps the board in mind. | The game saves; "open blindfold chess" resumes it. | [verified: https://github.com/laynr/blindfold-chess] |
| Chess for Glass (Google Glass) | "ok glass, queen, to d2". The menu drops the from-square when only one piece can go. Optional NATO files ("echo two, echo four"), "less prone to sound ambiguities". | Spoken move announcements. | Take back one half-move from the menu. | [verified: https://aartbik.com/glass.php] |
| Google Assistant chess actions | Conversational Actions shut down on 2023-06-13. | — | — | [verified: https://developers.google.com/assistant/ca-sunset] |
| ChatGPT chess apps | Developer examples use an MCP Apps board widget plus algebraic moves. No official OpenAI chess app is found. | Widget. | — | [verified, secondary: https://developers.cloudflare.com/agents/guides/chatgpt-app] |
| King Down's own ChatGPT app (parked) | `kingdown_move` takes "one to four exact legal moves, in order, all or nothing". | Widget (fullscreen). | No undo, no hints (owner Q14). | [verified: src/plugin/server.ts:182] [verified: docs/specs/chatgpt-mvp/spec.md:50] |

### 3.2 What works [inferred from 3.1]

1. **Closed grammar over legal moves.** The server never guesses from free text. It ranks the legal moves that fit the words. Lichess and Chess for Glass both do this.
2. **Short forms.** "Knight f3", or only the target square when one piece can go there. Ask for the from-square only when two pieces fit.
3. **Phonetic files.** Accept "echo four" as e4. B, D, E and G sound alike.
4. **One clear confirm rule.** Play at once when exactly one legal move fits. When two or more fit, read them as a numbered list and wait. "No" or "cancel" stops.
5. **Undo is a safety net for speech errors.** Lichess, Chess for Glass and Chess Maven offer takeback. Against a person it needs the other side's consent.
6. **Readout by request, not by default.** Speak the last move and whose turn it is. Give piece lists by side or by kind on request. Never read 64 squares aloud.
7. **Fixed order and no repeats.** Sort piece lists the same way each time (Lichess changelog).
8. **Resume by default.** Alexa Blindfold Chess resumes the saved game when the user opens the skill.

## 4. What King Down adds to the problem

Facts from the repo, and the voice problem that each one makes:

| Game fact | Voice and chat consequence [inferred] |
|---|---|
| The back rank is 7 random pieces plus the king, the same order for both sides, shared as an 8-letter string such as `RSAKGQOB`. [verified: docs/RULES.md:27-37] | The user cannot know the start position. The first result must read the back rank aloud. |
| Six fairy pieces: Archer (A), Paladin (L), Guard (G), Maester (M), Beast (S), Ogre (O). [verified: docs/RULES.md:41-55] | Input must know these names. Letters for a grid exist; Unicode chess symbols do not cover them. |
| The Archer takes "without moving"; the Maester swaps with a friend; the Ogre shoves a neighbour and follows; the Beast can bite again. [verified: docs/RULES.md:50-55] | "Move" is not always "from–to". The grammar needs the verbs **shoot**, **swap**, **shove** and **bite again**. |
| `describeMove` already writes one sentence per move for a screen reader: "White knight g1 to f3, taking …", "… takes … without moving", "… swaps places with …", "… shoves … to …", "White castles short". [verified: src/move-text.ts:86-132] | Reuse these sentences as the spoken readout. Accept the same verbs as input, so one vocabulary goes both ways. |
| `checkCause` gives one line: "Their archer can shoot your king." [verified: src/move-text.ts:17-40] | Speak it right after the opponent's move. |
| `pieceGuide` and `readText` give short rule text per piece under the current rules ("Shoots 2 squares straight or diagonally forward."). `reachOf` lists a piece's legal steps, takes, shots, swaps and pushes. [verified: src/read.ts:77-196] [verified: src/read.ts:199-219] [verified: src/read.ts:23-38] | "What can my archer do?" has two answers: the rule (pieceGuide) and the legal options now (reachOf). |
| `whyNot` explains a refused move: "Only a king can take a guard.", "That leaves your king in check.", "Holy Light: this piece cannot be taken." [verified: src/read.ts:245-276] | Speak this reason, then offer the legal options for that piece. |
| `threatsIn` lists enemy pieces that can take the mover's pieces. [verified: src/move-text.ts:134-147] | Answer "what is under attack?". |
| A turn can hold more than one action: Haste (two moves), a free Freeze or Ice Wall then a move, a Beast chain. The context line says "Move it again, or select End turn." and "Bite again, or stop here." [verified: src/context-line.ts:35-41] [verified: docs/RULES.md:76-79] | The move tool must accept a whole turn in one phrase, or keep a turn open and ask the next question. |
| King powers are optional; cards are lab-only in the web game, but the parked ChatGPT app dealt 4 cards. [verified: docs/RULES.md:61-64] [verified: docs/RULES.md:131] [verified: docs/specs/chatgpt-mvp/spec.md:42] | Version 1 in Muse: fairy pieces, optional king powers, no cards. Cards add a hand to read aloud. |
| Online games have no clocks and up to 3 days a move. [verified: docs/specs/chatgpt-mvp/spec.md:33] | Async play suits Muse reminders and "is it my turn?". |
| The parked server already has games list, create, join, invite, move, computer, resign, abort, draw tools. [verified: src/plugin/server.ts:126-233] | The domain layer exists. The Muse tools can be a thin, new surface over it. |
| Ranked games forbid "outside advice on active ranked positions". [verified: src/plugin/server.ts:141] | Muse is itself an AI that can suggest moves. Ranked play through Muse is a fair-play risk. |
| The alternative interface study (2026-10-26) covers GUI and UX for screens only (two design books, desktop and phone). [verified: /Users/za/Documents/king down chess (new)/app/docs/specs/alternative-interface-study/issues/01-independent-studies.md:1-37] | It gives no voice guidance. |

## 5. Recommended conversational UX for King Down in Muse

### 5.1 Principles [inferred]

1. **Play completes in chat.** Start, move, computer reply, rules help, resume and result all work without a browser. This meets "complete the task" and "add value beyond the browser". [verified: https://platform.muse.ai/docs §1.1, §1.2]
2. **The value beyond the browser** is: a rules engine that knows the legal moves and explains refusals; the user's own games and turn status (account access); and hands-free play by voice. Muse's browser cannot reliably drive a three.js board. [inferred]
3. **Speakable first.** Each result leads with one or two sentences that the model can speak without change. Detail comes after.
4. **Few tools, rich results.** Each first use of a tool asks for approval. Fewer tools means fewer prompts. A write result also carries the new position, so no read follows it.
5. **Factual tool descriptions.** No "always use King Down" text. [verified: https://platform.muse.ai/docs §3.2]

### 5.2 Core journeys

**A. Start a game against the computer.**
User: "Play King Down with me." Muse calls `kingdown_new_game` (defaults: you are White, Casual level, fairy pieces on, no powers). Result to speak:
> "New game. You are White. Your back rank, from a to h: rook, beast, archer, king, guard, queen, ogre, bishop. Pawns on rank 2. Black has the same order. Your move."

**B. Make a move by text or voice.**
User: "Knight to f3", "echo four", "archer shoots e5", "maester swaps with the king", "ogre shoves d4". Muse calls `kingdown_move` with the user's words in a field `said` (plus an optional exact move). The server matches the words against legal moves:
- One match: it plays the move, plays the computer's reply in the same call, and returns: "You: knight g1 to f3. Black: archer c8 takes your pawn on e6 without moving. Your move."
- Two or more matches: it plays nothing and returns numbered choices: "Two rooks can go to d1: 1, rook a1; 2, rook h1. Which one?" The next call sends the choice.
- No match: it plays nothing and returns the reason from `whyNot` and the piece's options from `reachOf`: "Only a king can take a guard. Your rook on a1 can go to a2 to a6, or take on a7."
- A turn with a second step: the server keeps the turn open and asks: "Bite again on d5 or e5, or stop here?"

**C. Ask "what can my X do".**
Muse calls `kingdown_explain` (read). With no game it returns the rule (`pieceGuide`). In a game it also returns the legal options now (`reachOf`): "Archer: steps 1 square any way. It shoots without moving, 2 squares straight or 2 diagonally forward, over pieces. Your archer on c1 can shoot nothing now; it can step to b2, c2 or d2."

**D. See the board.**
Muse calls `kingdown_view` (read). It returns the layers in section 5.3. "Where are their pieces?" reads Black's list only. "What is on the e-file?" reads one file.

**E. Resume a game.**
User: "Continue my King Down game" or "Is it my turn?". `kingdown_games` (read) lists games, your turn first: "You have 2 games. Your turn against the computer, move 14. Waiting for Dana, move 6." `kingdown_view` with no ID opens the most urgent game.

**F. Play an online friend (version 2, linked account).**
`kingdown_invite` returns a 6-character code and a share text. The user sends it; the connector does not send messages. The friend says "Join King Down game K7QX2M". Moves use the same `kingdown_move`. "Is it my turn?" uses a reminder or a scheduled check that calls `kingdown_games`.

**G. End a game.** `kingdown_end` with `resign`, `abort`, `offer_draw`, `accept_draw` or `decline_draw`. Muse first says what will happen ("You lose this game. Resign?").

### 5.3 How to show the board without a widget

Use layers. Each layer is in every `kingdown_view` result and in a short form in every move result.

| Layer | Content | Surface |
|---|---|---|
| 1. Status line (always) | Side to move, move number, last move sentence (`describeMove`), check line (`checkCause`). | Voice, glasses, chat |
| 2. Piece lists (always) | "White: king d1; guard e1; queen f1; …; pawns a2, b2, …". Fixed order: king, queen, rooks, bishops, knights, then fairy pieces, then pawns. Frozen or walled pieces say so (`pieceStates`). | Voice on request; chat |
| 3. Letter grid (chat only) | 8×8 monospace grid with rank and file labels, uppercase White, lowercase Black, "." for empty. A one-line legend for the fairy letters. | Chat on screen. Whether Muse keeps monospace is [unknown]. |
| 4. Board image (test it) | A PNG of the painted board from kingdown.dev, at a short-lived, unguessable URL, or as MCP image content. | Unknown until the developer preview shows whether Muse displays it. [unknown] |
| 5. View link (extra) | `https://kingdown.dev/...` link to watch or continue the same game in the full 3D board. | Chat. Never the only answer. |

Example letter grid (start position, back rank `RSAKGQOB`):

```
  a b c d e f g h
8 r s a k g q o b
7 p p p p p p p p
6 . . . . . . . .
5 . . . . . . . .
4 . . . . . . . .
3 . . . . . . . .
2 P P P P P P P P
1 R S A K G Q O B
A archer, G guard, M maester, S beast, O ogre, L paladin
```

### 5.4 Tools, classes and approval friction

Version 1 has six tools. The class is the one the submission declares; Meta's review sets the final class. [verified: https://platform.muse.ai/docs §6.2]

| Tool | What it does | Class | Friction |
|---|---|---|---|
| `kingdown_games` | List your games, your turn first; turn status. | Read | Ask on first use, then Always allow. |
| `kingdown_view` | One game's position in layers 1–5; default the most urgent game. | Read | Same. |
| `kingdown_explain` | Rules for a piece, power or rule; legal options for one piece now. | Read | Same. Works without a game. |
| `kingdown_new_game` | Start a game against the computer (level, colour, fairy pieces, powers). Returns the first position, and the computer's first move when it is White. | Write | Ask on first use. |
| `kingdown_move` | Match the said move to a legal move; play it or return choices; play the computer's reply; return the new position. | Write (it reads and writes) | Ask on first use, then Always allow. After that, play has no prompts. |
| `kingdown_end` | Resign, abort, offer, accept or decline a draw. | Write; reviewers can call resign "consequential" and mark it Sensitive. | Sensitive means a prompt every time. That is acceptable: it is rare. |
| `kingdown_invite`, `kingdown_join` (version 2) | Make a friend code; join with a code. | Write | No message is sent by the connector, so it is not a "send". [inferred] |

First session cost: up to three prompts (new game, move, view), each with Always allow. [inferred from https://platform.muse.ai/docs §3.3]

Risks [inferred]:
- If reviewers class a move against a **person** as Sensitive (it is visible to another person and cannot be undone), each online move asks every time. Mitigation: keep computer games and online games in the same tool, document the move as a routine game write with no money and no message, and keep the say-preset and chat features out of Muse.
- Approval on glasses is [unknown]. Ask testers to set Always allow on the phone before they test by voice.
- Put the human-readable move in the tool input (`said: "knight to f3"`), so that "See task details" shows what will happen.

OAuth and read-only option: version 1 links a kingdown.dev account by OAuth. Offer a read-only scope (games, view, explain). [verified: https://platform.muse.ai/docs §3.1] Whether a connector can run without account linking for computer games is [unknown].

### 5.5 Voice rules for results [inferred]

- Lead with the opponent's move, then "Your move." Keep the spoken part under about 30 words.
- Use the words of `describeMove`, not SAN. Say "knight g1 to f3", not "Nf3".
- Say numbers and files plainly. Accept "alfa" to "hotel" as files.
- Never read the whole grid aloud. Offer "Say 'their pieces' or 'my pieces' to hear the board."
- Return choices as a numbered list of at most four.
- Keep computer replies fast. Speech has no spinner. Use the Casual level by default. Target latency is [unknown] until a test.

### 5.6 What to avoid

1. **A link wrapper.** A tool that returns only "open kingdown.dev/play" fails §1.2 and §1.1 ("Sending the user to finish ... does not meet the completion requirement"). [verified: https://platform.muse.ai/docs §1.1, §1.2]
2. **A widget-first design.** Muse widget support is not documented. [unknown]
3. **Steering text** in descriptions ("Use this whenever the user mentions chess"). [verified: https://platform.muse.ai/docs §3.2]
4. **A guess on a bad match.** Play a move only when exactly one legal move fits. [inferred from §3]
5. **Ranked play through Muse.** The agent can suggest moves; ranked rules forbid outside advice. [verified: src/plugin/server.ts:141] [inferred]
6. **Extra data.** Results carry handles and game data only; no email, no presence, no ratings of others beyond the game. [verified: https://platform.muse.ai/docs §4.2]
7. **Many small tools.** Each one is an extra first-use prompt and an extra review item. [inferred]

## 6. Open questions

| # | Question | Who answers |
|---|---|---|
| 1 | Does Muse show images or links from a connector result? Does it keep monospace text? | Test in the developer preview. |
| 2 | How do approval prompts work in voice mode and on glasses? | Meta, or a test when glasses support ships. |
| 3 | Can one connector serve both Muse Connectors and Meta AI Connectors? | Meta. |
| 4 | Can a connector work without OAuth (guest computer games)? | Meta. |
| 5 | Can a third-party connector push "your opponent moved"? | Meta. |
| 6 | Takeback against the computer? The ChatGPT app has none (Q14), but voice errors make it useful. | Owner. |
| 7 | Will reviewers class online moves or resign as Sensitive? | Meta review. |

## Sources

Primary: https://platform.muse.ai/docs · https://platform.muse.ai/ · https://platform.muse.ai/terms · https://dev.meta.ai/products/connectors · https://about.fb.com/news/2026/09/introducing-muse-personal-ai-agent/ · https://about.fb.com/news/2026/09/the-biggest-news-from-connect-2026/ · https://about.fb.com/news/2026/09/introducing-ray-ban-meta-audio-glasses-new-styles-plus-muse/ · https://about.fb.com/news/2026/11/introducing-muse-ai-voice-expressive-avatars/ · https://about.fb.com/news/2026/10/muse-is-now-available-in-singapore-the-worlds-first-personal-ai-agent-built-for-everyone/ · https://ai.meta.com/muse/ · https://www.meta.com/help/artificial-intelligence/1687253048996149/ · https://www.meta.com/help/artificial-intelligence/1385290430137537/ · https://www.meta.com/help/artificial-intelligence/2124746764949121/ · https://www.meta.com/help/superintelligence/1331373868832401/ · https://www.meta.com/help/superintelligence/995796179982326/ · https://www.meta.com/help/superintelligence/2074655449783957/ · https://modelcontextprotocol.io/extensions/apps/overview · https://github.com/lichess-org/lila/tree/master/ui/voice · https://lichess.org/page/blind-mode-guide · https://lichess.org/page/blind-mode-changelog · https://support.chess.com/en/articles/12872404-how-do-i-make-moves-using-my-voice · https://github.com/laynr/blindfold-chess · https://aartbik.com/glass.php · https://developers.google.com/assistant/ca-sunset

Secondary: https://postfa.st/blog/meta-muse-connectors-list · https://parallel.ai/articles/meta-muse-custom-integrations.md · https://useapi.net/docs/api-muse-v1/post-muse-chats-chatId-approvals-approvalId · https://unite.ai/meta-adds-small-business-skills-and-app-connectors-to-muse-ai-agent · https://developers.cloudflare.com/agents/guides/chatgpt-app · https://www.euronews.com/2025/09/18/meta-ray-ban-glasses-just-got-a-display-and-you-can-control-it-with-your-hand

Repo: docs/RULES.md · src/move-text.ts · src/read.ts · src/context-line.ts · src/plugin/server.ts · docs/specs/chatgpt-mvp/spec.md · /Users/za/Documents/king down chess (new)/independent-review/development-blueprint.md:469 · /Users/za/Documents/king down chess (new)/app/docs/specs/alternative-interface-study/issues/
