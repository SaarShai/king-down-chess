# Online friend invitations

Status: needs-info. The owner must approve this spec and the rendered samples before the build.
Source: `de2a724b`, branch `staging/friend-invites`.

## Goal

A player sets up an online game and sends an invitation to one friend.
The friend can accept when they next open King Down.
Two players have at most five unfinished online games together.
A sender has at most two open named invitations to the same friend.
This change removes the visible same-device match option.

This folder holds a spec and static samples only. It changes no product code.
Use `README.md` as this feature's spec, as the owner requests.

## The owner's words, 2026-10-26

The following quotes stay verbatim.

1. "remove the option of 'same device' match. we don't need this."
2. "'a friend' should now be to challenge an online 'friend' to a match by setting up the match and sending the invite to that friend (whether they are online or not)."
3. "players cannot have more than 5 concurrent online multiplayer games with the same friend. if they try to invite a friend to a sixth match, they receive a notice to finish one of the existing games. friends cannot send more invitations to a match to a friend when they already sent 2 invitations and that friend has not accepted any of them."

## Current behaviour: checked in code

| Path | Current behaviour |
| --- | --- |
| `index.html`, `src/new-game.ts` | A friend selects Mode `two`. `playersOf` gives two humans. This is a local game. |
| `src/main.ts`, `src/new-game.ts` | The local save keeps player sides. The saved setup can contain Mode `two`. The URL can set both players to human. |
| `src/account-game/*`, `src/plugin/screens/friend.ts` | The website and ChatGPT app share the account game screens. A friend game waits for a code join. |
| `src/match/service.ts`, `invite`, `preview`, `join` | Each invite call replaces the game's invitation. It makes a link token and a six-character code. `FRIEND_CODE_DAYS` is seven. No recipient is named. |
| `src/match/store.ts`, `mayJoin` | A block in either direction prevents a join. The current check reads the creator's `challenge_from`. |
| `src/online/accounts.ts`, `who`, `relations` | A handle, shared game or user ID identifies a player. The account exposes its own follows and blocks. There is no friend picker API. |
| `src/match/store.ts`, `inbox` | Your games lists seated players' active games. A named recipient needs an invitation row before they take a seat. |
| `src/api/http.ts` | Web creation calls create, then invite. These are separate transactions. |
| `src/plugin/server.ts` | The app creates a game, then calls `kingdown_invite`. `kingdown_join` has an invitation preview flag. `kingdown_preview` is a move preview; do not reuse it for invites. |
| `supabase/migrations/0006_games.sql` | `game_invites` stores hashes, a game, a seat, a creator, expiry and use fields. `0009` adds code-try limits. `0021_history_draw.sql` is the latest migration. |

The literal `players=human,human` fixture occurs in `tools/verify-their-turn.mjs`
and `tools/lib/card-detail-check.mjs`. The latter serves the card-detail browser checks.
Keep these fixtures. Also check selectors that use `#mode-two`, saved setups and local rematch paths.

## Decisions

- **P1 — pick, owner may change.** Remove the same-device choice. An old save with two humans still loads and finishes. No screen starts another local two-human game. Keep the URL fixture for automated checks, with no visible link.
- **P2 — pick, owner may change.** A friend in New game opens online friend setup. If the player is signed out, sign-in comes first. Return to this setup after sign-in. A missing handle uses the existing handle step.
- **P3 — pick, owner may change.** Name one friend from recent opponents, followed players or an exact handle. Their Your games shows Accept and Decline, even if they are offline at send time. The invitation stays until acceptance, decline, sender cancellation or seven-day expiry. A shared link opens that invitation. Only the named friend can accept. Apply blocks and the friend's challenge setting.
- **P4 — pick, owner may change.** Offer Share a link for a person with no account. The first signed-in player with a handle who accepts takes the seat. Each sender has at most two open link invitations. The alternative is named invitations only. The samples show both choices.
- **P5 — pick, owner may change.** Count `setup` and `playing` games between the pair, in either direction, of any online multiplayer kind. Include rematches. Check named send, all acceptance paths and rematch. At five, refuse the write and show the specified notice. An invitation that fails acceptance stays open.
- **P6 — pick, owner may change.** Count open named invitations from this sender to this friend. At two, refuse another. Acceptance, decline, sender cancellation or expiry frees one slot. The count is directional. An acceptance frees only its own slot; it does not reset the count.
- **P7 — pick, owner may change.** Enforce limits and write state in one server transaction. Add migration `0022_friend_invites.sql`, with a recipient, decline state and count indexes. The owner must approve a migration run on staging or production.

