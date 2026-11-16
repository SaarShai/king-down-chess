# Cancel late host invite requests

Status: ready-for-agent
Type: task
Severity: Medium

## Problem

Repair r11 gives each game controller one cancel signal. Stop, sign-out and a session change abort it. The client checks it after the token read and at the last point before fetch. The host's own online calls do not have a signal of this kind. They use the shared `api` client (`src/interface/people/host/index.ts:88` at `c76f0493f`):

- `invite`, `inviteBack` and `createLink` (`api.create`, and `api.invite` for the link), lines 250 to 267
- `join` (`api.redeem`), line 270
- `copyLink` (`api.invite`), line 277
- `acceptInvite` (`api.redeem`), line 282
- `declineInvite` (`api.declineInvite`), line 290

The `api` token callback compares the token's user with the current `session` only. It does not compare the session that started the call. Two waits come before each fetch: the token read and the cache-safety check (`withPrivateCachePolicy` in `src/online/client.ts`).

- A switch to Bob during Alice's token read gives Bob's token. Alice's invite or join can then go to the server as Bob. (This comes from code reading. No test reproduces it yet.)
- A sign-out or a switch during the cache-safety check does not stop the request. It goes with Alice's token.

The `seatReply` checks after the reply stop a wrong page change and a wrong king write, but they cannot stop the request. `declineInvite` and `copyLink` have no check after the reply, so a late reply still gives the toast or the clipboard write. The server can then hold a game or an invite that the page does not show.

The same `api` client also makes the account calls: `settings` (line 131), `record` (178, 218), `game` (188), `handle` (213, 214), `friends` (228 to 242) and `preview` (268).

Main (`b53b99760`) has the same request paths, so PR 367 does not add this fault. Both re-reviews of r11 name it as an item that does not block (`runs/launch/release/review367r2/checks.md`, `runs/launch/release/review367s2/review367s2.md`).

The lead sets the severity to Medium: "An invite or join sent with the wrong account's token is a cross-account action. It does not block PR 367 or build 6, because main has the same path."

## Repair

- Bind each host call to the session that starts it: one cancel signal for each account session. Abort it on sign-out and on any session change (the host `reset` and the session callback).
- Pass the signal to the host's create, invite, redeem, decline and copy-link calls, and to the account calls where a late reply can change the page. The client already checks a signal after the token read and before fetch, and gives it to `fetch`.
- Make the host token callback refuse a token for a different session than the one that starts the call.
- A cancelled host call ends as the obsolete-action error that callers ignore: no notice, no navigation, no sheet.

## Checks

- List every `api.` call in `host/index.ts`. Each one has the signal, or the ticket gives a reason why it does not need one.
- First a failing test for the switch during the token read: Alice's invite or join must not go to the server with Bob's token.
- For each call in the list: a sign-out, or a switch to Bob, during the token read and during the cache-safety check gives zero requests to the server.
- The normal paths still pass: send a link, invite by name, invite back, join by link, copy a link, accept and decline an invite.
- `npm test`, `npm run test:docs`, `npm run typecheck` and `npm run build` pass.
