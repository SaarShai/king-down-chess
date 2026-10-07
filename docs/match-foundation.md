# Local match foundation

The Node-only [match module](../src/match/index.ts) imports the existing King Down engine. It provides validated moves and save/replay in an isolated worker per live match. The private [MCP plugin and durable match service](plugin-preparation.md) now use this interface; the website remains on its existing path.

## Use

From a TypeScript file in the repository root, run with `npx tsx <file>.ts`:

```ts
import { createMatch, loadMatch } from './src/match/index';

const match = await createMatch({
  backRank: 'AGMOKRBS',
  kings: 'Flame:Haste,none',
});
let save: string;
try {
  const before = await match.snapshot();
  const after = await match.apply({
    id: 'move-1',
    expectedRevision: before.revision,
    lan: before.legal[0],
  });
  console.log(after.revision, after.turn, after.status);
  save = await match.exportSave();
} finally {
  await match.close();
}

const resumed = await loadMatch(save);
try {
  console.log(await resumed.snapshot());
} finally {
  await resumed.close();
}
```

Use `createMatch` and `loadMatch` to obtain initialized handles. Always close them, including after an application error. Worker exit, error, close or a 15-second request timeout rejects pending requests; subsequent requests on that handle fail.

## Contract

| Operation | Behavior |
|---|---|
| `createMatch(setup?)` | Accepts an eight-piece `backRank` with one king, or a canonical King Down `fen`; never both. Presets are `current` (default), `2017` and `2021`. With no position specified, uses `RNBQKBNR`. |
| `snapshot()` | Returns detached JSON-compatible data: revision, FEN, actual turn (`0` White, `1` Black), ply, move number, status, check, legal LAN strings, structured legal moves, public effective rules and move history. Private hands/piles are excluded. |
| `apply({id, expectedRevision, lan})` | Selects exactly one currently legal move. New successful commands increment the revision once. Illegal, stale, malformed and post-game commands leave state unchanged. |
| `chooseMove({maxTimeMs?, maxDepth?})` | Returns a legal LAN without changing the game. Defaults to 250 ms/depth 4; accepts 1–5,000 ms and depth 1–8. The search uses actual turn/history. |
| `exportSave()` / `loadMatch(json)` | Exports a JSON string; loading validates the setup and complete command history before returning a handle. |
| `close()` | Terminates the match's worker. Repeated close is safe. |

`kings` names both sides, for example `Flame:Haste,none`. Setup follows the website's precedence: balanced power settings when a power is selected, then an older preset if requested, then explicit king choices. Arbitrary rule overrides and private card hands/decks are outside this slice.

Choose `lan` from the latest snapshot's `legal` list. Revision counts accepted commands, not turns: Haste may leave the same player to move. Use `turn` and `moveNumber`, never ply parity.

Reusing a successful command ID with identical move and expected revision returns the **current** snapshot without applying it again, including after reload. Reusing it with different input throws. Two different commands submitted at the same revision to one handle cannot both succeed. On a stale error, fetch a fresh snapshot before choosing another move. Errors reject with `Error`/`MatchError`; incompatible schema/engine saves carry `MATCH_INCOMPATIBLE`. The durable service exposes typed command, permission and recovery errors to the MCP adapter.

## Save compatibility and limits

Saves contain schema identity, engine fingerprint, initial setup/FEN, complete effective rules, revision and accepted commands with resulting FEN, ply and status. Loading reconstructs the rules and replays every command; mismatched results, duplicate history entries, illegal moves and moves after a terminal result reject the whole load. This preserves repetition history and pending Haste actions.

Development mode fingerprints runtime TypeScript in `src/rules/` and `src/ai/`, plus `src/game.ts` and the match worker; tests are excluded and comments conservatively count as changes. The compiled runtime instead hashes its emitted `worker.mjs`, including the bundled gameplay/search code. It runs without the TypeScript tree, `tsx` or runtime packages; comment-only and UI-only changes do not alter that engine bundle. Development and compiled saves deliberately have different fingerprints. There is no silent migration or old-engine hosting.

Operational bounds are 1,000 accepted commands per match, an 8,000,000-character input save, a 4,096-character initial FEN and a 200-character command ID. The history limit rejects further new moves while still allowing export and retries; it is not a game result. Initial FENs must be canonical, structurally valid, contain one king per side and use supported public power state. The module does not establish that arbitrary analysis positions are reachable through legal play.

## Verification and durable integration

Run `npx vitest run src/match/match.test.ts` for actual-worker tests; `npm test` and `npm run build` cover the surrounding project. Fixtures exercise illegal/stale/retried commands, rule isolation and website power parity, complete replay, terminal results, repetition, Archer shots, Beast chains, Ogre pushes, Maester swaps, promotion, Haste and worker shutdown.

For a named failure with individual test results, run `npx vitest run src/match/match.test.ts --reporter=verbose -t "replay"` (replace `replay` with `worker`, `Haste` or `source change`). The focused tests include dropped worker delivery, actual thread termination, tampered legal replay and a temporary source copy that verifies engine fingerprint changes. These are short fixture checks; no tournament is needed.

| Symptom | Check and recovery |
|---|---|
| `Stale revision` | Read a new snapshot and choose a move against that revision. An identical retry of an already accepted command remains safe. |
| `Command ID conflict` | Compare the original command's ID, LAN and expected revision. Preserve all three on retry; give a different command a new ID. |
| `Illegal or ambiguous move` / `Match terminal` | Compare the command with the latest `legal` list, actual `turn` and `status`; pending power actions may keep the same side's turn. |
| `Incompatible save` / `Incompatible setup or rules` | Compare schema, engine fingerprints and effective rules. Restore with the matching source version; editing the saved fingerprint does not repair compatibility. |
| `Invalid replay` / `Malformed history` | Preserve the original save and inspect the first divergent command/result. Do not truncate history and treat partial replay as a successful restore. |
| Worker timeout, exit or closed handle | Discard the handle and reload the last saved JSON into a new one. Record the error, command ID, expected revision and last confirmed snapshot when investigating. |

A timeout does not prove a command was never applied. This worker module alone has no durable storage: its caller must persist `exportSave()` output. The shared service commits command receipts and saves atomically before acknowledging a move; retry the original command ID after an uncertain response.

The [private plugin guide](plugin-preparation.md) covers PostgreSQL seats and commands, two-process race tests, resource-bound OAuth, the compiled HTTP/MCP server, the painted board, bounded AI and browser recovery checks. Production OAuth/provider setup and actual ChatGPT client verification remain separate from local evidence. Clocks, card mode, ratings and matchmaking are outside this preparation. Keep the evolving website and plugin on the same engine and run validation against current main before merging.