If the owner selects named invites only, remove new open-link creation from both hosts.
Keep Share for named invitations. Keep old open codes valid until their current expiry.

## Send and accept flow

1. Open New game, then A friend. Do not replace or end the saved local game.
2. Use the existing online setup controls. Friend games keep the current Casual policy and three-day move time. Do not add a time selector.
3. Choose a friend. Recent opponents appear first. Followed players appear next. Remove duplicates by user ID. Do not show online presence as a condition for sending.
4. An exact handle search shows the current handle and portrait. Select that result. Keep the resolved user ID through send. Do not guess a similar handle or select a renamed account by old text.
5. Show the chosen handle and game summary. Send invitation is the write action. Back keeps the draft. A failed send keeps all choices.
6. In one transaction, create the waiting game and its invitation. A retry with the same command ID returns the same game. A refused send leaves no new waiting game.
7. Store the invitation in the database. Use the existing list refresh; add no separate poll. Show Invitation to rowan in the sender's Your games. Show Invitation from mira in rowan's Your games. These are fake names in the samples.
8. Accept takes the seat, closes the invitation and opens the existing seat setup or game. Decline closes the invitation and the waiting game without a result. Cancel does the same for the sender. A repeated action returns the current state.

The sender can share the same named invitation as a reminder. Sharing does not send a second invitation, change its recipient or extend its expiry. A screen read never creates or renews a code.
A remount that lacks the raw code offers an explicit Make a new code action. Rotation changes the existing invite ID, as today. It keeps the recipient, original expiry and one pending slot. Old tokens and cached Share handlers stop working.
After decline, cancellation or expiry, use a new game for a new invitation. Do not reopen the closed game.

## Counts and transaction rules

- **Pair count:** count distinct games with the two non-null human user IDs and status `setup` or `playing`. Exclude waiting games, solo games, finished games and aborted games. Use all rows, not the capped inbox page or client data.
- **Named pending count:** `created_by = sender`, `recipient_id = friend`, state `open`, expiry after the database time, and game status `waiting`.
- **Open-link count:** the same predicate with `recipient_id is null`, across all games from this sender.
- Reverse named invitations have a separate pending count. All games in either direction share the pair count. A rematch offer is not a named invitation; it uses the pair check on offer and acceptance.
- An unaccepted invitation does not reserve a game slot. Two invitations can compete for one remaining game slot. One accepts; the other stays open with the five-game notice.
- On named send, check permission, pair count, then pending count. At both limits, show the pair notice first. On acceptance, check recipient and permission before the pair count.
- Random acceptance and Find must use the same pair check. Find skips a pair at the cap and searches another candidate. It must not select the same refused candidate forever.
- Keep existing games if an old pair already exceeds five. Show the actual count for that pair. Refuse another until fewer than five remain. Keep old pending invitations; apply the cap to the next new send.

Use transaction-scoped advisory locks for the affected account IDs, in sorted order.
A named send, join or rematch locks both people. Open-link creation locks the sender.
Take these locks before the game and invitation row locks. Re-read the rows and counts after the locks.
All paths that add a human seat or create a paired game use the same lock rule.
Keep Find's existing global search lock first; select a candidate, lock its accounts, then lock and recheck its game.
Use this order in account permission and deletion writes that overlap invitation writes.
Do not hold these locks while the engine builds a position or while a network call runs.

Acceptance and decline lock the same game and invitation. Only one terminal action wins.
Use database time after the locks for expiry. Do not rely on the sweep to free a slot.
Return an existing successful receipt before a new limit check, so a retry does not fail at the cap.
These rules need real database race tests from separate connections.

## Data model and migration sketch

This is a sketch. Do not add or run a migration in this task.

| Item | Proposed change |
| --- | --- |
| `game_invites.recipient_id` | Nullable UUID, foreign key to `auth.users`, `on delete cascade`. Null means an open link. Never use `on delete set null`: a deleted recipient must not turn a named invite into an open invite. |
| `game_invites.state` | Text with a check: `open`, `accepted`, `declined`, `cancelled`. Expired is an effective state from `expires_at`; no scheduler is needed to enforce it. |
| `game_invites.closed_at` | Nullable timestamp for accepted, declined and cancelled states. Keep existing `used_at` and `used_by` for join retries. |
| Constraints | Recipient differs from creator. One invitation per game. Open has no use or close time. Accepted has `used_at` and `closed_at`; `used_by` can be null after account deletion. Declined and cancelled have no use time. |
| Named count index | `(created_by, recipient_id, expires_at)` where state is open and recipient is not null. |
| Recipient inbox index | `(recipient_id, created_at desc)` where state is open. |
| Open-link count index | `(created_by, expires_at)` where state is open and recipient is null. |
| Pair lookup | Check the plan for `(user_id, game_id)` on `game_players` and a status index for setup/playing games. Add only indexes that the count query needs. |

