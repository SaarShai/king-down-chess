# Make shared account play easy to find

Status: complete in staging. Parent: U07/U09. Follows ticket 44.

The owner asks to make shared account play discoverable from the website home and menu, preserve local/offline play, reuse evidence and publish only to staging. This authorizes the small navigation change in the existing visual style. The second-account check does not block it.

## Plan and acceptance

1. Add direct same-origin links to the existing `/play/` route on the first-visit screen, returning Home and main Menu. Explain shared web/ChatGPT games and local play. Keep existing local actions and saved-game keys.
2. Use ordinary links; do not create a game, send a command, import account services into the local page or move local saves. If the browser is offline, keep the player on the local page and show a connection note.
3. Extend the existing compiled web harness with a named discovery check. Cover first/return visits, keyboard and 390 px layout, signed-out entry/cancellation, signed-in account-game resume, local-save preservation, and cached offline local continuation. Assert that navigation creates no game or command. Reuse existing sign-in return, mechanics and embedded evidence when their code/artifact bytes do not change.
4. Check Home and affected local journeys; inspect rendered samples. Build and verify the exact staging artifact, retain unchanged backend/embedded/engine hashes, publish through the guarded staging path, then check the hosted home-to-account journey. Production stays unchanged.

## Scope

Reuse the current game, account entry, account service, host adapters, sign-in flow, cache policy and art. No second account, new dependency, service, schema, game rule or visual redesign is required. The unrelated first-open and release gates remain open.

## Result and evidence

Source `d51c8a59` adds ordinary links to `/play/` on all three entry surfaces. Local controls stay in place. An offline click shows a connection note and keeps the local page usable. Reconnection restores the note. Home gives its controls content height and permits scrolling on short screens. The initial rendered sample exposed overlap with Today; the final browser check measures the controls themselves and includes finished games with Review.

The focused source selection passes 72 tests, typecheck and 54 artwork checks. The compiled Home and Menu checks pass on `43ffc9cc`; only copy changes afterward. The final `account-discovery` check passes on `d51c8a59`. It covers keyboard entry, first and returning visits, four viewport sizes, cancellation, unchanged local save, offline move and reload, and account-game resume. Navigation creates no game or command. The source stays clean during accepted runs.

The exact artifact passes `check:vercel`. Preview `dpl_Abm7V5y2Pi8BMBQ7MiuAW3AvrnMH` serves the staging alias. Hosted index, account entry and service worker hashes match the checked artifact. The actual signed-in Chrome journey starts at the new title link, lists existing games and resumes `02207813-587c-867d-99be-7d448c5e30b0`. Its seven saved actions include March, a Maester swap and Ice Wall. Back returns to the local title. All ten prior active game IDs remain.

Server, embedded board HTML, runtime, search worker and eleven engine archives are byte-identical to the accepted prior release. Reuse mechanics and actual two-way host evidence. This ticket does not claim a fresh OAuth, second-account, physical-phone or ChatGPT first-open pass. Those gates remain open. Production is unchanged.

The parent workspace holds logs, failed samples, final screenshots, hashes and hosted evidence in `evidence/staging-account-discovery/verification.md`. Implementation review confirms existing navigation and account screens, nine lines of offline handling, local Home CSS and no added service or dependency.

Documentation checks pass: 161 tests in thirteen files. The development entry, backlog and comparison follow-up now credit this completed ticket and retain the open release gates.
