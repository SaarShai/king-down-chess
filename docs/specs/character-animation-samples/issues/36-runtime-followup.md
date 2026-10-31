# Repair staging runtime faults

Status: ready-for-review

## Plan and checks

- Stop offline clip requests and test the scene.
- Release idle image loads when selection ends. Check ten captures per browser.
- Restrict PNG chunks, remove cloud metadata, and test the output scan and scene cleanup.
- Run focused tests and both browser checks in Chromium and WebKit. Open a PR and check CI.

## Evidence

The legacy clip loader requested two sheets offline. It now skips those requests. The offline browser journey checks console errors.

Idle reservation could fill the six image slots and delay a capture past its one-second preparation limit. The move then used the plain figure. Releasing the reservation cancels its unshared loads. A test holds six idle loads and checks that capture art can load. The browser check plays the staging capture ten times in fresh pages per browser. All 20 runs show attack frames.

The PNG guard and packer accept only IHDR, IDAT and IEND. The packer rejects indexed images that need a palette. The cloud bank has no caBX chunk; a decoded pixel comparison passes. Its earlier source hash remains in the selection record.

The four focused test files pass 173 cases. The package test passes 10 cases after the indexed-image check. Both runs pass 68 board checks. These are not full-suite results. `npm run check:browser character-runtime` and `npm run check:browser web-online` pass in Chromium and WebKit.