Do not put `now()` in a partial index predicate. Apply expiry in the query.
Use the existing non-redeemable token hash as `invite_id`; it changes only on explicit code rotation.
Store no raw token or code in an inbox, event log or diagnostics.
Backfill accepted from `used_at`, not `used_by`, because deletion can clear `used_by`.
Backfill unused terminal games as cancelled; all other unused rows start open with their current expiry.
Check for duplicate game rows before the unique constraint. The current service keeps one row per game.
Keep the existing runtime grants and row security. Only the service writes invitation state.

## API changes

Both transports call the same service methods and return the same error codes.
The actor comes from verified authentication, never from request fields.

| Existing path or tool | Proposed contract |
| --- | --- |
| `POST /api/games`, `kingdown_create` | Friend creation takes a recipient by user ID or exact handle, or explicit open-link intent. Resolve and validate it, then create the game and invitation in one transaction. Keep `command_id` receipts. Include recipient and invite metadata in the result. |
| `POST /api/games/:id/invite`, `kingdown_invite` | Issue for an old waiting game, or explicitly rotate its code. Preserve the stored recipient and original expiry on rotation. Omitted recipient on an old client never clears a named recipient. A legacy new invite with no recipient is open and uses the sender cap. |
| New `GET /api/friends`, `kingdown_friends` | Return distinct recent human opponents and the actor's follows, plus a bounded cursor. Exact-handle lookup returns one eligible result. No public directory, presence feed or other account's follow list. |
| Existing game list, `kingdown_games` | Add typed invitation rows for incoming and outgoing invitations. Include direction, invite ID, game ID, current handle/icon, options, expiry and state. Do not create a player seat to make a row appear. Page the invitation list so game rows cannot hide an invite. |
| `POST /api/invites/preview`, `kingdown_join` with `preview` | Keep code/token preview. For a named invite, only sender and recipient can see its private details. A stranger receives a generic unavailable result. |
| `POST /api/invites/redeem`, `kingdown_join` | Keep code/token acceptance. Also accept a named invite ID from Your games. With an ID, require that the actor is its recipient. Check limits in the seat-write transaction. |
| New `POST /api/invites/:id/decline`, `kingdown_decline_invite` | Only the named recipient can decline. Close the invitation and waiting game in one transaction. Return its terminal state on retry. |
| Existing abort command | Sender cancellation closes the invitation and waiting game in one transaction. It cannot abort an already accepted game through a stale invitation action. |
| Existing rematch, random accept and Find | Apply the shared pair check. Preserve existing command receipts and rated-game policy. |

Add typed errors `FRIEND_GAME_LIMIT`, `FRIEND_INVITE_LIMIT` and `OPEN_INVITE_LIMIT` (HTTP 409).
Include safe count and current handle fields so both hosts use the same text.
Do not include a handle or count in an unauthorized response.
Preserve `RATE_LIMITED` (429) and its retry guidance.

## Screens and exact notices

| Screen or state | Text and action |
| --- | --- |
| New game | A friend. Send an online invitation. Opens online setup. |
| Sign-in return | Sign in to invite a friend. Keep the existing sign-in method. Return to A friend. |
| Picker | Choose a friend; Recent opponents; You follow; Handle; Find player; Send invitation. Show the selected name beside the final action. |
| Empty picker | No recent opponents. No followed players. Type a handle, or share a link. The named-only option omits the link clause. |
| Lookup failure | Player not found. Check the handle. |
| Incoming row | Invitation from &lt;handle&gt;. Show game options and expiry. Accept; Decline. |
| Outgoing row | Invitation to &lt;handle&gt;. Show game options and expiry. Share; Cancel invitation. |
| Five games, sender | You have 5 games with &lt;handle&gt;. Finish one of them first. Action: View your games. |
| Five games, Accept | You have 5 games with &lt;handle&gt;. Finish one to accept this invitation. Action: View your games. Keep the invitation open. |
| Two named invitations | You sent &lt;handle&gt; 2 invitations. Wait until they accept one. Action: View invitations. Also show: A decline, cancellation or expiry frees a slot. |
| Two open links | You have 2 open link invitations. Cancel one or wait for it to end. Action: View invitations. |
| Named link | Only &lt;handle&gt; can accept this invitation. Share a link; Copy code. |
| Open link | The first player to accept takes the seat. They must sign in and choose a handle. Share a link; Copy code. |
| Expired | This invitation is past its end time. Create a new game to invite again. |
| Used or closed | This invitation is no longer open. Return to Your games. The sender can see Declined or Cancelled on a fresh action result. |
| Permission failure | You cannot invite this player now. Choose another friend. Do not reveal a block or a private setting. |
| Acceptance permission failure | This invitation is not available now. Return to Your games. |
| Offline or send failure | The invitation does not send. Check your connection and try again. Keep the draft and command ID. |

