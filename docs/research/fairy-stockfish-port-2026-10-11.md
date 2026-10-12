# Archer and Beast native port

The native prototype now supports current Archer shots and Beast chains. Its
legal effects match the TypeScript rules engine in 116 checked positions. It
does not yet support full King Down or replace the public game's AI. No merge,
deployment, training or new strength match occurs.

The tests run as a native child process on this Mac. They do not use M1 or
Kaggle. The earlier eight-game smoke match also runs on this Mac and uses a
different, smaller rule subset. Its score does not measure this patch.

## What is ported

The fixed `kingdown-as` variant has ordinary pieces, standard promotions, current
far2 Archer shots through blockers, and current eight-neighbour Beast movement
and capture chains. It has no castling or en passant. Fifty-move, material and
threefold draw results follow the reference subset. There are no other fairy
pieces, cards, king powers or workshop designs.

An Archer stays on its source square when it shoots. A Beast removes every
selected victim and lands on its final capture square. A portable move record
and the transposition table retain the complete victim mask. Extended UCI
tokens include that mask. The TypeScript bridge maps the result to a legal
reference action and rejects other rules, pieces and state.

Some chains have several paths with the same victim set and final square. In
this subset, path order does not change state. The driver proves each collapse
by comparing the resulting FEN and keeps a valid reference path. It does not
claim ordered-path equality or permit this collapse for future trigger rules.

## Evidence

| Check | Result |
| --- | --- |
| Positions | 116: 20 directed and 96 deterministic seeded cases |
| Reference paths | 2,199 |
| Distinct legal effects and child boards | 2,183; all match |
| Equivalent paths collapsed | 16; all resulting states match |
| Longest checked Beast chain | 17 victims |
| Native recapture controls | 87; both TT and generated move selection pass |
| Bounded search replies | 17 legal replies; 7 shots or chains |
| Ordinary perft, depth 1/2/3 | 20 / 400 / 8,902 in both chess and the port |
| Directed variant perft, depth 2 | 50 / 50 / 291 / 61; reference agrees |
| Native bench, depth 5 | 47 positions, 35,972 nodes; exit 0 |
| Project tests | 122 files, 1,933 tests pass; 1 file and 21 tests skipped |
| Artwork checks | 50 pass |

For each position, checks compare the entire semantic legal set, every child
FEN, check status and all 64 attacked squares for both colours. Native asserts
compare undo, position/pawn/material keys, piece-square totals and complete TT
move records. They also compare promotion flags and unpromoted metadata on every
square. Three directed cases create real promotions through UCI history before
inspection and capture. Other cases cover blockers, pins, both colours, double
check evasion, and a chain whose intermediate step exposes its king but whose
final state is safe. Final king safety is the reference rule.

Mate, stalemate, material draw and the fifty-move limit agree. A separate move
history produces a threefold draw in both engines. Illegal-action and capacity
negative controls pass. A dense artificial chain makes the engine report its
capacity error and exit. No actions are silently omitted.

The patch applies to a fresh copy of pinned upstream source and rebuilds. The
fresh binary passes the same complete controls. The debug binaries have separate
hashes; byte-identical builds are not claimed. Only one search thread is checked.
These are functional checks, not an exhaustive proof or a strength estimate.

## Review and repairs

An independent reader confirms three issues before repair:

1. Deep recapture search tests only the landing square. It now tests victim-mask
   membership for a shot or chain. Controls check both stored TT moves and newly
   generated moves.
2. Inspection and special undo lose promotion flags. They now retain and restore
   promotion and unpromoted metadata. History fixtures and per-square asserts
   detect the original loss.
3. A single-square exchange estimate is wrong even for an ordinary capture when
   an Archer can reply remotely. Exchange pruning is now disabled for the whole
   subset. A directed ordinary-capture/Archer-reply case and native assertion
   check that scope.

The reader checks the repairs and reports no remaining confirmed should-fix
issue within this subset. The capacity limit remains explicit. Earlier check
directories are preserved. One interim harness check tries to select a move
from a terminal position; the repaired driver searches only playing positions.
Only `final-check` and `final-rebuild-check` certify the final patch.

## Work needed for full King Down

| Area | Work and acceptance gate |
| --- | --- |
| Other pieces | Port Guard immunity, Maester swaps, Paladin capture/removal and Ogre pushes. Add exact attack, make/undo and legal-effect checks for each interaction with Archer and Beast. Include the current roster and the supported workshop designs explicitly. |
| Powers and cards | Add the complete action and state model: hands/piles, uses, marks and duration, reserves, last-card history, multi-action and retained-turn effects. Port capture permissions and all rule interactions. A root move filter cannot make a search that omits these effects correct. |
| State and repetition | Serialize and hash every field that changes a legal action or result. Check full round trips and history under each supported ruleset. The current six-field FEN contract is too small for full King Down. |
| Search and capacity | Remove the chain buffer limit, measure chain generation and memory, check cancellation and thread safety, and replace exchange pruning only with an effect-aware model that passes controls. Benchmark on the target devices. |
| Evaluation and training | First verify exact rules. Port those rules and the new action format into data generation. The old packed 16-bit training move cannot retain a chain mask. Add card/power/history features or explicit evaluation terms; board-only NNUE cannot distinguish these states. Then train and test exported inference and held-out playing strength. |
| Product use | Build the exact patched source as WebAssembly; add a worker adapter, time/memory limits, stop support and authoritative reference validation of returned actions. Check loading, offline use, browser support, phones and source distribution before release. |

My next step is the remaining base pieces and their interactions. That establishes
a useful no-card, no-power baseline. Then add powers and cards in bounded groups,
with state and history tests beside each group. A larger paired strength match
comes after the port's rules and capacity pass. No further compute campaign is
launched here.

## How players can use it

The planned browser path is a WebAssembly engine in a worker on the player's
device. The game sends the full position and rules to the worker, receives an
action, validates it and displays the result. Search uses the player's CPU; M1
or a server is not required for each move. This is a proposed integration, not a
feature in the current game. The [official WebAssembly port](https://github.com/fairy-stockfish/fairy-stockfish.wasm)
already serves client-side analysis in another project, which supports the
route. It does not certify our modified source.

Start with one thread and classical evaluation. Measure download size, memory,
move time and battery cost before adding a trained net. Training and bulk test
jobs remain separate compute work; playing with a trained net is inference, not
training on the player's device. A server process remains an option for deep
analysis and test matches.

## Exact artifacts

Source revision: `9f778da667f6e07dae1e85d3e2ea204fc6dee94d`.
Patch and build steps: `tools/fairy-stockfish/kingdown.patch` and its README.
Driver: `tools/fairy-stockfish-port.ts`. Pure bridge tests:
`src/sim/fairy-stockfish-port.test.ts`.

Authoritative evidence is on the card at
`/Volumes/card disk/King Down/results/fairy-stockfish-port-20261011`.
It includes both final specs, checks, perft/search output, exact source archives,
binary and patch hashes, build/test logs, review findings and this report.
The final cloud backup receipt is external to that snapshot.
