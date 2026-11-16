# Cancel late host invite requests

Status: ready-for-agent
Type: task
Severity: Low

## Problem

Repair r11 gives each game controller one cancel signal. Stop, sign-out and a session change abort it. The client checks it after the token read and at the last point before fetch. The host's own online calls do not have a signal of this kind. They use the shared `api` client (`src/interface/people/host/index.ts:88` at `c76f0493f`):

- `invite`, `inviteBack` and `createLink` (`api.create`, and `api.invite` for the link), lines 250 to 267
- `join` (`api.redeem`), line 270
- `copyLink` (`api.invite`), line 277
- `acceptInvite` (`api.redeem`), line 282
- `declineInvite` (`api.declineInvite`), line 290

The `api` token callback compares the token's user with the current `session` only. It does not compare the session that started the call. Two waits come before each fetch: the token read and the cache-safety check (`withPrivateCachePolicy` in `src/online/client.ts`).

- A switch to Bob during Alice's token read gives Bob's token. Alice's invite or join can then go to the server as Bob.
- A sign-out or a switch during the cache-safety check does not stop the request. It goes with Alice's token.

The `seatReply` checks after the reply stop a wrong page change and a wrong king write, but they cannot stop the request. The server can then hold a game or an invite that the page does not show.

Main (`b53b99760`) has the same request paths, so PR 367 does not add this fault. Both re-reviews of r11 name it as a Low item that does not block (`runs/launch/release/review367r2/checks.md`, `runs/launch/release/review367s2/review367s2.md`).

## Repair

- Bind each host call to the session that starts it: one cancel signal for each account session. Abort it on sign-out and on any session change (the host `reset` and the session callback).
- Pass the signal to the host's create, invite, redeem, decline and copy-link calls. The client already checks a signal after the token read and before fetch, and gives it to `fetch`.
- Make the host token callback refuse a token for a different session than the one that starts the call.
- A cancelled host call ends as the obsolete-action error that callers ignore: no notice, no navigation, no sheet.

## Checks

- For each call in the list: a sign-out, or a switch to Bob, during the token read and during the cache-safety check gives zero requests to the server.
- The normal paths still pass: send a link, invite by name, invite back, join by link, copy a link, accept and decline an invite.
- `npm test`, `npm run test:docs`, `npm run typecheck` and `npm run build` pass.
