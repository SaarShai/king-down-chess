# Native King Down base-piece port

This patch adds `kingdown-base` to pinned Fairy-Stockfish source
`9f778da667f6e07dae1e85d3e2ea204fc6dee94d`. It is a test prototype. It does not
replace the game AI.

The fixed rules cover ordinary pieces, Archer, Beast, Guard, Maester, Paladin and
Ogre, plus the lab Catapult, Reaver and fixed Templar. They include standard
promotions and the current material, fifty-move and threefold draw rules. There
is no castling, en passant, king power, card or custom workshop design. The
TypeScript bridge rejects other rule signatures and state.

Build in a new directory. Use an absolute patch path:

```sh
git clone https://github.com/fairy-stockfish/Fairy-Stockfish.git fairy-kd
git -C fairy-kd checkout 9f778da667f6e07dae1e85d3e2ea204fc6dee94d
git -C fairy-kd apply --check /absolute/path/tools/fairy-stockfish/kingdown.patch
git -C fairy-kd apply /absolute/path/tools/fairy-stockfish/kingdown.patch
make -C fairy-kd/src -j2 build ARCH=apple-silicon COMP=clang nnue=no debug=yes
```

This build targets this Mac. Other CPU and browser builds need separate checks.
Keep assertions on for verification. Do not use an unverified NNUE net.

From the King Down worktree, with dependencies installed, run:

```sh
node --import ./node_modules/tsx/dist/loader.mjs tools/fairy-stockfish-port.ts /absolute/path/fairy-kd/src/stockfish /absolute/path/to/new-card-verification-directory
npm test
```

Use a new output directory. Preserve failed checks. The driver records explicit
rules, fixtures and source/patch/binary hashes. It compares full semantic legal
effects, every child board, attacks, check flags and terminal outcomes with the
TypeScript engine. Native assertions check undo, keys, material, promotion data,
TT storage and deep recapture selection. Ordinary and variant perft, bounded
search, repetition and illegal-action controls run too. A dense chain must exceed
the former 8,192-action limit and pass full state comparison and bounded search.

## Action format

Normal moves keep UCI notation. Special actions use these forms:

| Form | Effect |
| --- | --- |
| `fromto~mask` | Stationary Archer/Catapult shot, Beast chain or Reaver capture and step. |
| `fromto!mask` | Paladin capture that removes the mover too. |
| `fromto^` | Maester swap. |
| `fromto>pushTo` | Ogre moves onto `to` and pushes its occupant to `pushTo`. |

The victim mask is 64-bit hexadecimal, with bit zero at a1. For example,
`d4d4~80000000000` removes d6 and keeps the Archer on d4. The move and TT store the
whole mask. The action kind also distinguishes a swap or push from a capture.

A Beast mask omits path order. Under these fixed rules, paths with the same
victim set and final square have the same state. The bridge proves this for each
input and retains a legal reference path for play or display. Do not apply this
collapse to cards or triggers without new checks.

## Implementation and limits

Move lists and search move-picker buffers grow as needed. The chain generator
has no fixed action cap. Search reductions handle move numbers beyond the
ordinary table. Memory and elapsed time still limit large positions; removing a
buffer cap does not make the number of chains small.

Compound state changes use one make/undo path. It preserves each piece's
promotion data and recalculates board keys. The debug driver checks the next
search key, including the fifty-move clock adjustment. This is a correctness
prototype; its speed and memory need measurement before player use.

A move is 16 bytes. The TT has two entries per 64-byte cluster. Single-square
exchange pruning stays disabled for the whole base variant: an ordinary capture
can permit a remote reply. The classical evaluation still uses approximate
piece movement/value tables. Legal parity does not establish playing strength.
Only one search thread is checked.

The reference engine's Ogre-shove code does not reset the fifty-move clock when
it pushes a pawn, despite a comment that says it does. This port matches the
code. A rules decision and a separate engine change are needed to alter that.

No WebAssembly build, phone check, production plugin adapter, training-data
pipeline or trained net is delivered. The original Archer/Beast evidence stays
in its own card snapshot; this expanded port has separate evidence.

The upstream code and this derived patch use GPLv3 or later. Preserve upstream
`Copying.txt` and provide the exact source as required when distributing the
engine. The plugin assessment is in
`docs/research/fairy-stockfish-plugin-fit-2026-10-11.md`.
