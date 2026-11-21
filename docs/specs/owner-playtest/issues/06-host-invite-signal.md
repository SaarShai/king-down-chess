# Cancel late host invite requests

Status: ready-for-agent
Type: task
Severity: Medium

## Problem

Repair r11 gives each game controller one cancel signal. Stop, sign-out and a session change abort it. The client checks it after the token read and at the last point before fetch. The host's own online calls do not have a signal of this kind. They use the shared `api` client (`src/interface/people/host/index.ts:88` at `c76f0493f`):

- `invite`, `inviteBack` and `createLink` (`api.create` at lines 252, 257 and 262; `api.invite` for the link at line 264)
- `join` (`api.redeem`, line 270)
- `copyLink` (`api.invite`, line 278)
- `acceptInvite` (`api.redeem`, line 284)
- `declineInvite` (`api.declineInvite`, line 291)

The same `api` client also calls `settings` (131), `invitations` (178), `record` (178, 218), `game` (188), `handle` (213, 214), `friends` (228, 236, 242) and `preview` (268). No call gives a signal.

The `api` token callback compares the token's user with the current `session` only. It does not keep the session, session key or epoch that started the call. Two waits come before each fetch: the token read and the cache-safety check (`withPrivateCachePolicy`, `src/online/client.ts:36-41`). The host calls do not retry; only `command` retries.

- If the held token read returns Bob's session after the host sets Bob's session, Alice's invite or join can send Bob's token. The focused tests reproduce this for `invite`, `inviteBack`, `createLink`, `join` and `acceptInvite`; copy and decline do the same. Each sends one request with `Authorization: Bearer bob`. Bob's session event alone clears the host session. In that control case, the call sends no request.
- A sign-out, or a switch to Bob, during the cache-safety check does not stop the request. It goes with Alice's token. The tests reproduce this for all seven host actions.
- Sign-out has an earlier wait. `host/index.ts:389-397` stops the game controller at once, but waits for the auth client before `reset`. A host request in that wait goes with Alice's token.
- `signIn()` can find a new session without a session event (`host/index.ts:120`): Bob, or a new session for Alice. The tests show one request with the new token in each case. The user ID alone is not a session boundary. `sessionKey` (`src/account/session.ts:7-13`) is.

Late replies also act after the account changes:

- The `seatReply` checks stop a wrong page change. They cannot stop the request. They also do not stop every late king write: `bindSeatKing` runs before the session check (`host/index.ts:155`, `:157`). The tests show an Alice king write after sign-out and after a switch to Bob. The call then gives `ObsoleteAction`.
- `copyLink` writes the clipboard after the reply and a module import (`:278-279`). `declineInvite` changes the invite list, shows "Invite declined." and starts a refresh (`:291-295`). Neither checks the session.
- `refresh` waits for the lists, then starts game reads (`:188`) before its epoch check (`:189`). `saveName` sets `profile` (`:214`); `known` and `find` set `cachedKnown` (`:229`, `:236`).

The server can then hold a game or an invite that the page does not show.

Two other clients have the same token and cache waits: `accountSafety` (`host/index.ts:98`; its report, block, relate and record calls at `:105-108`) and deletion (`:366-367`). A repair of the shared `api` client only does not cover them. Say in the repair whether they are in scope.

Main (`b53b99760`) has the same token callback (`:84-87`) and the same invite, join, copy and decline paths (`:222-258`), so PR 367 does not add this fault. Both re-reviews of r11 name it as an item that does not block (`runs/launch/release/review367r2/checks.md`, `runs/launch/release/review367s2/review367s2.md`).

The lead sets the severity to Medium: "An invite or join sent with the wrong account's token is a cross-account action. It does not block PR 367 or build 6, because main has the same path."

Evidence: an independent check of this ticket (`runs/launch/owner-playtest/followups/verify06.md`) runs 45 focused tests on the current code, all pass (`verify06.test.ts`, `verify06-tests-final.log`, `verify06-evidence.json`). The tests use fake sessions and an injected fetch. They show which request leaves the client, not what the live server does.

## Repair

- Bind each host call to the account session that starts it. Capture its signal before the first wait. Abort the signal at sign-out entry, before the first wait. Also abort it in `reset`, in the session callback, and when `signIn()` finds a session change. Compare both the user ID and `sessionKey`. Keep the signal when a token refresh keeps the same user and session key. Give a new session a new signal.
- Pass the signal to every shared `api` call in the list. The client already checks a signal after the token read and before fetch, and gives it to `fetch`.
- Make the host token callback refuse a token for another session than the one that starts the call.
- Bind the whole `refresh` to its starting session, including the later game reads.
- Check the captured session and signal before each reply effect. Pass the check and the signal to `bindSeatKing`. Check again after the clipboard module import and before the clipboard write.
- A cancelled host call throws `ObsoleteAction`. Update the copy and decline callers in `src/interface/play/main.ts` (`:322`, `:360`) and the refresh catch (`host/index.ts:198`) to ignore it. A cancelled call gives no notice, navigation or sheet.

## Checks

- List every `api.` call in `host/index.ts`. Each one has the signal, or the ticket gives a reason why it does not need one. Do the same for the `accountSafety` and deletion clients, or record why they stay out of scope.
- First, failing tests from `verify06.test.ts`: the switch during the token read, the switch and sign-out during the cache-safety check, sign-out while its auth call waits, and a session change that `signIn()` finds with no event.
- For each call in the list: a sign-out, or a switch to Bob, during each wait gives zero requests to the server.
- A new session for the same user cancels the call. A token refresh that keeps the same session key does not.
- Hold the second `api.invite` in the create-link fallback, the king-write lock and the clipboard module import. A cancelled call gives no write, notice or navigation.
- The normal paths still pass: send a link, invite by name, invite back, join by link, copy a link, accept and decline an invite.
- `npm test`, `npm run test:docs`, `npm run typecheck` and `npm run build` pass.
