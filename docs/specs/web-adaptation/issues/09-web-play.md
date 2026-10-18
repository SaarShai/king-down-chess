# Choose the web play boundary

Type: grilling
Status: resolved
Blocked by: 01, 02
Parent: [Web adaptation map](../map.md)
Labels: wayfinder:grilling

## Question

How does the web add account play while it keeps offline play and the Workshop, and what does a signed-out player get?

## Rule

A new account game must not remove a working local game feature or overwrite its save.

## Part 1: where account play lives

1. Add an account-play page beside the current local app. It uses the same account screens as the plugin. Each page links to the other.
2. One hall for local and account games on one page, with both controllers.
3. Replace the current web app with the plugin app and rebuild the local features in it.
4. Add every server state directly to the local play controller.

Recommended: 1. The local app and the account app own a game in different ways. Separate page lifetimes keep one owner of the engine's global rules per page. It uses the tested account flow and keeps the local product complete. Option 2 needs both controllers in one page (the session survey's first pick); option 4 makes a second account UI.

On yes: `/play/` is the account hall, `/g/<id>` an account game, and the root stays local play. Labels and entry layout go into the browser sample. Current local play needs no account.

## Part 2: what a signed-out player gets

Under Part 1 option 1, the five-switch setup, the four-card game, Classic chess, the hidden arrangement and server computer games come with account play, so they need sign-in.

1. Keep local play as it is for the first release. New features need sign-in. Revisit a local adapter for the shared UI after phase 3 (map fog).
2. Port the setup, cards and Classic into the local New game now. This makes a second setup UI and needs local card links that carry the dealt hands (critic CRIT-07).
3. Require sign-in for all new features, with no later local version.

Recommended: 1. It is the smallest complete route and keeps one UI. The cost: a signed-out visitor does not see cards or Classic in the first release. Option 2 is the session survey's original pick; it ships sooner to guests but doubles the setup work.

## Acceptance

A guest can still play the computer, play on one device, use lessons, open a shared local position, use Today's army and open the Workshop. A signed-in player can choose an account game without replacing the local save. Only one play controller owns a page. The account game has the same rules and record in both clients.

## Evidence

Inventory rows C01, C09 and C14. `src/main.ts`, `src/new-game.ts`, `src/screen/play.ts`. The old Chess army is not the new Classic rules switch. Survey: SC-01, CLIENT-09, CRIT-10, CRIT-31.

## Answer

Decided by delegation (owner, 2026-10-18: "regarding \"my decisions\" - please use your best judgement. i trust you to make the decisions."). Three independent reviews (security, product, smallest change) checked the draft; their changes are in. Reviews: `docs/research/web-adaptation-2026-10-18/decision-review-*.md`.

- **Part 1: option 1.** A separate account-play page (`/play/`, `/g/<id>`, `/j/<token>`) with the plugin's account screens. The root stays local play. Each page links to the other. Reason: one copy of the account UI, one controller per page for the engine's global rules, and no change to the local product.
- **Part 2: option 1.** Signed-out play stays as it is in the first release. The five-switch setup, cards, Classic, the hidden arrangement and server computer games need sign-in. The local home gets a clear entry to account play that names what an account adds; the browser sample fixes its words. A local game-client adapter for the shared UI stays map fog, to revisit after phase 3. Reason: option 2 makes a second setup UI, a second card board and a new local link contract. The cost: guests do not get cards or Classic in the first release. Guests lose nothing they have today.
