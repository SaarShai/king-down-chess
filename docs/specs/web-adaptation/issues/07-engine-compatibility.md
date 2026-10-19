# Check browser replay against stored engines

Type: research
Status: resolved
Blocked by: 01, 02
Parent: [Web adaptation map](../map.md)
Labels: wayfinder:research

## Question

Can the current browser board code safely render and continue every supported stored account game, and what is the smallest contract for a game whose stored engine differs from the current one?

## Rule

A server game keeps its recorded rules and engine. An update must not rewrite it as a new game.

## Options

1. Reuse the current replay path where the stored fixture proves it correct. Refuse unsupported local drafting clearly and keep server data intact.
2. Load every old server engine bundle into the browser.
3. Convert existing games to the new engine on release.

Recommended: 1. It uses the existing archive and error codes, with no new engine loader or data conversion. An active game must still have a supported way to continue before release; a refusal alone is not acceptable for a game that works today.

## Evidence to collect

`engines/README.md`, the retained save fixtures, `tools/engines-check.mjs`, `tools/engines.test.ts`, `src/match/store.ts`, `src/match/worker.ts`, `src/match/index.ts` (the archive adapter: old snapshots get empty hands and lose the level option, so their four level labels share one strength; critic item CRIT-05), `src/match/protocol.ts` (`MATCH_INCOMPATIBLE`), `src/plugin/screens/board-model.ts` and its tests, `docs/match-foundation.md`, the engines-in-use query in `tools/deploy.sh`. Check Classic rights, en passant, powers, public hands, multi-action turns, history and results.

## Pass criterion

Every supported active game has a tested browser continuation or a documented supported client route. Server legality and outcome checks stay the authority. A mismatched local draft cannot silently commit different moves. No release deletes an engine bundle that a game still uses.

## Answer

Research: [research-engines.md](../../../research/web-adaptation-2026-10-18/research-engines.md) (reviewed: sound).

- **Four archived engines** stay in the source, each with a worker and one simple save fixture. A save records its engine stamp, rules and full command history. The server selects the worker from the save and validates every whole turn with the stored engine before a write.
- **The browser uses the current engine for every draft and replay.** For an old-engine game it can hide a legal server action (the first step intersects local moves with `View.legal`; later steps use local moves only), show a wrong draft state, or give wrong draft end words (no repetition count). The server still protects the stored game; the draft can mislead the player before Send. The plugin uses the same draft code, so this limit applies to both surfaces.
- **The View has no engine identity.** Rules, FEN and legal moves cannot identify the code behind them.
- **Contract (picked: option 1, with one addition).** Add `engine` (the saved stamp, or null before an engine starts) to every View, for both transports. Keep a list of browser-supported stamps with evidence for each. An unsupported stamp gets no local draft or rebuilt history; the board shows the server facts only. Before release, each engine that an unfinished game uses needs a tested continuation path. If one fails, the next option to assess is a bounded server preview (apply an unsent prefix in the stored worker, with no write). Do not load the archived Node workers in the browser. Keep `MATCH_INCOMPATIBLE` for a server save that cannot load.
- **Release evidence.** An approved read-only engines-in-use report against the exact release files, a save/column agreement count, and continuation evidence per active engine. A skipped engines query stops the release.
- **PR 61 adds no new mismatch** (checked 2026-10-18). From the live build `04b7af87` to PR 61, no rules or engine code changes: only the turn-line words in `src/turn.ts` change ("Tap" to "Select"). The limit above exists on the live build today. The deploy's engines-in-use step runs only when `KINGDOWN_ENGINES_DATABASE_URL` is set; without it, `tools/deploy.sh` prints one line and goes on.
- **Engines in use at the PR 61 release (2026-10-19).** The deploy's engines-in-use check found two: `bab22e94` (1 unfinished game) and `e668782a` (4 unfinished: the review sample games). `e668782a` is a source-tree stamp: `npm run plugin:db:seed-review` runs under tsx, so the worker stamps the hash of its source, not of a compiled bundle. Any tsx run against a live database (a seed, a script, a dev server) makes such a stamp. PR 62 archives it as an alias: the `bab22e94` bundle with only the stamp swapped, checked byte for byte (`sourceAliases` in `tools/engines.test.ts`). For this plan, the browser-supported stamp list treats an alias as its base, and the continuation evidence before release covers each alias.
- **Spec wording.** Server results are final; draft results are previews. The two oldest engines keep one built-in computer strength under any level name.
