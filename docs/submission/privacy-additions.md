# Privacy policy additions

Status: pasted into `public/privacy.html` on 16 October 2026 (ticket 11), with the owner's picks of 15 October: D9 a (account life, 12 months, host defaults), D12 a (the policy explains the activity time; no new screen) and D14 a ('Show when I am online' in Settings). The page is now the source; this file keeps the evidence for each block. `tools/privacy-policy.docs.test.ts` fails when a cleanup period, the Settings label or the OpenAI paragraph leaves the page.

Owner checks before the deploy: the Vercel and Supabase log periods in section 2, and the scope words "private ChatGPT app" (rehearsal R22; [checklist.md](checklist.md), owner step 5).

OpenAI rejects a plugin that "returns user-related data types that are not disclosed in your privacy policy" [O2]. The policy must give "the categories of personal data collected, the purposes of use, the categories of recipients, data retention timelines, and any controls offered to your users" [O3]. Research report 01, item D6, lists five gaps in `public/privacy.html` (updated 12 October 2026). The paragraphs below close them.

## 1. Activity times and online status

Where: in "What the game stores for your account", as a new list item after "games you play online against other people, including the moves;".

```html
  <li>for each online game, the time you last opened or played it, and whether your last move came from the website or from ChatGPT;</li>
```

Where: in the same section, after the paragraph that starts "Other players see your handle".

```html
<p>The game uses the time you last opened or played a game to update the board faster while both players are there, and to count how many players are online. The count shows no names. Your opponent's board gets your time only when <strong>Show when I am online</strong> is on in the app's Settings. It is off by default: then only a player who follows you and whom you follow gets it, and King Down has no way to follow a player yet. The game records these times with every setting: the default applies, and no setting stops it. We do not use these times for anything else.</p>
```

D14 a: the Settings row writes `online_visible_to` through `PluginService.settings()`: on is `everyone`, off is `nobody`. The default `mutual` shows as off, because no King Down screen can make a follow (`AccountService.relate` has only the website API route `POST /api/relations`, and no screen calls it). Choice for the owner: on means `everyone`. D12 a: the last sentence but one is the line that says the default applies.

Evidence: `last_seen_at` and `last_surface` in `src/match/store.ts:12, 57, 67`; written on each command and at most once each 30 seconds on a board reload (`src/match/service.ts:155, 285`). The opponent sees `last_seen_ms` only when `online_visible_to` allows it; the default is `mutual` (`src/match/service.ts:375–387`, `src/match/store.ts:30–31`, `src/match/service.db.test.ts:380`). The board polls faster when the opponent was seen in the last two minutes (`src/plugin/poll.ts:10`, `src/plugin/poll.test.ts:14–15`). The lobby shows a count, "N players online", from the players seen in the last 10 minutes (`src/match/store.ts:137–138`, `src/plugin/screens/lobby.ts:32–33`). The ChatGPT board does not show the opponent's online status as text. *Check:* whether the website shows it; if so, add "and to show whether you are online" to the paragraph.

## 2. Server and sign-in logs

Where: in "Where it is kept", after the first paragraph.

```html
<p>Like most websites, our servers keep short technical logs. Vercel records each request to kingdown.dev, with its time, address (URL), result and your IP address. Supabase records each sign-in, with its time and your IP address. When a game action fails, our server logs the time, the tool name and an error code, but not your moves or your messages. We use these logs only to keep the game running, find faults and stop abuse. Vercel keeps them for 1 day. Supabase keeps them for the log period of our Supabase plan, at most 90 days.</p>
```

Evidence: the site and its functions run on Vercel; sign-in and data run on Supabase (`docs/HOSTING.md`, `public/privacy.html` "Where it is kept"). Tool failures log the tool name, a request ID and a fixed error name and code, never the error message (`src/plugin/server.ts:58`, `src/plugin/diagnostics.ts`). *Inference:* Vercel and Supabase logs hold IP addresses; the owner confirms this in each dashboard.

Values in the page (D9 a, "as the hosts keep them"): Vercel keeps runtime logs for 1 day on the Pro plan (Vercel docs, "Runtime Logs", Limits; the project is on Pro, `docs/HOSTING.md`). The Supabase docs give no period on the pages read; the page says "the log period of our Supabase plan, at most 90 days".

