# Make shared account play easy to find

Status: in progress. Parent: U07/U09. Follows ticket 44.

The owner asks to make shared account play discoverable from the website home and menu, preserve local/offline play, reuse evidence and publish only to staging. This authorizes the small navigation change in the existing visual style. The second-account check does not block it.

## Plan and acceptance

1. Add direct same-origin links to the existing `/play/` route on the first-visit screen, returning Home and main Menu. Explain shared web/ChatGPT games and local play. Keep existing local actions and saved-game keys.
2. Use ordinary links; do not create a game, send a command, import account services into the local page or move local saves. If the browser is offline, keep the player on the local page and show a connection note.
3. Extend the existing compiled web harness with a named discovery check. Cover first/return visits, keyboard and 390 px layout, signed-out entry/cancellation, signed-in account-game resume, local-save preservation, and cached offline local continuation. Assert that navigation creates no game or command. Reuse existing sign-in return, mechanics and embedded evidence when their code/artifact bytes do not change.
4. Check Home and affected local journeys; inspect rendered samples. Build and verify the exact staging artifact, retain unchanged backend/embedded/engine hashes, publish through the guarded staging path, then check the hosted home-to-account journey. Production stays unchanged.

## Scope

Reuse the current game, account entry, account service, host adapters, sign-in flow, cache policy and art. No second account, new dependency, service, schema, game rule or visual redesign is required. The unrelated first-open and release gates remain open.
