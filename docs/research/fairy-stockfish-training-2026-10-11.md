# Fairy-Stockfish training for King Down

Checked on 2026-10-11. This report uses upstream code and documents. It does not run training or games.

## Result

Fairy-Stockfish can train an NNUE for a custom variant with custom pieces. Betza movement is not the main training limit. The main limit is exact support for King Down actions and state. Training cannot add a missing game rule.

A complete path is possible in principle: extend the engine and data generator, prove rule parity, then train. This is a C++ rules and data project before it is a GPU project. A smaller first step is an external reference test for a shared subset of rules. Label that subset. Do not report its results as full King Down results.

The later [base-piece port](fairy-stockfish-base-port-2026-10-11.md) now verifies all nine fixed fairy pieces and removes the fixed Beast action cap. The upstream findings below describe the unmodified engine. Powers, cards, state features, the data generator and NNUE updates remain separate work. No training is run.

## Source baseline

The engine source checked is [Fairy-Stockfish 9f778da](https://github.com/fairy-stockfish/Fairy-Stockfish/tree/9f778da667f6e07dae1e85d3e2ea204fc6dee94d). The trainer source is [variant-nnue-pytorch b15df38](https://github.com/fairy-stockfish/variant-nnue-pytorch/tree/b15df38a9aae8ab9b40b2378020b3099c7c5d179). The generator source is [variant-nnue-tools 445b53c](https://github.com/fairy-stockfish/variant-nnue-tools/tree/445b53c419d03d9167a786140a4d4bbe12ee7426), on branch `tools`. The requested `fairy-stockfish/training-data-generator` URL returns 404. The official training guide links to `variant-nnue-tools`.

The [official site](https://fairy-stockfish.github.io/) states support for custom variants, NNUE and UCI. Its old news dates do not establish the date of current source.

## Rules and custom pieces

Verified: an INI file can define custom pieces without a new build. The [configuration guide](https://github.com/fairy-stockfish/Fairy-Stockfish/wiki/Variant-configuration) gives the load and check commands. [variants.ini](https://github.com/fairy-stockfish/Fairy-Stockfish/blob/9f778da667f6e07dae1e85d3e2ea204fc6dee94d/src/variants.ini) documents a subset of Betza. [piece.cpp](https://github.com/fairy-stockfish/Fairy-Stockfish/blob/9f778da667f6e07dae1e85d3e2ea204fc6dee94d/src/piece.cpp) parses quiet and capture geometry, direction, riders, hoppers, initial moves and related movement limits. It does not provide a general action script.

The configuration also has rules beyond movement. Examples include atomic blast, drops, check counts and petrification. Thus the old claim that the engine is only a movement language is too broad. However, these are fixed engine rules. They do not give arbitrary King Down effects.

Comparison with current [MATRIX.md](../MATRIX.md):

| King Down effect | Finding |
|---|---|
| Archer shoots and stays on its square | The custom-piece parser has no rifle action. Exact support needs engine work. |
| Maester swaps; Ogre pushes and follows | These are changes to several occupied squares. No general swap or push action appears in the checked custom-piece interface. |
| Beast captures in a chain | The checked Betza parser has no general multi-leg continuation. A path/action encoding and legal-turn rules need a separate design. |
| Paladin passes friends and dies after non-pawn captures | Existing petrification turns a capturer into a wall. This is not the empty square or victim-type condition of King Down. |
| Guard capture restrictions; king-specific immunity | Existing fixed immunity options do not establish a general attacker-by-victim rule for King Down. |
| Freeze marks, power uses, cards, extra moves | These require explicit turn and state support. A piece movement definition is insufficient. |

Inference: an exact port must cover legal actions, check, terminal results, make/undo, repetition keys, search and serialization. Multi-square actions also need complete NNUE change tracking. These are acceptance requirements, not a measured effort estimate.

## NNUE features and compatibility

Verified: the [trainer introduction](https://github.com/fairy-stockfish/variant-nnue-pytorch/wiki/Introduction) says custom variants can train. The [FAQ](https://github.com/fairy-stockfish/variant-nnue-pytorch/wiki/FAQ) gives a 15-piece-type limit and position-size limits. Custom pieces are not excluded.

The [engine feature code](https://github.com/fairy-stockfish/Fairy-Stockfish/blob/9f778da667f6e07dae1e85d3e2ea204fc6dee94d/src/nnue/features/half_ka_v2_variants.cpp) uses piece type, colour, square, king square and optional pocket counts. It updates features from changed pieces. It does not encode King Down card hands, remaining uses or temporary marks. The FAQ gives a useful precedent: check counts use an extra evaluation term because NNUE does not see them.

Inference: two positions with equal boards but different Freeze state or power uses can receive equal raw NNUE values. A complete evaluation must add state features, add tested external terms, or use another state-aware design. Search still needs the exact state in every case. A card hand is not automatically equivalent to a pocket of board pieces.

The [architecture](https://github.com/fairy-stockfish/Fairy-Stockfish/blob/9f778da667f6e07dae1e85d3e2ea204fc6dee94d/src/nnue/nnue_architecture.h) uses a 512-wide feature transform, eight PSQT buckets and eight layer stacks, with 16- and 32-unit hidden layers. The [technical guide](https://github.com/fairy-stockfish/variant-nnue-pytorch/wiki/Technical-details) describes generalized HalfKAv2. This is not a drop-in standard Stockfish net, nor a net for our proposed small TypeScript evaluator. Feature order, dimensions, symmetry, scales and file format must match at both ends.

For an 8×8 board with 11 types including one king type, no pockets and 64 king squares, the documented feature formula gives `64 × 64 × 21 = 86,016` features. The transform weights alone need about `86,016 × 520 × 2 = 89,456,640` bytes (85.3 MiB). This is a hypothetical roster, not a size measured from a King Down build. The FAQ says nets above 80 MB use the large-board build even for an 8×8 variant. Thus the old report's size concern is real, but its “dead” conclusion is not supported. Browser download cost remains a separate product concern.

## Data and training recipe

Verified: the [generation guide](https://github.com/fairy-stockfish/variant-nnue-pytorch/wiki/Training-data-generation) uses engine self-play with random opening moves or MultiPV choices. It can start from FEN/EPD lines. Search supplies score labels; finished games supply result labels. Quiet-position filters affect which samples survive.

The [record structure](https://github.com/fairy-stockfish/variant-nnue-tools/blob/445b53c419d03d9167a786140a4d4bbe12ee7426/src/tools/packed_sfen.h) stores a packed position, signed 16-bit score, 16-bit move field, ply and signed game result. The normal record is 72 bytes with a 512-bit position. The [generator](https://github.com/fairy-stockfish/variant-nnue-tools/blob/445b53c419d03d9167a786140a4d4bbe12ee7426/src/tools/training_data_generator.cpp) assigns the search value and later assigns the result from the side-to-move view. The trainer supports `.bin`, not `.binpack`. This variant format is incompatible with the official Stockfish trainer. `largedata=yes` expands packed positions to 1024 bits; both loader settings and data must agree.

The [loss code](https://github.com/fairy-stockfish/variant-nnue-pytorch/blob/b15df38a9aae8ab9b40b2378020b3099c7c5d179/model.py) can mix search-score targets and game-result targets. Its model constructor defaults to search scores only. Do not assume “self-play training” means results-only learning.

Proposed pipeline, subject to an approved spec and run go:

1. Freeze the rule subset and full state schema. Record unsupported actions.
2. Implement exact engine and generator rules. Prove legal-action, make/undo and terminal-result parity against the TypeScript engine. Test state round trips through the data format. Do this before bulk generation.
3. Use `trainer_config <variant> <trainer-directory>` to write `variant.h` and `variant.py`. Check piece count, board size, king mapping and data size. Rebuild the C++ loader. Add state features and packing if the chosen evaluation needs them.
4. Generate a small fixture with classical evaluation first. Check labels, results, moves and state. Then request the planned CPU data run on the approved machine. Upstream's 100M-position advice is a scale reference, not authorization or a King Down requirement.
5. Keep training and validation games separate. Train with `train.py` on a CUDA GPU. Export the chosen checkpoint with `serialize.py`. Pin engine, generator, trainer and configuration revisions.
6. Compare exported inference with training inference. Test the net against the same engine without it, with paired starts and equal resources. Use held-out armies and state cases. A lower training loss alone does not prove stronger play.

The [trainer README](https://github.com/fairy-stockfish/variant-nnue-pytorch/blob/b15df38a9aae8ab9b40b2378020b3099c7c5d179/README.md) requires a CUDA-capable GPU. Python, CMake and a C++17 compiler support training and its loader. CPU search/data generation and CPU NNUE inference are separate from GPU training. This checked path does not establish Apple GPU support. No dependencies or training jobs are installed or started for this report.

## Distribution facts and open limits

The [engine license](https://github.com/fairy-stockfish/Fairy-Stockfish/blob/9f778da667f6e07dae1e85d3e2ea204fc6dee94d/Copying.txt) is GPLv3. Source headers allow version 3 or later. The upstream README says distribution must include source, or a pointer to source that builds the exact binary, and that distributed source changes remain under GPL. These are upstream statements. This report does not decide the legal scope of a combined app or the license of a separately trained net. Verify those facts before distribution.

Main blockers are rule parity, complete state packing/features, a stable action format, and data cost. No measured port effort, training time, speed or playing strength is available here. The September report's five-piece roster and Beast geometry are also stale: current MATRIX.md includes Ogre and later Beast rules. Reuse its historical findings only after a current check.
