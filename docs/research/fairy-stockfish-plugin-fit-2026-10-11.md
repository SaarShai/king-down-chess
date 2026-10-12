# Fairy-Stockfish in the ChatGPT plugin

Yes. The best first integration is a server-side engine worker. The ChatGPT board sends a computer-turn request; the match service asks the native engine for a move, checks it with the King Down rules engine, then saves it with the existing revision check. The engine runs on our server. A player needs no local installation.

This is an architecture assessment. No plugin file, deployed service or shipped AI is changed. The native base-piece port still needs cards, king powers and the full game state before it can serve the plugin's complete feature set.

## Evidence from the current build

Read-only inspection uses `claude/chatgpt-mvp` at `f63606e3`. That branch is separate from this prototype. Other agents continue its build.

- `src/match/index.ts`: `LocalMatch` already owns an isolated Node worker. It exposes `chooseMove`, `apply`, snapshots and saved history. Calls have a 15-second timeout.
- `src/match/worker.ts`: `chooseMove` calls the current TypeScript search. It checks that the returned LAN identifies exactly one legal move. The engine fingerprint in a saved match protects replay compatibility.
- `src/match/service.ts`: computer turns have a 2,500 ms search cap for the new setup. It computes before the database lock, then rechecks the revision before saving. Reuse this boundary.
- `tools/plugin-runtime-build.mjs`: the match runtime is a bundled Node worker, separate from the UI.
- `tools/plugin-server-build.mjs`: the standalone Node build and the Vercel build are distinct. The Vercel function uses Node 24 and a 30-second maximum. No native binary is packaged now. Our checked Mac ARM binary cannot run as a Linux server binary.
- `src/plugin/server.ts`: the board resource permits static resources from the plugin origin and no direct network connection domains. The UI calls server tools. Its art-loading support does not prove that an engine worker can run in the ChatGPT iframe.
- The approved MVP spec includes fairy pieces, optional cards and king powers. It leaves custom workshop designs out. A base-piece-only engine cannot yet replace its AI for all games.

## Recommended server integration

Keep `chooseMove` as the seam. Add one explicit engine choice to a test build after the full rule contract is supported. A native UCI worker receives the frozen rules, complete state and history. It returns the portable action token. Resolve that token to one legal TypeScript move, convert it to LAN, and apply it through the existing match service. Reject an unsupported rule signature before search. Preserve the exact engine/source identity with the match and its replay.

Build and test the exact patched source for the server's CPU and operating system. Package its license and source. Bound threads, hash memory, elapsed time, output and concurrent searches. A supervisor must stop the process when a request is cancelled or expires; a JavaScript timeout alone does not stop native work. Test crash, timeout, illegal reply, stale revision and simultaneous matches. Do not put a long training or analysis job in a move request.

For the first test, use a standalone Node/container worker service with a bounded UCI process pool. The existing plugin backend can call it. This avoids assuming that long-lived native processes survive a serverless request. Running a short Linux binary inside the Vercel function is another option to test, but the current package, cold-start cost and request budget are not checked for it. An external worker is not an instruction to deploy one now.

A native UCI process can be hosted on M1 for development if the owner approves that run. A production plugin should use a managed server worker; the owner's laptop is not a release dependency. This task's verification runs on this Mac, not M1.

## Browser option

Fairy-Stockfish has an official WebAssembly port. Its repository says it is used for client-side analysis. This makes a browser worker a plausible later route for the web game and plugin, but our patched build is not that published package. The package does not contain King Down actions. [Official WebAssembly repository](https://github.com/fairy-stockfish/fairy-stockfish.wasm).

OpenAI documents an iframe UI with an explicit content security policy. Static resource and network domains must be declared. Those pages do not certify this patched engine, worker creation, WebAssembly compilation, shared memory or threaded execution in every ChatGPT host. A single-thread worker is the smallest browser test. Check desktop and mobile hosts, asset loading, CSP, memory, cancellation, input latency, battery and suspend/resume before choosing it. Do not make a threaded build depend on response headers that the plugin cannot control. [Plugin reference](https://developers.openai.com/plugins/reference), [security and privacy](https://developers.openai.com/plugins/guides/security-privacy).

A browser build runs on the player's device, inside the plugin UI. A server build runs on our hardware. Neither route makes ChatGPT itself search chess positions. Keep the server rules engine authoritative in both routes.

## Next gates

First finish full rules and state parity, then compare strength and latency at equal budgets. Next make the server adapter and test the existing computer-turn transaction end to end. A WebAssembly build and a real ChatGPT host check are separate gates. Training and NNUE evaluation come after legal game/state support; a trained net cannot supply a missing move or state transition.

The upstream engine and the derived patch are GPLv3 or later. The exact source and license must accompany a distributed engine as required by that license. Review the chosen distribution and linking arrangement before release. No license or host approval is claimed by this assessment.
