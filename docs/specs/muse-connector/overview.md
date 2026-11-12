# Muse submission: the Overview step

Status: draft for the owner. Ticket: [16](issues/16-submission-packet.md), step 1.

This file gives a value to paste into each field of the Overview step of the Muse Connector Platform form (`/submission`). The field list is in [ticket 10](issues/10-portal-access.md). Fields marked **[owner]** need the owner. The Technical specs step uses [tool-docs.md](tool-docs.md); the data questionnaire uses [data-processing.md](data-processing.md).

The Muse guidelines (https://platform.muse.ai/docs, read live on 2026-11-12; the research report does not record sections 4.3, 5.1 and 5.2, so the owner checks them again before the submission) ask the overview for the intended users, the supported tasks, how the connector improves on browser use, and the account, plan, region and age restrictions (§5.1, §4.3). They ask for factual words (§3.2, §4.3). They give no rule for the name, the icon or the example prompts, and no character limits. The form has no description field: the overview text goes in "Anything else".

## Fields

### Connector name

```text
King Down Chess
```

### Company or developer

**[owner]** The name that the business verification (Persona) accepts. If the owner submits as a person: `Saar Shai`, the owner that `public/terms.html` names. If he submits as a business: its legal name. The choice is an open owner fact in [data-processing.md](data-processing.md), section 1. The live guidelines, §5.2 (https://platform.muse.ai/docs, read 2026-11-12; owner check), ask that this name agrees with the website and the listing.

### Product website

```text
https://kingdown.dev
```

### Example prompts

Each prompt uses a task that the six tools do (`src/muse/tools.ts`). The prompts name King Down, because a connector reaches Muse only through the user's words.

```text
Start a King Down game against the computer at beginner level. I play Black.
```

```text
In my King Down game, move my pawn to e5.
```

```text
Is it my turn in any of my King Down games?
```

```text
Show me the board of my King Down game.
```

```text
What does the archer do in King Down?
```

```text
Resign my King Down game against the computer.
```

Prompt 2 fits the game of prompt 1: each back rank has eight pawns, and the Black pawn on e7 can go to e5 after any first move of White. The tool for each prompt: `kingdown_new_game` (level `beginner`, colour `black`), `kingdown_move` (`said`; Muse first gets `game_id` and `expected_revision` from `kingdown_games` or `kingdown_view`, or from the result of the new game), `kingdown_games`, `kingdown_view` (no `game_id`: the most urgent game against the computer), `kingdown_explain` (topic `archer`, no game needed), `kingdown_end` (`resign`; it also needs `game_id` and `expected_revision` from an earlier result). If the form takes fewer prompts, use the first four.

### Connector icon

`public/icons/icon-512.png`: a PNG, 512 × 512 pixels, RGBA (`sips -g pixelWidth -g pixelHeight` and `file`, 2026-11-12). The same file is live at https://kingdown.dev/icons/icon-512.png.

### Payments

```text
Does not accept payments
```

King Down is free (`public/terms.html`, "The game"). The connector has no purchase, no payment and no paid plan.

### Your name

**[owner]** The owner's name as on his government ID.

### Work email

```text
hello@kingdown.dev
```

**[owner]** Confirm that the owner reads this mailbox. It is the contact in `public/support.html`, `public/privacy.html` and `public/terms.html`.

### Support email or URL

```text
https://kingdown.dev/support.html
```

### Privacy policy URL

```text
https://kingdown.dev/privacy.html
```

Before the submission, the page must name Meta as a recipient (ticket 16, step 4). On 2026-11-12 the page does not contain "Muse" or name Meta as a recipient.

### Terms of service URL

```text
https://kingdown.dev/terms.html
```

The terms name kingdown.dev and the ChatGPT app, not Muse. They apply to each use of the game, so no change is necessary for the form. A line that names Muse is an option for the owner.

### Anything else (optional)

```text
What it is
King Down Chess is chess with fairy pieces (archer, guard, maester, beast, ogre, paladin), a random back rank that both sides share, and optional king powers. The connector lets a user play King Down against the computer in Muse by text or voice, with the same account and games as kingdown.dev.

Who it is for
Players of chess and chess variants who want to play, check or learn King Down in chat or hands-free, without a board on screen.

What it does (6 tools: 3 Read, 3 Write)
- Start a game against the computer: level (beginner, casual, club, strong), colour, classic chess pieces or fairy pieces, king powers on or off.
- Play a move from the user's words ("pawn to e5"). The server matches the words against the legal moves only. Words that fit several moves give numbered choices; words that fit no move give the reason. Nothing plays on a guess. The computer replies in the same call.
- Show a game as speakable text: a status line, the pieces of each side, a letter grid and a link.
- List the user's unfinished games, the user's turn first.
- Explain a piece, a square, a king power or a card.
- End a game against the computer: resign, or abort before each side has played a turn.

Value beyond the browser
The game server knows the legal moves and explains why a move is refused. It keeps the user's games and turn status in the user's account, so a game against the computer started in Muse continues on kingdown.dev, and a game against the computer started on kingdown.dev continues in Muse. Play needs no screen: each result starts with a sentence for speech, and the computer's reply comes in the same result.

Limits
- Moves and new games only against the computer. A game against a person shows only its status and a link; Muse cannot play it. No ranked play, no cards in play, no invitations, no chat with players.
- No payments and no purchases. King Down is free.
- A free kingdown.dev account is necessary (sign-in with Google or GitHub). The connector reads only the games of the signed-in account. It sends no message and shares nothing outside King Down.
- King Down has no age, plan or region limit of its own. Muse's own limits apply (18+, the Muse regions).
- Rate limits for each account: 60 new games and 120 moves in 60 seconds, counted together with the same actions on kingdown.dev; reads have no count limit.

How reviewers sign in
Use the two test accounts in the Integration credentials step. On the King Down sign-in page, choose "Sign in with email and password", enter the test account's email and password, then approve the access. If the page shows a signed-in account, choose "Use another account" first. Each test account starts with no games: say "Start a King Down game against the computer" first.
```

Check of each claim, against main on 2026-11-12:

- The pieces and the shared back rank: `docs/RULES.md`, sections 2 and 3. King powers are optional (section 4). Cards are lab only, and the connector starts games with no cards (`kingdown_new_game` uses `DEFAULT_OPTIONS`, which has `cards: false`, in `src/match/setup.ts`; [spec.md](spec.md), version 1 limits). `kingdown_explain` explains a card by name.
- The levels, colour, `classic` and `king_powers` inputs, and the defaults: `kingdown_new_game` in `src/muse/tools.ts`.
- Words match only legal moves; choices on more than one match; the reason on no match; the computer replies in the same call: `kingdown_move` in `src/muse/tools.ts` and `src/muse/match-words.ts`; [demo-script.md](demo-script.md), scenes 2 and 3.
- A game against a person gives only its status and a link; moves refuse it with `PERSON_GAME`: `kingdown_view` and `computerGame` in `src/muse/tools.ts`.
- 3 Read and 3 Write tools, no Sensitive write, no message and no sharing: [tool-docs.md](tool-docs.md).
- Rate limits, shared with the website counters: [tool-docs.md](tool-docs.md), "Rate limits" (`COUNTERS` in `src/muse/tools.ts`, `TOOL_LIMITS` in `src/plugin/service.ts`). The HTTP edge limits (3 calls in progress for each account) are in the same file; the overview leaves them out.
- The same account and games as kingdown.dev: [issues/06-game-backend.md](issues/06-game-backend.md) (`GameService` and Postgres); the link `https://kingdown.dev/g/<game id>` in each result.
- Sign-in options: the connector consent page offers "Continue with Google", "Continue with GitHub" and, in a Muse build, the review form "Sign in with email and password" (`src/plugin/consent.html`; `src/plugin/consent.ts` shows each social button that the Supabase settings allow). It has no email code. The consent page keeps its own session, apart from the website.
- The reviewer sign-in words "Sign in with email and password" and "Use another account": [ticket 15](issues/15-review-accounts.md) and `docs/MUSE.md`, "Review accounts". On production this works only after the release that turns the connector on and the production review accounts ([ticket 17](issues/17-submit.md)).
- Muse is 18+ and runs in some regions only: [the research report](../../research/muse-connector-2026-11-08/muse-platform-contract.md), section 5. King Down's own rule is "children under 13 should sign in only with a parent's permission" (`public/privacy.html`), which is not a limit.

## Open for the owner

1. Company or developer: a person (`Saar Shai`) or a business name. It must agree with the business verification.
2. Your name, as on the government ID.
3. Work email: confirm `hello@kingdown.dev`.
4. The privacy page change that names Meta (ticket 16, step 4) goes live before the submission.
5. Read the overview text again after the custom-connector test ([ticket 12](issues/12-custom-test.md)), the read-only decision ([ticket 13](issues/13-read-only.md)) and the decision on games against a person ([ticket 14](issues/14-person-games.md)). Each can change a line of "What it does" or "Limits".
