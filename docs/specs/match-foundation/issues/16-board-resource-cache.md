# Give each board build its own resource URI

Status: claimed

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

Protocol verification passes after the change. The full suite, browser checks and live cache verification remain pending.
