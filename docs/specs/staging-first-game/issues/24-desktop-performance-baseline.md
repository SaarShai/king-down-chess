# Desktop performance baseline

Status: first run exposes a checker assertion error; corrected run pending. Parent: U09, blueprint performance measures.

## Plan and acceptance

Use one by-name mode in the existing compiled website check. Reuse its disposable database, synthetic signed actors, local server and existing Guard fixture. Keep all product code and default checks unchanged.

1. Record 30 fresh-context cold visits and 30 same-context warm reloads. Keep service workers and HTTP caching enabled. Seed test authentication only. Do not route requests: Playwright routing disables HTTP caching.
2. Record 30 Menu click feedback samples and 30 accepted ordinary non-AI turns. Check the exact LAN, game, engine, revision, stored history and single command row. Never retry a failed sample.
3. Write raw rows, scope, device/browser/artifact identity and nearest-rank p50/p95 outside the checkout. Artifact identity includes the emitted `static/index.html` and `functions/mcp.func/runtime/worker.mjs` SHA-256 bytes. Keep partial rows and the failure phase if a first attempt fails. Summary appears only after all 30 attempts pass.
4. Run `npm run check:browser desktop-performance` when the owner grants the CPU lane. Obtain an independent read review before integration.

## Measurement limits

This is compiled desktop loopback HTTP with synthetic authentication and local disposable PostgreSQL. It is not hosted latency, phone performance or a sign-in measurement. Record network as loopback and region as not applicable. The runner is exclusive; the operator must also keep unrelated CPU-heavy work off the machine.

Entry uses a page MutationObserver and two animation frames after the board screen, artwork, status and controls are ready and the selected game's legal read is confirmed. A passive fetch clone checks the exact game, engine, revision, action and fixture LAN without delaying the product read or keeping its payload. This adds parse overhead to the controls-ready proxy. The fixture uses the same current engine as the built page, so preview is local. Menu feedback uses the trusted click event timestamp, visible dialog DOM and two animation frames. This is a render-opportunity proxy, not physical input-to-display latency. HTTP duration uses the accepted request's own send/response-end timing. It does not split authentication, database and engine costs.

Use the current normal motion setting. The existing board readiness condition excludes active animation. Keep cold/warm resource transfer sizes to help explain caching; a zero transfer size alone is not proof of a particular cache layer. No timing threshold is added.

## Verification

The independent reader finds no substantive validity or scope issue. Normal hooks pass. The first run on `f9b622d` stops at sample 1 after both visits, Menu feedback and an accepted turn. The checker wrongly reads full history from the partial command acknowledgement. Keep that acknowledgement check to its actual game/revision fields; the existing subsequent full game read checks exact history and FEN, and SQL checks one accepted turn row. No product change is needed.

The failed log and partial JSON remain under `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/u09-desktop-performance-OwxZrW`. The report has `complete:false`, the command failure phase and its error. No summary is produced. The corrected full 30-sample run is a separate receipt.
