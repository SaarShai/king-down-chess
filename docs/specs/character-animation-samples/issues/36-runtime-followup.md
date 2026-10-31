# Repair staging runtime faults

Status: ready-for-review

## Plan and checks

- Give move preparation priority over idle loads and bound idle prefetch. Check both throttle profiles in both browsers.
- Keep slow idle loads until deselection. Test release timing, ownership and PNG colour keys.
- Skip unused legacy clips, update the cloud hash and inspect the undo check.
- Stop offline clip requests and test the scene.
- Release idle image loads when selection ends. Check ten captures per browser.
- Restrict PNG chunks, remove cloud metadata, and test the output scan and scene cleanup.
- Run focused tests and both browser checks in Chromium and WebKit. Open a PR and check CI.

## Evidence

The legacy clip loader requested two sheets offline. Runtime bodies replace those clips, so the scene skips their downloads when it uses runtime bodies. The offline browser journey checks console errors.

Idle prefetch could fill the six image slots and delay a capture past its one-second preparation limit. The move then used the plain figure. Move preparation now takes priority and can cancel an idle load. Idle playback keeps a short queue near the current frame. The first four attack entries load before the move; playback fetches the rest. Idle reservations keep slow loads until deselection. The one-second limit stays the same.

The PNG guard and packer accept only IHDR, IDAT and IEND. The packer rejects images that need a palette or colour key. The cloud bank has no caBX chunk; a decoded pixel comparison passes. The selection record has the new hash.

The four focused test files pass 182 cases. The board checks pass 68 cases. These are not full-suite results. `npm run check:browser character-runtime` and `npm run check:browser web-online` pass in Chromium and WebKit. `npm run build:vercel` and `npm run check:vercel` pass. The undo check waits for the restored body frame after the board state changes.

The Rook capture gate selects the piece, holds for two seconds, then captures. Its shared-link throttle gives 5/5 attacks in each browser at 4 Mbps / 100 ms and 1.6 Mbps / 150 ms. The new gate gives 0/5 at 4 Mbps with the base loader. The review measured 0/5 on base at both profiles. The original Chromium throttle probe gives 5/5 at both profiles on the final code.
