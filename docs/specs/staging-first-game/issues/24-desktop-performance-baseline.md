# Desktop performance baseline

Status: corrected 30-sample desktop loopback baseline passes. Parent: U09, blueprint performance measures.

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

The corrected check on `a81c3f00` passes in 41.8 seconds. All 30 first attempts complete without retries. Raw rows and the report remain at `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/u09-desktop-performance-lGgUmv/desktop-performance/desktop-performance.json` (531,718 bytes). Preserve this file with release evidence before temporary runner output expires.

Device: Mac15,9, Apple M3 Max, 48 GiB RAM, 16 logical CPUs, Darwin 27.0.0. Browser: Chromium 156.0.8078.4, headless, 1100×1000. The owner assigns the sole CPU lane. Network: loopback, no emulation. Deployment region: not applicable.

| Measure | Samples | p50 ms | p95 ms |
| --- | ---: | ---: | ---: |
| Cold controls-ready entry proxy | 30 | 367.7 | 393.9 |
| Warm controls-ready entry proxy | 30 | 209.4 | 230.2 |
| Menu event-to-frame proxy | 30 | 30.9 | 32.6 |
| Accepted non-AI loopback HTTP request | 30 | 40.5 | 47.1 |

These values do not measure hosted account latency, sign-in, a phone, or physical input-to-display latency. The two-frame Menu proxy has a frame-scheduling floor; it is not an INP measurement. The entry proxy includes the legal-read clone and observer work. No performance threshold is claimed.

Engine: `sha256:8d6283617db3a5f4157225b8b1864810213f7e50d878393f391619756ef2e316`. Emitted `static/index.html` SHA-256: `8703075adf8f7f6774fb3f812388d95449b8107e5b89a2daf0996a8c13f954d1`. Emitted `functions/mcp.func/runtime/worker.mjs` SHA-256: `5fb33c6f30bf26430a5a45d48b222896c7d013b9206ba7e151dd3a065c287114`. The acknowledgement correction keeps all full-read and single-command SQL assertions.
