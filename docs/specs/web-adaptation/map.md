# Web adaptation map

Type: map
Status: open
Labels: wayfinder:map

## Destination

An owner-approved spec, [Web app adaptation spec](spec.md), with its build order: kingdown.dev gets the account play that the ChatGPT app built (setup, cards, friends, open games, the account board, results, profile, Collection) through the same account UI and the same service, and it keeps local play, saves, lessons and the Workshop complete. The map ends when [Approve the adaptation spec and build order](issues/18-approve-spec.md) is resolved.

## Notes

- Read [the spec](spec.md) for the product and the phases, [the inventory](inventory.md) for paths and evidence (81 work units), and [the comparison](comparison.md) for what this plan adopted, rejected and merged from two independent plans.
- The survey reports are in [docs/research/web-adaptation-2026-10-18](../../research/web-adaptation-2026-10-18/README.md). Research answers go there too (this repo keeps research notes in `docs/research/`, so research findings do not go on throwaway branches).
- Skills for each session on this map: wayfinder (the map), to-spec (the spec), ponytail (the smallest complete change). Grilling tickets use the grilling and domain-modeling skills with the owner. Write in ASD-STE100.
- Base: `origin/main` `04b7af87`; release candidate `442c5eb3` (PR 61, open; 499 commits ahead). The final PR 61 merge replaces this base before any build ([ticket 08](issues/08-release-evidence.md)). See the base correction in [the inventory](inventory.md#base-correction).
- One writer at a time for the plugin app, client and screens. The shared-seam extraction waits for the PR 61 merge and for the approved later-update branches (`claude/od-home`, `claude/od-board`, `claude/od-look`, `taste/b2-row-preview`, `taste/c5-seat-reveal`) to land or be parked.
- Ticket lines: `Type:`, `Status:` (`open`, `claimed`, `resolved`) and `Blocked by:`. The frontier is the open, unclaimed tickets whose blockers are all resolved; scan `issues/` by number. Blocking edges live only in the ticket files.
- A grilling ticket holds a rule, options and a recommended pick. The owner delegated this map's decisions, samples and spec approval to the agent on 2026-10-18 ("regarding \"my decisions\" - please use your best judgement. i trust you to make the decisions."). Each delegated decision gets independent reviews and says "decided by delegation (owner, 2026-10-18)". Deploys, runs, rule changes, spending and feature-branch merges to main still need his word.
- Planning only: no build, run, deploy or visual change follows from this map without the owner's word.

## Decisions so far

- [Establish the code baseline and check the earlier answer](issues/01-baseline.md): the shared base is large, but the web API is not served, the worker can cache private replies, and the plugin screens need a client boundary.
- [Find the smallest shared client boundary](issues/02-shared-client.md): share the account state and screens through two small boundaries (game client, page host); keep the local app on its own page.
- [Complete the web API contract](issues/03-http-contract.md): extend the existing HTTP handler and services; stable start IDs, an explicit new-invite action and per-account budgets close the gaps.
- [Find the reusable test seams](issues/04-test-reuse.md): the HTTP boundary with real services and a disposable database is the main seam; reuse the browser fixtures with a top-level page driver.
- [Prove one account across the web and ChatGPT](issues/05-one-account.md): one Supabase user ID owns both surfaces if both use the same project and the person signs in to the same user; no merge of existing users; the website verifier has no current-status check.
- [Map the hosting routes and the worker scope](issues/06-hosting-routes.md): four route rules and an API dispatch in the one output, base `/` for deep routes, one shared admission gate and budgets, a public-file worker allowlist and a cache-policy handshake before private calls.
- [Check browser replay against stored engines](issues/07-engine-compatibility.md): the browser drafts with the current engine; add an engine stamp to the View and allow local drafts only for supported stamps; each active engine needs a tested continuation before release.
- [Choose the web play boundary](issues/09-web-play.md): a separate account page with the plugin's account screens; local play stays as it is; cards, Classic and friend games need sign-in in the first release.
- [Choose sign-in and account continuity](issues/10-account-entry.md): the existing website sign-in; one fixed callback with a per-tab flow record; retries bound to the user ID; writes check the current user; a pending deletion blocks new games, rematches included.
- [Choose save and settings ownership](issues/11-save-ownership.md): local save unchanged; server owns account games and settings; per-tab drafts keyed by user, game, turn base and engine stamp.
- [Choose the shipped picks and later work](issues/12-scope-picks.md): all built work at the PR 61 merge; later plugin branches only through the shared UI; Play now stays Beginner; rating rule as built; D6 out.
- [Prototype browser routes and invite return](issues/13-routes.md): account routes with browser history; a URL only reads; Join and the sign-in callback replace the URL; one `/play/` callback with a per-tab flow record; the invite token moves to the fragment (`/j#<token>`, amends ticket 06); prototype on branch `prototype/web-account-routes`.
- [Approve a browser sample from the game UI](issues/14-visual-sample.md): the actual plugin screens in a page host; existing sheets and columns; 48 px DOM controls; board squares an accepted exception (44 px on the main phone); full target words with page scroll; "Play online" on the local home and "Play on this device" on the account page; sample on branch `prototype/web-account-sample`.
- [Choose the public play and alert scope](issues/15-public-safety.md): alerts and chat off; one budget across surfaces; email support with an operator intake step instead of an in-app Report; a shared notice view; these gate public random matching.

## Not yet specified

- **Signed-out play after the first release.** If the owner keeps local play as it is (ticket 09), a later question is whether the shared account UI can also drive local games through a local game-client adapter (one UI for both). This needs the View to be built in the browser from the engine. Revisit after phase 3 proves the boundary.
- **Browser fit problems.** The route and visual prototypes can show content-fit problems that the iframe does not have. The remedies are not known until the sample exists. Keep them within the chosen materials.
- **Old games and data states.** The final engine and release evidence can show old-game cases that the fixtures lack. Make a precise ticket only when such a case exists.
- **Integrated failure combinations.** Sign-in return, page history, worker upgrade and pending writes can fail together in ways that no single check shows. Each concrete failure gets a bounded repair ticket.
- **Later plugin changes.** Plugin work that lands after the PR 61 merge enters through the same code and pick review, not a promise to copy all future work.

## Out of scope

- New rules, balance work, new pieces, cards or powers, and compute runs.
- A replacement of local play, a new backend, a new account system, a second copy of the account UI, or an iframe host simulation.
- Other chat platforms, ChatGPT submission work and reviewer-only onboarding.
- New themes, new art campaigns, and taste proposals that no owner pick covers.
- Live clocks, guests, chat, email or push alerts, leaderboards, an unlock economy, online Workshop designs and public replay.
- Builds, tests, deploys and live account or database work as part of this map.
