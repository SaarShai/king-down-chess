# King Down private beta and support packet

Use this packet after a private server, provider login and ChatGPT connection are working. It separates reproducible engineering checks from the actual host evidence needed before inviting players or requesting public review.

## Acceptance scenarios

Record date, client/OS/build, account/workspace, launch route, UI resource version, server artifact identity and the observed result for every run. Use two dedicated test users and disposable games. Keep credentials and unrelated chats out of recordings and reports.

| ID | Positive scenario | Required result |
|---|---|---|
| P1 | Open King Down and play an ordinary move, then the computer's reply. | Board artwork loads; the board updates directly without a model reply; correct side and move number appear. Record prompts and latency actually observed. |
| P2 | Choose Haste, complete or pass its second action, then exercise an Archer shot or Ogre shove. | Distinct legal choices remain visible; Haste preserves the actual turn until finished; saved/reloaded positions match. |
| P3 | Close and reopen the view, change display mode, switch chats, and restart the server. | Resume retrieves the same committed revision and position. No duplicate move follows a lost response and retry. |
| P4 | User A creates a friend game; B joins, then both play. | Correct White/Black orientation and seat controls; join and reply refresh without Reload; a third account cannot view or move. |
| P5 | Finish a short test game and repeat the primary flow on intended desktop and actual mobile clients. | Correct terminal result, no further moves, usable touch targets, keyboard focus and viewport. Record real native-device results separately from browser resizing. |

| ID | Negative scenario | Required result |
|---|---|---|
| N1 | Submit an illegal move, stale revision and same command ID with changed input. | No invalid commit; useful rejection and recoverable UI. Unknown transport failures preserve the original receipt. |
| N2 | Use another user's match, a website session token, an expired token, and a token for the wrong resource. | Seat/token rejection before game mutation; no private save or credentials returned. |
| N3 | Race two moves, reuse/expire an invitation, interrupt a save, and open an incompatible saved version. | One winning commit/seat, atomic rollback, safe identical retry, and an explicit version message instead of an endless retry loop. |

Automated checks already exercise the corresponding local engine, PostgreSQL, HTTP and browser paths. They do not substitute for recording ChatGPT's real prompts, CSP, client lifetime and provider authentication. Run the [environment matrix](research/chatgpt-plugin-environment.md#host-experiment-matrix) for those host-specific questions.

## Tester invitation draft

> King Down is ready for a small private play test. Install the private connection provided to you, sign in with your test account, and open King Down. Try a solo game, close and resume it, then join a friend's invitation. Please report any confusing move choice, lost position, sign-in loop or board that stops responding. Include the time, device/client and the steps immediately before the problem. Do not send passwords, access tokens or unrelated conversation history.

Send only after the private connection and recovery checks pass. Choose a small invited group and ask them to play without coaching through the UI. Observe launch-to-first-move, confusing choices, resume success and friend joining. Compare the same tasks with accessible entries in the [competitor register](research/chatgpt-chess-market.md); report observed behavior, not inferred user counts. No invitations have been sent.

## Issue report template

```text
What I expected:
What happened:
Steps to reproduce:
Time and timezone:
Device, OS, ChatGPT client and version:
Launch route and display mode:
Error shown:
Match ID, command ID and last confirmed revision, if supplied by support:
Sanitized screenshot or short recording:
```

Engineering adds the server/UI build, engine fingerprint, request timing and error code from the relevant test receipt. Do not request surrounding chat, access/refresh tokens, database URLs or full account exports. IDs and game positions can still identify private games; share them only in the intended support channel.

## Data and release decisions

The implementation stores account UUIDs, seats, initial setup/rules, positions, move history, accepted-command receipts and hashed invitations. It does not copy email addresses or the surrounding chat into match storage. The identity provider still manages its account data. Current match rows remain until deletion; deleting either participant's Supabase account cascades the shared match, its commands and invitation. Expired invitation tokens stop working but are not a general retention policy. Describe these behaviors accurately before external testing, especially the effect on the other player.

Before publishing support/privacy/terms pages, the owner must supply the responsible entity, support contact and chosen retention policy. The current code and database/provider logs must be reconciled with that policy; a draft must not promise deletion, backup expiry or telemetry behavior that has not been configured. Prepare a dedicated reviewer account with sample data and a login path that does not require approval, email/SMS codes, magic links or access to a private network. No reviewer credentials are committed here.

The release packet needs the five positive and three negative results above, a concise video showing start/play/resume/friend join, release notes, stable HTTPS MCP/UI origins, domain verification, a current successful tool scan, website/support/privacy/terms URLs, and verified intended desktop/mobile behavior. Preserve published tool contracts during updates and version a breaking UI resource. A private preparation preview is not ready for public submission. [Submission](https://developers.openai.com/plugins/deploy/submission), [review requirements](https://developers.openai.com/plugins/deploy/app-review)

## Support inquiry draft

> We are preparing King Down, an interactive chess variant using MCP Apps and direct app-only tool calls. Our intended launch is a playable board; surrounding chat is optional. Please confirm the supported fullscreen/sidebar launch routes for our account and target clients, and the process for changing an MCP path while preserving its origin. We will include the plugin ID, client/build, tool scan, sanitized reproduction and exact observed error when available.

Send a concrete reproduction after an actual host failure, using the plugin ID and the review/support channel shown for that plugin. No support-response SLA or review date is promised. Review the official [plugin changelog](https://developers.openai.com/plugins/changelog) before each release, rerun affected flows, and preserve their receipts with the release artifact.
