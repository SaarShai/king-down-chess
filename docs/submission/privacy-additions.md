# Privacy policy additions (draft for the owner)

Status: draft. The owner approves the words and the numbers. Do not edit `public/privacy.html` until then.

OpenAI rejects a plugin that "returns user-related data types that are not disclosed in your privacy policy" [O2]. The policy must give "the categories of personal data collected, the purposes of use, the categories of recipients, data retention timelines, and any controls offered to your users" [O3]. Research report 01, item D6, lists five gaps in `public/privacy.html` (updated 12 October 2026). The paragraphs below close them.

Text in `<ANGLE BRACKETS>` is a value that the owner must supply. It is not in the repo, so this draft does not guess it.

When the owner approves: paste each block at the named place, change "Last updated" to the paste date, and run the page check.

## 1. Activity times and online status

Where: in "What the game stores for your account", as a new list item after "games you play online against other people, including the moves;".

```html
  <li>for each online game, the time you last opened or played it, and whether your last move came from the website or from ChatGPT;</li>
```

Where: in the same section, after the paragraph that starts "Other players see your handle".

```html
<p>The game uses the time you last opened a game to update the board faster while both players are there, and to count how many players are online. Your opponent's game gets the time you were last there only if your setting allows it. By default, only players who follow you and whom you follow get it. We do not use these times for anything else.</p>
```

Evidence: `last_seen_at` and `last_surface` in `src/match/store.ts:12, 57, 67`; written on each command and at most once each 30 seconds on a board reload (`src/match/service.ts:155, 285`). The opponent sees `last_seen_ms` only when `online_visible_to` allows it; the default is `mutual` (`src/match/service.ts:375–387`, `src/match/store.ts:30–31`, `src/match/service.db.test.ts:380`). The board polls faster when the opponent was seen in the last two minutes (`src/plugin/poll.ts:10`, `src/plugin/poll.test.ts:14–15`). The lobby shows a count, "N players online", from the players seen in the last 10 minutes (`src/match/store.ts:137–138`, `src/plugin/screens/lobby.ts:32–33`). The ChatGPT board does not show the opponent's online status as text. *Check:* whether the website shows it; if so, add "and to show whether you are online" to the paragraph.

## 2. Server and sign-in logs

Where: in "Where it is kept", after the first paragraph.

```html
<p>Like most websites, our servers keep short technical logs. Vercel records each request to kingdown.dev, with its time, address (URL), result and your IP address. Supabase records each sign-in, with its time and your IP address. When a game action fails, our server logs the time, the tool name and an error code, but not your moves or your messages. We use these logs only to keep the game running, find faults and stop abuse. Vercel keeps them for <VERCEL LOG RETENTION, e.g. "up to N days">; Supabase keeps sign-in logs for <SUPABASE AUTH LOG RETENTION>.</p>
```

Evidence: the site and its functions run on Vercel; sign-in and data run on Supabase (`docs/HOSTING.md`, `public/privacy.html` "Where it is kept"). Tool failures log the tool name, a request ID and a fixed error name and code, never the error message (`src/plugin/server.ts:58`, `src/plugin/diagnostics.ts`). *Inference:* Vercel and Supabase logs hold IP addresses; the owner confirms this in each dashboard.

Owner step: read the log retention for the Vercel Pro plan and the Supabase plan in each dashboard, and put the two numbers in the text. If either service keeps logs for longer than you want, shorten it there first.

## 3. OpenAI as a recipient

Where: in "Where it is kept", after the new logs paragraph.

```html
<p>When you play King Down in ChatGPT, OpenAI receives what the app sends to ChatGPT. That is a short summary for the chat (for example, whose move it is, or your rating), and the board data that ChatGPT shows in the King Down board (the position, the moves, and your and your opponent's handles and pictures). OpenAI handles this data under its own privacy policy. We do not receive your ChatGPT conversation.</p>
```

Evidence: `content` and `structuredContent` reach the model and the transcript; `_meta` reaches only the component [O8]. `reply()` puts the summary in `content` and `structuredContent`, and the view and handles in `_meta` (`src/plugin/server.ts:61–75`). Both pass through ChatGPT. The MCP server receives only tool arguments; the consent page says the connection "cannot read the surrounding chat" (`src/plugin/consent.html`).

## 4. Retention times

Where: replace the second paragraph of "How long we keep it" (the one that starts "Games against other people stay").

```html
<p>We keep your account data while your account is open. Games against other people stay in their history with your name shown as "Deleted player", for <GAME RECORD RETENTION, e.g. "as long as the other player's account is open">. Your handle stays reserved. We keep a report and its evidence for <REPORT RETENTION, e.g. "N months after the report is closed">, so that we can act on repeated abuse. Server and sign-in logs follow the times in "Where it is kept". See <a href="./delete-data.html">how to delete your data</a> for the steps.</p>
```

Evidence: the current text says only that "Game records and report evidence can stay after deletion" (`public/privacy.html:69`). The seven-day grace and the daily deletion are already stated (`public/privacy.html:68`). The repo has no retention period for game records, reports or logs (`docs/plugin-beta-support.md`, "Data and release decisions").

Owner step: choose the two periods. If a period needs a job that the code does not run yet, say so to the agents; the policy must not promise a deletion that does not happen.

## 5. If a reviewer password sign-in is added (approval item D8)

Use this only if the owner adds an email and password sign-in. Where: in "When you sign in", after the list.

```html
<p>You can also sign in with an email address and a password. Then we store your email address and a protected (hashed) form of your password with Supabase. We never see or store the password itself.</p>
```

If the password path is for one review account only, no policy change is necessary for this item. Then also keep the sentence "We never see or store your password" as it is.

## Not changed

- The "Children" section stays. OpenAI asks that plugins suit users aged 13–17 and do not target children under 13 [O3]; the current text meets this (research report 01, D10).
- Controls: the policy already names show, correct, export and delete (`public/privacy.html:72`). *Inference:* the online-status setting is a control, but the ChatGPT app has no screen for it. Open question 4 in [checklist.md](checklist.md).
