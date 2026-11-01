# Repair staging runtime faults

Status: ready-for-review

## Plan and checks

- Rebase on the painted attack banks. Keep both attack facing and loader fixes. Check the catalog pin, both browsers, offline requests, the throttle gates, the build and CI.
- Give move preparation priority over idle loads and bound idle prefetch. Check the server throttle on base and head in both browsers. Require five attacks at 4 Mbps. Record the count at 1.6 Mbps.
- Restore clip fallback when the runtime has no bodies. Test queue depth and pump re-entry. Run the requested checks, update the PR and wait for CI.
- Keep slow idle loads until deselection. Test release timing, ownership and PNG colour keys.
- Skip unused legacy clips, update the cloud hash and inspect the undo check.
- Stop offline clip requests and test the scene.
- Release idle image loads when selection ends. Check ten captures per browser.
- Restrict PNG chunks, remove cloud metadata, and test the output scan and scene cleanup.
- Run focused tests and both browser checks in Chromium and WebKit. Open a PR and check CI.

## Evidence

The legacy clip loader requested two sheets offline. The scene skips those downloads when it has runtime bodies. If the manifest fails or has no bodies, it loads the legacy clips. The offline browser journey checks console errors.

Idle prefetch could fill the six image slots and delay a capture past its one-second preparation limit. The move then used the plain figure. Move preparation now takes priority and can cancel an idle load. Idle playback keeps a short queue near the current frame. The first four attack entries load before the move; playback fetches the rest. Idle reservations keep slow loads until deselection. The one-second limit stays the same.

The PNG guard and packer accept only IHDR, IDAT and IEND. The packer rejects images that need a palette or colour key. The cloud bank has no caBX chunk; a decoded pixel comparison passes. The selection record has the new hash.

The four focused test files pass 182 cases. The board checks pass 68 cases. These are not full-suite results. `npm run check:browser character-runtime` and `npm run check:browser web-online` pass in Chromium and WebKit. `npm run build:vercel` and `npm run check:vercel` pass. The undo check waits for the restored body frame after the board state changes.

The Rook capture gate selects the piece, holds for two seconds, then captures. The review proxy measured head at 15/15 in each browser at 4 Mbps / 100 ms. At 1.6 Mbps / 150 ms, it measured 14/15 in Chromium and 11/15 in WebKit. Base gave 0/15 at both profiles.

CI exposed a test fault: a fingerprint began with the probe text `e2e4`. The privacy test now checks text fields without treating hash characters as leaked text. A fixed collision case checks both a hash match and a real message leak.

The round 4 server throttle measures the shared link in both engines. At 4 Mbps / 100 ms, head shows 5/5 attacks in Chromium and WebKit. The base scene and loader show 0/5 in each. At 1.6 Mbps / 150 ms, this five-run sample shows 5/5 in Chromium and 3/5 in WebKit; this profile does not gate the build. The review sample is larger: 14/15 and 11/15.

The focused runtime and scene tests pass 130 cases and the board checks pass 68 cases. Removing the idle queue bound makes its test fail at 21 queued frames. Removing the pump guard makes its test fail with a stack overflow. The `character-runtime`, `web-online` and `king-capture-facing` browser checks pass in Chromium and WebKit. The first Chromium online run lacked a test database; the rerun passes with one. `npm run build:vercel` and `npm run check:vercel` pass.
