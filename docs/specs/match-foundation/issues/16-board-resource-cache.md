# Give each board build its own resource URI

Status: resolved

## Defect and evidence

The release check after PR 22 still loads the old board controls in ChatGPT. A new board in the existing test chat submits Haste pass on repeated selection. A full chat reload still gives `Chess board, a2` after eight ArrowRight presses from a1. The released code clamps this case to h1. The server, local browser and hosted checks pass against the new artifact.

The board keeps `ui://kingdown/board-v1.html` across UI changes. [OpenAI's UI resource guide](https://developers.openai.com/plugins/build/chatgpt-ui) says to treat the URI as a cache key and change it when the HTML, JavaScript or CSS changes.

## Plan and verification

The current repair request covers making the released fixes available in ChatGPT. Check these causes in order: a cached resource under the fixed URI, an old server artifact, or repeated input events. The independent keyboard-edge signal and the verified release artifact support the cache cause.

Add a protocol-level regression with a host cache keyed by resource URI. Load an old board, retain the cache, then load changed HTML from the same server identity. The host must receive the new HTML. Identical HTML must keep one URI, including across actors. Use the board HTML hash in its URI. Let protocol clients read the URI advertised by the tool, instead of a fixed constant.

Run `npm test`, the protocol and compiled server checks, and all three plugin browser checks. Release through the approved path. Repeat the Haste and keyboard cases in the actual ChatGPT test account. Record any host metadata refresh needed; a source-only pass cannot close this ticket.

## Regression and repair

`npm test` reproduces the cache defect: the new SDK cache test receives `<html>old controls</html>` when it expects `<html>repaired controls</html>`. The other 1,410 tests pass. The failing case takes 22 ms.

The server now derives the board URI from the SHA-256 of the built HTML. All tool descriptors reference that same URI. The protocol and HTTP clients discover it from `kingdown_open`. The build measures the payload with the full URI. Identical content keeps its URI across actors; changed content gets a new one. No old-URI alias is added. The release guide includes the official private-connection refresh and fresh-board check.

## Answer

[PR 23](https://github.com/SaarShai/king-down-chess/pull/23) merges at `13c41cea7a8f64d144e5c4d22e6334e55146204c` after all three hosted checks pass. Before merge, all 1,411 tests and 42 artwork checks pass. The three local browser checks pass in 3.3 s, 16.0 s and 15.6 s. The SDK cache regression now receives the changed HTML and still shares identical content across actors.

The approved release script tests fresh main again. Type checking, 1,411 tests, 42 artwork checks, compiled HTTP/PostgreSQL, worker and protocol checks pass. Release browser checks pass: plugin-oauth 3.0 s, plugin-ui 15.7 s and plugin-ui-http 18.6 s. The resource payload is 4,293,039 JSON bytes. No new migration is needed.

Deployment `dpl_AtNCZPaLh1T9h1H1e6yeY8pu3qGL` is Ready at `https://kingdown-plugin.vercel.app`. The unsigned live discovery, OAuth challenge and exact consent-script checks pass. Release log: `/tmp/kingdown-cache-release.log`.

Refresh tools completes on the existing private ChatGPT connection. Both dedicated test accounts stay connected. A fresh conversation opens a new solo board through the second test account, Alicia. [Open King Down Board](https://chatgpt.com/c/6ac7d087-cad4-83ed-8f53-4a1f1a93435d) is the final live check:

- Eight ArrowRight presses from a1 stop at h1. This directly distinguishes the repaired controls from the cached version, which reached a2.
- The named Haste e2-e3 button saves the first action and keeps White to move. Selecting e3 shows the ordinary second move and explicit pass button. Selecting e3 again clears the choices without passing the turn.
- Re-selecting e3 and selecting destination e4 completes the Haste action. The board changes to Black to move. Computer move completes a reply.
- A full chat reload mounts a new frame and restores the pawn on e4, the computer reply, and White to move at move 2. There is no board error.

The deployment-filtered Vercel log view through 17:20:48 UTC shows zero warning, error or fatal console entries, including the live play and reload window.

The final screenshot is `/tmp/kingdown-review-live-board.jpg`. This is a desktop ChatGPT check with board keyboard selection and named action buttons. Touch browser checks pass separately. No new native iPhone run is claimed. Old conversation resources can remain cached; use the fresh verified board for this version.
