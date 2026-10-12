# Native King Down port

This test patch adds the `kingdown` variant to Fairy-Stockfish commit
`9f778da667f6e07dae1e85d3e2ea204fc6dee94d`. It does not replace the game AI.

The contract covers the six ordinary pieces, nine fixed fairy pieces, twelve
king powers and all 36 card names in the reference engine. It includes standard
promotion, marks, spent uses/cards, reserves, ordered draws, copied cards,
delayed availability, held turns, material draws, the fifty-move rule and
whole-history threefold repetition. There is no castling or en passant.

`fullConfig()` in `tools/fairy-stockfish-full.ts` accepts explicit default and
balanced profiles. It rejects other workshop/lab rules. The six stateful king
powers need 1–6 uses; March and Leap allow 0–6. Hands hold at most eight dealt
and drawn cards; explicit piles hold at most 64. These are support limits, not
changes to King Down. Unlimited stateful powers need a separate history design
and checks before support.

## Build and check

Use a new directory and an absolute patch path:

```sh
git clone https://github.com/fairy-stockfish/Fairy-Stockfish.git fairy-kd
git -C fairy-kd checkout 9f778da667f6e07dae1e85d3e2ea204fc6dee94d
git -C fairy-kd apply --check /absolute/path/tools/fairy-stockfish/kingdown.patch
git -C fairy-kd apply /absolute/path/tools/fairy-stockfish/kingdown.patch
make -C fairy-kd/src -j2 build ARCH=apple-silicon COMP=clang nnue=no debug=yes
```

Use `ARCH=x86-64 COMP=gcc` on a Linux CPU runner. Each target needs its own
checks. Keep assertions on for verification. No NNUE net is certified for this
port; use `Use NNUE=false`.

From the King Down source root, with locked dependencies installed:

```sh
node --import tsx tools/fairy-stockfish-full-check.ts /absolute/path/fairy-kd/src/stockfish /absolute/path/to/new-card-check-directory
node --import tsx tools/fairy-stockfish-full-controls.ts /absolute/path/fairy-kd/src/stockfish /absolute/path/to/another-new-card-directory
npm test
```

Use new output directories. Preserve failures. The corpus includes every power
and card, both profiles and colours, mixed kings, both Mirror variants, sparse
material, marks, draws, reserves, delays, held actions, seeded traces, and the
retained base-piece corpus. Native checks cover physical boards, cold keys,
material, pawn keys, piece-square scores, undo, promotion metadata and complete
TT payloads. Controls check search replies, perft, illegal actions, unsupported
configurations and repetition through a reversed pawn move. Evidence belongs
with the exact source, patch, binary, compiler and settings.

## Rules and search

An independent C++ rules module generates atomic actions. The conformance driver
compares them with the TypeScript rules engine. Native legality does not call
back into TypeScript.

Fairy-Stockfish searches alternating turns. A held first action and its legal
ordinary follow-up/pass form one complete search move. A terminal first action
stops the turn. The driver checks the full set of these combinations separately
from atomic legality. A search reply can contain two actions. The match driver
validates both, plays the first, then requests another decision if the side still
holds the turn. Both AIs receive the same time allowance per atomic decision.
Actual latency includes proposal processing and is recorded.

`kdconfig` sets the immutable rules before a game. FEN field seven carries public
power/card state. `kdlegal` lists atomic actions; `kdinspect` checks atomic
transitions; `kdturninspect` checks complete turns. These commands run only when
search is idle. Normal position history can contain atomic held actions. Search
moves must be complete turns.

An atomic token is `@data:flags:victims:pushes`, with hexadecimal fields. `data`
holds the action kind, source, destination and promotion. `flags` holds the
power, Mirror kind, swap, self-removal, pass, Ogre destination and drop fields.
Both masks use a1 as bit zero. A complete two-action turn joins two tokens with
a comma. The TypeScript bridge owns encoding; consumers must validate tokens
against the legal set. Beast paths collapse only when every effect field and
resulting state agree. A legal reference path remains available for display.

## Limits

Move lists grow as needed. A complete move is 48 bytes; each 64-byte TT cluster
holds one entry. Large Beast paths and held-turn combinations still cost time
and memory. There is no fixed chain action cap.

Null-move pruning, orthodox cycle shortcuts, specialized orthodox endgame tables
and single-square exchange pruning are disabled for this variant. They omit
state or actions that these rules permit. Classical evaluation still uses
approximate movement, pawn structure and piece values. Legal parity does not
establish strength or a trained evaluation.

The port matches the reference Ogre-shove clock: pushing a pawn does not reset
it. The independent search uses full history for repetition because a relocator
can reverse a pawn move.

No browser/WebAssembly build, phone check, production plugin adapter, training
pipeline or trained net is included. Prior base-port evidence stays in its own
immutable card snapshot. This full port has separate checks and match data.

The upstream engine and derived patch use GPLv3 or later. Preserve upstream
`Copying.txt` and provide the exact source as required when distributing it.
The plugin assessment is in
`docs/research/fairy-stockfish-plugin-fit-2026-10-11.md`.