Owner step: in the Supabase dashboard, read the log period of the plan. Then open Authentication → Audit Logs and switch off "Write audit logs to the database"; otherwise each sign-in also stays in the `auth.audit_log_entries` table with its IP address, with no end, and the page must say so. If Vercel has Observability Plus (30 days), change "1 day".

## 3. OpenAI as a recipient

Where: in "Where it is kept", after the new logs paragraph.

```html
<p>When you play King Down in ChatGPT, OpenAI receives what the app sends to ChatGPT. That is a short summary for the chat (for example, whose move it is, or your rating), and the board data that ChatGPT shows in the King Down board (the position, the moves, and your and your opponent's handles and pictures). OpenAI handles this data under its own privacy policy. We do not receive your ChatGPT conversation.</p>
```

Evidence: `content` and `structuredContent` reach the model and the transcript; `_meta` reaches only the component [O8]. `reply()` puts the summary in `content` and `structuredContent`, and the view and handles in `_meta` (`src/plugin/server.ts:61–75`). Both pass through ChatGPT. The MCP server receives only tool arguments; the consent page says the connection "cannot read the surrounding chat" (`src/plugin/consent.html`).

## 4. Retention times

Where: replace the second paragraph of "How long we keep it" (the one that starts "Games against other people stay").

```html
<p>We keep your account data while your account is open. After the deletion, games against other people stay in the other player's history with no link to your account, and your name shows as "Deleted player". Your handle stays reserved, so that nobody can use it to look like you. We keep a record of the deletion request (your account number and its dates) to show that we deleted the account.</p>
<p>Some records have a shorter life. The daily job deletes the record of which game a ChatGPT board shows after 7 days, and internal game event records after 30 days. We delete a report and its evidence 12 months after the report, unless a report hold covers it because the law tells us to keep it longer. A record of an action we took on a report (for example, a warning or a removed handle) stays after the report; after a deletion it has no link to your account. Server and sign-in logs follow the times in "Where it is kept". See <a href="./delete-data.html">how to delete your data</a> for the steps.</p>
```

Evidence for the periods: `cleanup()` in `src/online/jobs.ts` deletes boards after 7 days, outbox rows made or done more than 30 days ago, and reports older than 12 months that no hold covers (`src/online/jobs.db.test.ts`). Runtime-role block 10 (`plugin-deploy/runtime-role.sql`) lets the server role delete only those reports. A deletion sets `game_players.user_id`, `games.created_by`, `game_commands.actor_id` and `mod_actions.user_id` to null (migration 0006) and keeps the `account_deletions` row (migration 0005). *Inference:* `mod_actions` rows have no end; the owner can add one later.

Evidence: the current text says only that "Game records and report evidence can stay after deletion" (`public/privacy.html:69`). The seven-day grace and the daily deletion are already stated (`public/privacy.html:68`). The repo has no retention period for game records, reports or logs (`docs/plugin-beta-support.md`, "Data and release decisions").

The owner chose D9 a: games for the account life, reports for 12 months. The 12-month report delete is new in `cleanup()`, so the policy promises no deletion that does not happen.

## 5. If a reviewer password sign-in is added (approval item D8)

Use this only if the owner adds an email and password sign-in. Where: in "When you sign in", after the list.

```html
<p>You can also sign in with an email address and a password. Then we store your email address and a protected (hashed) form of your password with Supabase. We never see or store the password itself.</p>
```

If the password path is for one review account only, no policy change is necessary for this item. Then also keep the sentence "We never see or store your password" as it is.

## Not changed

- The "Children" section stays. OpenAI asks that plugins suit users aged 13–17 and do not target children under 13 [O3]; the current text meets this (research report 01, D10).
- Controls: the policy names show, correct, export and delete, and now also the 'Show when I am online' row in Settings (D14 a).

## 6. Data that the rehearsal found (R10–R12)

Pasted into "What the game stores for your account" as list items: the ChatGPT settings and last options (`player_settings`, migration 0013), games against the computer in ChatGPT, the last opened or played time and the surface of the last game action (`last_seen_at`, `last_surface`; R10 asks for "last game action", not "last move"), the board selections (`plugin_boards`, deleted after 7 days), the invitation-code tries in the last hour (`invite_code_tries`, migration 0009) and the deletion request (`account_deletions`). "Where it is kept" names OpenAI (section 3, R11). "How long we keep it" gives the 7-day, 30-day and 12-month cleanups (R12).
