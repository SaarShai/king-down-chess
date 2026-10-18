# Web adaptation survey, 2026-10-18

Source reviews for the [web adaptation plan](../../specs/web-adaptation/map.md). Each lane compares the plugin release candidate (`claude/release-candidate`, PR 61) with the web app on main (`38a6bbff`). Each item has a kind: (a) shared on merge, (b) plugin code to reuse with changes, (c) web work with no plugin equivalent, (d) plugin only, (e) the web already has it.

| Report | Prefix | Area |
|---|---|---|
| [lane-screens.md](lane-screens.md) | SC | Screens and user flows |
| [lane-client.md](lane-client.md) | CLIENT | Client state, queue, polls and server calls |
| [lane-server.md](lane-server.md) | SRV | Server, sign-in and hosting |
| [lane-look.md](lane-look.md) | LOOK | Look, phone, zoom, touch and accessibility fixes |
| [lane-shared.md](lane-shared.md) | SH | Shared game code changes |
| [lane-checks.md](lane-checks.md) | CHECKS | Tests, browser checks, device checks and CI |
| [lane-decisions.md](lane-decisions.md) | DEC | Owner decisions, deferred work and lessons |
| [critic.md](critic.md) | CRIT | Missed items, corrections and contradictions across the lanes |

Research answers: [research-identity.md](research-identity.md) (one account across surfaces), [research-routes.md](research-routes.md) (hosting routes and the worker), [research-engines.md](research-engines.md) (stored engines and browser replay).

Decision reviews: [decisions-draft.md](decisions-draft.md) (the draft), [decision-review-security.md](decision-review-security.md), [decision-review-product.md](decision-review-product.md), [decision-review-scope.md](decision-review-scope.md). The final decisions are in tickets 09, 10, 11, 12 and 15.

Base note: these reports call `38a6bbff` "main". That local ref is stale; `origin/main` is `04b7af87`. The web files they cite are the same at both commits, and every release-candidate claim holds. See the base correction in [the inventory](../../specs/web-adaptation/inventory.md#base-correction).

Limits: these are source reviews. No test, browser check, sign-in or live read ran. A claim marked "unverified" was not checked.
