# Plan comparison: what this plan adopts, rejects and merges

Date: 2026-10-18. Two plans were made from the same brief, without sight of each other:

- **The independent plan.** One agent at extra-high effort wrote a map, a spec, an inventory of 79 work units and 16 tickets. It is the base of [the spec](spec.md), [the inventory](inventory.md), [the map](map.md) and tickets 01–04.
- **The session plan.** This session ran seven survey lanes and a critic (the reports are in [docs/research/web-adaptation-2026-10-18](../../research/web-adaptation-2026-10-18/README.md)), then wrote its own draft before it read the independent plan.

The earlier session's answer ("a normal page around the same game and the same server, plus a sign-in page") is right about the large shared base. Both plans find that it understates five things: the web API is not served, the offline worker can cache private replies, the web already has a sign-in, the plugin screens import plugin app state, and most phone fixes sit in plugin CSS.

## Where the plans agree

- One account, one game pool and one server for both surfaces. No new backend, account system or game tables.
- The website API (the existing handler) is served from the same server function as the ChatGPT app.
- The offline worker must stop caching private requests before the first API call.
- The local app keeps offline play, two players on one device, lessons, the Workshop, review, Today's army and local game links.
- Creates need a stable start command ID; the old web watcher must not be used as it is.
- The final PR 61 merge is the base. A moving branch is not.
- Email, push, chat, clocks, guests and an unlock economy stay out.

## Adopted from the independent plan

| Item | Why |
|---|---|
| A separate account-play page (`/play/`, `/g/<id>`, `/j/<token>`) that uses the plugin's account screens, with two small boundaries (game client, page host) | One copy of the account UI. A full page change isolates the engine's global rule state. The session draft instead built a web online controller beside the plugin screens; that makes a second implementation of each screen. |
| The 97 user stories and the 79-row inventory | More complete than the session draft. |
| Test seams T1–T5, with the HTTP boundary and a disposable database as the main seam | The highest existing seam; matches the session's checks lane. |
| Per-tab session storage for drafts and pending commands, keyed by account, game and turn base | One authority per value; no new lock service. |
| An explicit "new code" action for invites; no rotation as a side effect of Create | Closes a duplicate-invite gap that the session draft missed. |
| Eight vertical phases, each a complete user path | Matches the owner's rule to integrate small complete steps (MVP speed). The session draft had a "dark foundation" phase with no user path. |
| Tickets for engine compatibility, release evidence, the test gate and the release route | The session draft folded these into one task; separate tickets are sharper. |
| The terminal approval ticket | One clear build gate. |

## Adopted from the session plan

| Item | Why |
|---|---|
| The shared-seam extraction starts only after PR 61 merges and after the approved later-update branches land or are parked, with one writer for the plugin app, client and screens | `claude/od-home`, `claude/od-board`, `claude/od-look`, `taste/b2-row-preview` and `taste/c5-seat-reveal` change the same screens. Two writers make merge faults. |
| A web baseline after the merge: the full web suite and a render compare against pre-merge main, plus a list of the visible shared changes that reach the web on merge | Coordinate hiding below 8 CSS px, the 5-second idle stop, the Select words, the growing context row and coin faces change the live site with no web work. The owner sees them before a deploy. Merged into ticket 08. |
| Research tickets for one account across surfaces and for the hosting routes | Sharp questions that code and docs can answer before the grilling. |
| A question about signed-out play | Under the shared-page architecture, new setup, cards and Classic need sign-in. The owner decides if that is acceptable for the first release (ticket 09). |
| The grouped owner questions from the lanes (Play now level, No power in old modes, rating rule, local results, the samples still open) | The independent plan had no full list. Merged into ticket 12. |
| The fault list (below) | The independent plan did not name the release-packet fault. |

## Corrected or rejected

| Claim | Decision |
|---|---|
| Independent plan: the direct card use (arm a coin on tap) "waits unless the accepted final merge includes it" | Corrected. Approved code exists on `claude/od-board` (`b3b52a47`): direct arming, card faces and Collection costs. It is a selective port, not new work. The owner picks web inclusion in ticket 12. |
| Independent plan: per-account budgets apply in phase 6 (matching) | Corrected. A signed-in website user can call any served write route. Budgets apply from the first write route (phase 3). |
| Independent plan: research tickets resolved during charting | Kept as research. The four answers are source facts, not owner choices. Their answers stand until a reviewer refutes one. |
| Session plan: a web online controller on the old online client | Rejected (see above). The old `watch()` is deleted when the shared poll takes over. |
| Session plan: local ports of setup, cards and Classic as phase 2 | Not picked for the first release. It stays option 2 in ticket 09. If the owner picks it, local card links must carry the dealt hands (critic item CRIT-07). |
| Session plan: one hall for local and account games | Not picked. Separate pages with clear links are smaller and keep one controller per page. Option 2 in ticket 09. |
| Lane claim: Play now must keep the saved level (a fault) | Rejected as a fault. The records conflict (critic CRIT-21). It is an owner question in ticket 12. |
| Lane claim: a new picture route is needed | Rejected. The profile PATCH already takes the icon (critic CRIT-22). Only the handle check is missing. |

## Faults found (one right fix; no taste call)

1. **PR 61 release packet, outbox retention.** The cron and runbook text say that unsent outbox rows stay. The code (`src/online/jobs.ts`), the privacy page and the database test delete them after 30 days. The documents must match the code and the privacy page. Fixed on the PR 61 branch (`5e5b7fd8`, 2026-10-18); the fix reaches main with PR 61.
2. **Offline worker cache** (`public/sw.js`). It caches every same-origin GET with no account key and ignores the query. It is latent today (no API call), and it blocks any API use. Phase 1 fixes it.
3. **Old web watcher** (`src/online/client.ts` `watch()`). It stops in the setup state and drops equal revisions. It is unused today. The shared poll replaces it; delete it then. (Done: ticket 57 deleted `watch()`.)

## What neither plan settles

The route prototype and the browser sample (tickets 13 and 14), the test gate, the release route and the spec approval (tickets 16–18), real-device results, and the live facts that only a test account or an approved read-only report can prove. Tickets 09, 10, 11, 12 and 15 are decided by delegation (owner, 2026-10-18). The [map](map.md) lists the remaining fog.