The exact five-game notices above apply at five. For an old pair above five, use the actual number.
Use current handles as text, never HTML. Long handles wrap. Keep labels on inputs.
Use live status text for results and notices. Pending writes prevent a second click.
Back returns focus to the entry control. Use the existing focus ring and 48 px account controls.
On a small phone, the picker body scrolls and its selected-player action stays visible.

## Edge cases

- **Blocks:** check both directions at send and accept. A new block hides or disables the pending invitation for the recipient. Keep the row in storage until a terminal action or expiry, so block/unblock cannot reset a sender's pending count. Sender cancellation remains available. Current games continue.
- **Challenge setting:** named invites check the recipient's setting at send and acceptance. `nobody` refuses; `follows` requires the recipient to follow the sender. The sender's own `nobody` does not prevent their explicit outgoing invitation. Open links keep the current creator-side `mayJoin` check. Recent opponents or a sender's follow do not override permission.
- **Permission changes:** a pending invitation can become unavailable. Do not expose the private reason. It can become available again before expiry if permission returns. Do not add an automatic resend.
- **Account deletion:** at actual deletion, remove sent and received invitation rows and end affected waiting games without a result in the deletion transaction. Never open a named seat to strangers. The existing grace period and active-game deletion policy stay in force.
- **Handle rename:** store the recipient by ID. Read current handles for rows and notices. A rename does not redirect the invitation. Exact search on an old reserved handle does not resolve to another person.
- **Expiry:** seven days from first send, in database time. Show a local date and time. At equality with expiry, refuse acceptance and release the count. Reads and Share never extend the date.
- **ChatGPT app:** use the shared picker, rows and notice text. Add transport/tool contracts and host metadata. Accept, decline and send are explicit player actions. Respect the existing command queue, remount recovery and composer space. Do not put tokens in model-visible game-list output.
- **Rate limits:** keep the ten short-code tries per hour and the current create/rematch budget (60 per minute). Add a shared 60-per-minute budget for friend lookup and invite writes per actor in both transports. Exact lookup is on Find player, not on every key. Reads and polling do not consume send slots. Repeated failures do not reveal private account data. These budgets supplement the two-invite cap.
- **Old codes in flight:** existing code/token hashes, recipient null and expiry remain valid. The first eligible join still wins, subject to the new pair check. Old open links count against the sender's cap; do not revoke them to force the count to two. A user over the cap can cancel or wait. Do not extend the legacy code-hash fallback's life as part of this work.
- **Old local saves:** keep the engine's human sides and old save decoder. Opening New game from such a save defaults to the computer. New game and local rematch cannot start another two-human game. The saved game stays playable until its result.
- **No online account yet:** the sender needs an account. The receiver can use an open link after account creation. There is no email lookup, address book upload, email send or push-notification work in this spec.

## Build order and approval

The [tickets](issues/) split the work into small parts. Build them in order after approval.
Tickets 03 and 04 use the same service files; run them in sequence.
The server release must include both tickets. Do not expose named send without the limits.
A migration run on staging and a migration run on production each need the owner's word.
No deployment is part of this task.

The [sample page](samples/index.html) uses the actual CSS, fonts and painted assets.
All people, games, times, codes and counts are fake. It makes no API request.
The [capture guide](samples/README.md) lists screens and checks.

## Owner choices

Approve the spec and the rendered samples before the product build.

1. Open links or named invites only? **Pick: open links**, with two open links per sender.
2. Does decline free a pending slot? **Pick: yes**, as P6 states. A new invitation can then be sent.
3. Keep old saves and the hidden test URL? **Pick: yes**, as P1 states. No visible control starts a new local two-human game.
