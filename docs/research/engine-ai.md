# Engine & AI research — King Down Chess

Researched 2026-09-13. Every version, date and license below was checked live against the
upstream source (GitHub API, npm registry, PyPI, raw source files) on that date, not from memory.
Claims I could not verify are marked **[unverified]**.

---

## Recommendation (read this part)

**Build the rules engine and the AI yourself in TypeScript. Do not adopt, fork or wrap
Fairy-Stockfish.**

The reason is short. Every one of your five pieces has a *signature mechanic* that no
config-driven variant engine on the market can express. Fairy-Stockfish, Sjaak II, ChessV and
Fairy-Max all share the same shape: their variant files are **move-generation DSLs** ("where can
this piece go"), not **rules DSLs** ("what happens when it gets there"). Rifle capture,
self-removal on capture, swap-with-friendly, per-attacker capture immunity and chain capture are
all "what happens" rules. Fairy-Stockfish's maintainer has said so publicly, and the constraint is
visible in a `static_assert` in the source.

| Tier | Do this | Effort |
|---|---|---|
| **1 — now** | TS rules engine (data-driven piece table, 10x12 `Int8Array` mailbox) + **negamax alpha-beta** with iterative deepening, Zobrist TT, MVV-LVA, killers, quiescence, in a Web Worker. **Not MCTS.** | 1–2 weeks, ~1500 lines |
| **2 — only if measured** | Keep the TS engine as the spec and the perft oracle. Port the hot loop (movegen + make/unmake + search) to Rust → WASM, same piece table. Expect 5–15x nodes. | Weeks. **Probably never needed.** |
| **3 — later** | A small perspective NNUE, `2 x 11 x 64 = 1408 → (256x2) → 1`, int16-quantised, ≈ **0.72 MB**. Self-play data from your own tier-1 engine. Train in PyTorch (~150 lines). Run inference in plain TS with `Int16Array` accumulators. No ONNX Runtime, no TF.js, no WebGPU — at batch size 1 they all lose to a hand-written accumulator (§B.5). | A weekend of code, days of CPU for data |
| **4 — probably never** | AlphaZero-style self-play ([minizero](https://github.com/rlglab/minizero), Apache-2.0, is the one to use). Needs a C++ rules engine *first*, so it is downstream of tier 2, not an alternative to it (§B.3). | Weeks of GPU + a C++ port |

Three numbers that decide it:

1. A Fairy-Stockfish HalfKAv2 net *for your variant* would be ≈ **94 MB**
   (`64 squares x 64 king squares x 11 piece types x 2080 B`, per
   [their own formula](https://github.com/fairy-stockfish/variant-nnue-pytorch/wiki/Technical-details#file-size)).
   Fairy-Stockfish itself cannot load nets over 80 MB in the standard 8x8 build. That path is dead
   for a web game before you write a line.
2. A "768-style" net for your 11 piece types is ≈ **0.72 MB**. [Lozza](https://github.com/op12no2/lozza)
   (MIT, pure JS, active 2026-07-10) ships a complete NNUE engine — search, movegen, embedded net —
   in **291 KB gzipped**, running in a Web Worker with no WASM at all. That is your template.
3. `fairy-stockfish-nnue.wasm` is **GPL-3.0** and is a pthreads build: shipping it means serving
   COOP/COEP headers *and* conveying GPL source to every visitor. Since you have to write the rules
   layer anyway, the GPL question never has to come up.

One design decision carries most of the weight: **do not represent a move as `(from, to)`.**
Represent it as `{ piece, from, to, effects: [{square, before, after}] }`. Archer rifle captures
(capturer does not move), paladin kamikaze (two squares emptied), maester swaps (two pieces move),
and beast chains (N squares emptied) all fall out of that one shape, and undo becomes trivial.
Getting this wrong is the mistake that forces a rewrite later — it is exactly the mistake that
blocks Fairy-Stockfish.

---

## Comparison table

| Option | Current? | License | Expresses your 5 pieces | In browser | Verdict |
|---|---|---|---|---|---|
| **Fairy-Stockfish** (`variants.ini`) | Yes — commit 2026-09-06, 905 stars | GPL-3.0 | **0 / 5** complete. 3 movement patterns only | via WASM | **No.** All 5 signature rules need C++ core work |
| Fairy-Stockfish **forked + patched C++** | — | GPL-3.0 | Possible | via WASM | **No.** 5 core features, one of them (chain capture) blocked by move encoding. Permanent fork of 6,671 commits |
| `ffish` / `ffish-es6` (rules only, WASM) | 0.7.10, 2026-08-26 | GPL-3.0 | Same limits as above | Yes, 922 KB `.wasm` | Useful as a *reference implementation of variant plumbing*, not as your engine |
| `fairy-stockfish-nnue.wasm` (full engine) | 1.1.12, 2026-08-26 | GPL-3.0 | Same limits | Yes, 1.64 MB `.wasm`, **needs SharedArrayBuffer** | No |
| **Sjaak II** | **Dead** — 1.4.1, Dec 2016 | GPL | 0 / 5. Docs: *"capture is replacement only"* | No | No |
| **ChessV 2.2** | Jan 2020 | GPL | 0 / 5. Site: *"creation of new rules is not supported"* | No (C#/WinForms) | No |
| **Ludii** | 1.3.14, 2025-06 | **CC BY-NC-ND 4.0** | Probably 4–5 / 5 **[unverified]** | No (JVM) | **Legally unusable** — non-commercial *and* no-derivatives |
| **Jocly** | 2024-06 | **AGPLv3** (+ paid exception) | Yes (hand-written JS per game) | Yes | No — AGPL on a hosted service |
| **Zillions of Games** | 2.0.1, **2003** | Proprietary | — | No | No |
| **HGM Interactive Diagram** (`betza.js`) | Live, maintained | **No license header — all rights reserved** | **~4.5 / 5 declaratively** | Yes (JS) | **Cannot reuse the code. Copy the rule taxonomy — it is the best design reference that exists** |
| `chessops` | 0.15.1, 2026-07-12 | GPL-3.0-or-later | No — `ROLES` is a frozen 6-item union | Yes | No |
| `chess.js` | 1.4.0, 2025-06-14 | BSD-2 | No — monolithic standard chess | Yes | Reference only |
| `chessgroundx` (board UI) | 10.7.5, 2026-05-12 | GPL-3.0 | n/a — but genuinely piece-agnostic | Yes | **Best-fit board UI** if GPL is acceptable |
| `react-chessboard` (board UI) | 5.12.1, 2026-08-16 | **MIT** | n/a — custom piece renderers | Yes | **Best-fit board UI if you want a permissive license** |
| **Write it in TS** | — | yours | 5 / 5 | Yes | **This one** |

---

## A. Engines for move generation and search

### A.1 Fairy-Stockfish, piece by piece

**Repo status (verified 2026-09-13, GitHub API):** `fairy-stockfish/Fairy-Stockfish`, **GPL-3.0**,
905 stars, 278 forks, **126 open issues + 28 open PRs**, last commit **2026-09-06** ("Avoid evaluating positions
ended by variant rules in eval trace", #1039). Actively maintained. Note the last *tagged release*
is `fairy_sf_14` from **2021-09-10** — everything current comes from `master` or CI artifacts, not
from releases.

**What `variants.ini` actually gives you.** I read the file
([raw source, 2126 lines](https://raw.githubusercontent.com/fairy-stockfish/Fairy-Stockfish/master/src/variants.ini))
rather than trusting the wiki. It exposes ~150 rule flags and `customPiece1..25` defined in Betza
notation. But the Betza support is a *documented subset*, and I confirmed the exact subset by
reading the parser itself
([`src/piece.cpp`, `from_betza()`](https://github.com/fairy-stockfish/Fairy-Stockfish/blob/master/src/piece.cpp)):

- Atoms: `W F D N A H L C J Z G K` (leapers), `R B Q` (riders)
- Modifiers: `m` (quiet only), `c` (capture only), `p`/`g` (hopper/grasshopper), `n` (lame leaper),
  `i` (initial move only), `e` (en passant), directions `f b v h r l s`, digits for range
- That is the whole list. There is **no modifier for capture-without-moving, no modifier for
  friendly-transparent sliding, no swap, and no multi-leg (XBetza `a`) continuation.**

| Piece | Movement in `variants.ini` | Signature rule | Overall |
|---|---|---|---|
| **ARCHER** | `mW` — exact | **NO.** Rifle capture (remove without moving) is not expressible | **NO** |
| **PALADIN** | **NO.** No friendly-transparent rider | **PARTIAL** kamikaze via `petrifyOnCaptureTypes`; **NO** for "cannot capture a king" | **NO** |
| **GUARD** | `mK` — exact | **NO** today. PR #912 adds blanket `ironPieceTypes`, but there is no "except by king" | **NO** |
| **MAESTER** | `K` (commoner) — exact for move+capture | **NO.** No swap move type; castling geometry is fixed, so no long king swap | **NO** |
| **BEAST** | `mfWcFcbWcsW` — exact for a *single* capture | **NO.** Chain capture is blocked by the 32-bit move encoding | **PARTIAL** |

**ARCHER — NO.** Its *attack geometry* is expressible (`cF` + `cD`: diagonally adjacent plus the
jumping 2-square orthogonal Dababba leap). Its *semantics* are not: in Fairy-Stockfish a capture is
always a displacement. The best approximation, `mWcFcD`, makes the archer move onto the victim's
square — a different game. The maintainer, on
[issue #368 "Capture by something other than displacement?"](https://github.com/fairy-stockfish/Fairy-Stockfish/issues/368)
(open since 2021-09):

> "Capturing by other means than displacement is something that I was considering, but so far
> seemed like adding a lot of complexity. [...] Combining non-displacement captures with a royal
> king seems very difficult to achieve in Fairy-Stockfish, which is why atomic uses a workaround
> with 'pseudo-royal' commoners."

H.G. Muller (author of XBoard and of the chessvariants Interactive Diagram), on
[issue #1038, 2026-09-03](https://github.com/fairy-stockfish/Fairy-Stockfish/issues/1038):

> "FSF does not support such non-replacement capture, (unless e.p. capture would be generalized),
> and certainly not multiple capture (other than Atomic)."

That single sentence kills the Archer and the Beast in one go, and it is three weeks old.

**PALADIN — NO, in three separate ways.**

1. *Jumps friendly pieces, blocked by enemies.* Not in the Betza subset. `Q` is blocked by both
   colours; `pQ` (Janggi-cannon style) must hop over exactly one piece. Neither is right. The
   underlying primitive — "compute slider attacks against enemy occupancy only" — would actually be
   a **small** C++ change, because attacks already funnel through one function:
   ```cpp
   inline Bitboard attacks_bb(Color c, PieceType pt, Square s, Bitboard occupied) {
     Bitboard b = LeaperAttacks[c][pt][s];
     RiderType r = AttackRiderTypes[pt];
     while (r) b |= rider_attacks_bb(pop_rider(&r), s, occupied);
     return b & PseudoAttacks[c][pt][s];
   }
   ```
   ([`src/bitboard.h:473`](https://github.com/fairy-stockfish/Fairy-Stockfish/blob/master/src/bitboard.h)).
   Passing `occupied & pieces(~us)` for a flagged piece type would do it — but there are **67 call
   sites in `position.cpp` alone**, and several assume a single colour-agnostic occupancy.
2. *Cannot capture a king / never gives check.* This needs an attacker-by-victim capture matrix.
   It is proposed but **not implemented**:
   [issue #1005 "Prohibited Captures"](https://github.com/fairy-stockfish/Fairy-Stockfish/issues/1005)
   (opened 2026-06, `prohibitedCapturesWhite = l:ln`), and H.G. Muller's comment on
   [#606](https://github.com/fairy-stockfish/Fairy-Stockfish/issues/606) recommending exactly a
   "2-dimensional (boolean) array indexed by attacker and victim type ('capture matrix')".
3. *Kamikaze* — **the one genuine PARTIAL.** `petrifyOnCaptureTypes` is per-capturing-piece-type and
   removes the capturer, which is the right trigger. From
   [`src/position.cpp:2000-2064`](https://github.com/fairy-stockfish/Fairy-Stockfish/blob/master/src/position.cpp):
   ```cpp
   Bitboard blast = blast_on_capture() ? (...)
                    : var->petrifyOnCaptureTypes & type_of(pc) ? square_bb(to) : Bitboard(0);
   ...
   remove_piece(bsq);
   ...
   if (bsq == to ? bool(var->petrifyOnCaptureTypes & type_of(bpc)) : var->petrifyBlastPieces)
       st->wallSquares |= bsq;   // <-- leaves a permanent wall, not an empty square
   ```
   So `petrifyOnCaptureTypes = <paladin>` gives you kamikaze **plus a permanent wall square** on the
   capture square. Wrong game. Making it optional would be a genuinely small patch (one new
   `PieceSet` option that skips the `wallSquares` line).

   For completeness: the `blastOnCapture` + `blastImmuneTypes` combination looks like it could fake
   kamikaze, but it cannot. `blastOnCapture` is a **global** flag while `blastImmuneTypes` is a piece
   set, so making everything-but-paladin immune means *any* capture next to a paladin also destroys
   the paladin (`attacks_bb<KING>(to)` covers all adjacent squares). Broken.

**GUARD — NO.** `mK` is exact for the movement (king step, quiet only, cannot capture). The
immunity is the problem. [Issue #606 "Addition of Iron/uncapturable pieces"](https://github.com/fairy-stockfish/Fairy-Stockfish/issues/606)
is open since 2023-03; [PR #912](https://github.com/fairy-stockfish/Fairy-Stockfish/pull/912)
("Adds `Variant::ironPieceTypes`") has been **open and unmerged since 2025-09-05**, last touched
2025-10-13. Even merged, it gives blanket immunity — "capturable by *no* type" — not your
"capturable by the king only". That needs the capture matrix from #1005, which does not exist.

**MAESTER — NO.** `K` is exact for move-and-capture. There is no swap. Fairy-Stockfish's move types
are a closed enum, and the encoding is nearly full (see Beast below). The long maester–king
first-rank swap cannot be faked with castling either: castling in Fairy-Stockfish always sends the
king to a fixed file (`castlingKingsideFile`, default `g`), not to the partner's square.

**BEAST — PARTIAL.** A single capture is exactly expressible: `mfWcFcbWcsW` (quiet step forward;
capture on all four diagonals, backward, and both sides). The **chain is the hard blocker**, and the
reason is in the source, not in an opinion:

```cpp
static_assert(2 * SQUARE_BITS + MOVE_TYPE_BITS + 2 * PIECE_TYPE_BITS <= 32,
              "Move encoding uses more than 32 bits");
```
([`src/types.h:435`](https://github.com/fairy-stockfish/Fairy-Stockfish/blob/master/src/types.h))

With `SQUARE_BITS = 7`, `MOVE_TYPE_BITS = 4`, `PIECE_TYPE_BITS = 6` that is **30 of 32 bits already
spent**. A variable-length capture path does not fit. The maintainer said the same in 2021:

> "The main problem with checkers for Fairy-SF is the encoding of moves, since multi-capture moves
> can introduce combinatorial complexity that does not fit into the 32 bit used for moves unless you
> come up with a smart encoding."

A [`multimove` branch](https://github.com/fairy-stockfish/Fairy-Stockfish/tree/multimove) exists but
its last commit is **2022-05-21** — abandoned for over four years.

**What forking Fairy-Stockfish would actually cost.** Five core features: non-displacement capture,
friendly-transparent riders, an attacker-by-victim capture matrix, a swap move type, and
variable-length chain moves. Each touches move encoding, `do_move`/`undo_move`, `gives_check()`,
SEE, movegen, repetition hashing and NNUE dirty-piece tracking. The maintainer's stated policy on
comparable requests, from [issue #167](https://github.com/fairy-stockfish/Fairy-Stockfish/issues/167):

> "would introduce quite some additional complexity to the code base, which would be an overhead for
> maintenance, therefore I currently do not plan to implement"

meaning none of this lands upstream and you maintain a permanent fork of a 6,671-commit C++
codebase — under GPL-3.0. Not worth it for a game whose rules are still moving.

**One thing Fairy-Stockfish *is* good for right now:** `pieceValueMg`/`pieceValueEg` plus a
deliberately-wrong approximation of your variant is a cheap way to get **sanity-check piece values**
before you tune your own. `chess960`-style shuffling is not needed — just pass a per-game FEN.

### A.2 The WASM / JS bindings

All verified against npm on 2026-09-13.

| Package | Version | Published | License | Payload |
|---|---|---|---|---|
| `ffish` | 0.7.10 | 2026-08-26 | GPL-3.0 | `ffish.wasm` **921,975 B** + `ffish.js` 126 KB |
| `ffish-es6` | 0.7.10 | 2026-08-26 | GPL-3.0 | same, ES6 build |
| `fairy-stockfish-nnue.wasm` | 1.1.12 | 2026-08-26 | GPL-3.0 | `stockfish.wasm` **1,636,293 B** + 64 KB glue |
| `pyffish` (PyPI) | 0.0.90 | 2026-08-26 | GPL3 | server-side binding |

All three are **maintained** — [`fairy-stockfish.wasm`](https://github.com/fairy-stockfish/fairy-stockfish.wasm)
was last pushed **2026-09-11**, two days before this research.

Two facts worth knowing even though you are not using them:

- **`ffish` can load a custom `variants.ini` at runtime, in the browser.** The API is
  `loadVariantConfig(variantInitContent: string): void` (from the shipped `ffish.d.ts`), exercised in
  [`tests/js/test.js`](https://github.com/fairy-stockfish/Fairy-Stockfish/blob/master/tests/js/test.js).
  That is a nice pattern to copy: one variant definition string, shipped to both client and server.
  pychess does exactly this with
  [`client/variantsIni.ts`](https://github.com/gbtami/pychess-variants/blob/master/client/variantsIni.ts).
- **`fairy-stockfish-nnue.wasm` requires cross-origin isolation.** I grepped the shipped
  `stockfish.js`: it is a pthreads build and aborts with *"Current environment does not support
  SharedArrayBuffer, pthreads are not available!"*. You would have to serve
  `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp`, which
  also breaks any third-party embed that is not CORP-tagged. A real operational cost you avoid by
  not using it.

### A.3 Other multi-variant engines

**Sjaak II** — dead. Newest is **1.4.1, December 2016**
([chessprogramming](https://chessprogramming.org/Sjaak_(Glebbeek))); the author's site has nothing
newer. The only git presence is a third-party mirror,
[RMKirkpatrick/SjaakII](https://github.com/RMKirkpatrick/SjaakII) (GPL-3.0, last push 2025-10-23, 0
stars). Its [`variants.txt`](https://raw.githubusercontent.com/RMKirkpatrick/SjaakII/master/variants.txt)
DSL has `slide`/`leap`/`step`/`hop` and flags `royal, set_ep, take_ep, drop_no_check, drop_no_mate,
drop_one_file, drop_dead, no_mate, shak, assimilate, no_retaliate, endangered, iron, capture_flag`.
The file states plainly: *"Currently, capture is replacement only."* Archer, paladin, maester and
beast are all impossible; `iron` has the same no-exception problem as Fairy-Stockfish's PR #912.

**ChessV 2.2** — January 2020, C#/WinForms, GPL. [chessv.org](http://www.chessv.org/) says it
itself: *"It supports combining existing pieces and rules, and even defining new pieces, but
creation of new rules is not supported."* Done.

**Ludii** — the most expressive option and the one you legally cannot touch. v1.3.14, GitHub-published
2025-06-08, repo [Ludeme/Ludii](https://github.com/Ludeme/Ludii) last pushed 2026-05-31. License is
**[CC BY-NC-ND 4.0](https://github.com/Ludeme/Ludii/blob/master/LICENSE)** — non-commercial *and*
no-derivatives. Its ludeme grammar has generic `(move Remove ...)`, `(move Hop ...)`, swap rules and
`(then ...)` consequences, so your pieces are probably expressible **[unverified per-piece]** — but
it is a JVM desktop app with a general MCTS AI, and the license forbids both commercial use and the
forking you would need.

**Jocly** — moved to [aclap-dev/jocly](https://github.com/aclap-dev/jocly), last push 2024-06-06,
**AGPLv3** with a paid proprietary exception. Arbitrary rules *are* possible (games are hand-written
JS classes), but AGPL on a hosted service is worse than GPL, and the codebase is two years stale.

**XBoard family** — [Fairy-Max](https://home.hccnet.nl/h.g.muller/CVfairy.html) reads a
self-documenting `fmax.ini` but is a pure Betza move-table engine capped at 15 piece types. HaChu is
hard-coded for the Chu Shogi family. No WASM path, no rule extensibility. Reference only.

**Zillions of Games** — last stable release **2.0.1, 2003**. Closed-source, Windows-only. No.

### A.4 The Interactive Diagram — your best design reference

This is the find of the research, and it is not an engine you can use — it is a **rule taxonomy you
should steal**.

H.G. Muller's [Interactive Diagram](https://www.chessvariants.com/page/MSinteractive-diagrams)
(`betza.js`, 185 KB of plain JS on chessvariants.com) declaratively supports, today, **almost your
exact rule set**:

| Your rule | Interactive Diagram feature (verbatim from the docs) |
|---|---|
| **Archer rifle capture** | Multi-leg XBetza. Documented example: `mRcaibR` — *"slider rifle capture (capture and move exactly back)"* |
| **Paladin kamikaze** | `captureMatrix` element `0` — *"a kamikaze capture is indicated by a 0 (zero); this will make both the capturer and captured piece disappear"* |
| **Guard: capturable by king only** | `captureMatrix` elements `!` / `?` — *"illegal for pieces of the given types to capture each other. This can be used to define iron pieces (capturable by no other type), or relatively iron (only capturable by some)"* |
| **Paladin cannot capture a king** | Same `captureMatrix` mechanism |
| **Chess960-style shuffle** | `shuffle=N!BRQK` |
| **Beast chain capture** | Multi-leg moves can capture on each leg, but an *unbounded* chain is **[unverified]** |
| **Maester swap** | **Not found.** Closest is the `x` modifier (relay: activates the piece on that square) — different rule |

And — directly relevant to your planned "army powers" — it already has a **`spell`** parameter with
values `burn, freeze, charm, hide, protect, brake`:

> *"freeze — an enemy piece standing in the spell zone cannot move at all. [...] protect — a
> friendly piece in the spell zone cannot be captured by the opponent. [...] hide — sliders can hop
> over friendly pieces in the spell zone."*

Your roadmap's "freeze an enemy piece for a turn", "make a piece uncapturable for a turn" and
"pieces jump own pawns" are literally three of those six. Read that page before you design your
piece-definition format; it is fifteen years of someone else's mistakes, free.

**But: `betza.js` carries no license header and no copyright notice** — I checked the file. No
license means all rights reserved. Do not copy the code. Copy the vocabulary. It also ships a
built-in AI, which is a lightweight demonstration search, not a competitive engine.

### A.5 Rules-only libraries and board UI (npm, verified 2026-09-13)

| Package | Version | Published | License |
|---|---|---|---|
| `chessops` | 0.15.1 | 2026-07-12 | GPL-3.0-or-later |
| `@lichess-org/chessground` | 10.1.1 | 2026-03-27 | GPL-3.0-or-later |
| `chessground` (old unscoped name) | 9.2.1 | 2025-05-15 | GPL-3.0-or-later |
| `chessgroundx` | 10.7.5 | 2026-05-12 | GPL-3.0 |
| `chess.js` | 1.4.0 | 2025-06-14 | BSD-2-Clause |
| `react-chessboard` | 5.12.1 | 2026-08-16 | MIT |

**`chessops` is not extensible for new pieces.**
[`src/types.ts`](https://github.com/niklasf/chessops/blob/master/src/types.ts) hard-codes
`export const ROLES = ['pawn','knight','bishop','rook','queen','king'] as const`, and the whole
library is 8x8 `SquareSet` bitboards with Hyperbola Quintessence attacks. Its variants (crazyhouse,
atomic, KotH, 3-check, antichess, horde, racing kings) are subclasses that override *outcomes*, not
the piece set. Adding an 11-piece roster means forking the type union, the FEN parser, SAN, and every
attack table — i.e. writing your engine anyway, but inside someone else's GPL shape.

**`chess.js` 1.4.0** is the most permissive (BSD-2) but is a monolithic 0x88 standard-chess
generator with no extension points. Reference only.

**Board UI is the one place to take a dependency.** Two good options:

- **`chessgroundx`** (the pychess fork, GPL-3.0, active) is genuinely piece-agnostic: it redefines
  lichess's frozen 6-item `Role` union as a template literal type
  (`` `${'' | 'p'}${Alphabet | '_'}-piece` ``), so any letter a–z is a valid piece rendered via a CSS
  class, on boards up to 16x16. Least work for 11 piece types. GPL-3.0.
- **`react-chessboard` 5.12.1** (MIT) supports custom piece renderers and is the only permissively
  licensed option. More work, no license question.

Plain lichess `@lichess-org/chessground` has the same frozen `Role` union as `chessops`. Do not
start there.

**There is no off-the-shelf data-driven fairy-piece rules library on npm.** I searched the registry
(`chess variant fairy pieces`, top 20 by relevance, 2026-09-13): the only variant-capable packages
are the Fairy-Stockfish bindings (`ffish`, `ffish-es6`), `chessops` (frozen 6-piece union),
`stockfish-mv.wasm` (last published **2021-02-27**, abandoned), and board-UI packages. Nothing to
reuse. The ladder bottoms out at "write it".

### A.6 pychess-variants — the architecture pattern to copy

[gbtami/pychess-variants](https://github.com/gbtami/pychess-variants), **AGPL-3.0**, 308 stars, last
push **2026-09-12**. Python + aiohttp + MongoDB server, TypeScript client.

The lesson is the **single source of variant truth**. `client/variantsIni.ts` is one template string
of Fairy-Stockfish INI. The same text is loaded by `pyffish==0.0.90` on the server (authoritative
validation) and by `ffish-es6` in the browser (instant legality and premove feedback), with
`fairy-stockfish-nnue.wasm` for client-side analysis and `fairyfishnet` for heavy work. Client and
server enforce identical rules *by construction*, not by discipline.

Copy that shape with your TS engine: one rules module, imported by both the browser and the server,
and the server always re-validates. **Copy the pattern, not the code** — it is AGPL.

### A.7 Licensing

**Fairy-Stockfish and everything derived from it is GPL-3.0** (verified via GitHub API and the
`variants.ini` header). That includes `ffish`, `ffish-es6`, `fairy-stockfish-nnue.wasm` and
`pyffish`.

**The Web Worker question has no clean answer.** The relevant test is the FSF's
[GPL FAQ on mere aggregation](https://www.gnu.org/licenses/gpl-faq.html#MereAggregation): pipes and
sockets are *"communication mechanisms normally used between two separate programs"*, but *"if the
semantics of the communication are intimate enough, exchanging complex internal data structures,
that too could be a basis to consider the two parts as combined into a larger program."* A Web
Worker exchanging UCI text over `postMessage` is a strong analogue of the pipe case — separate
address space, line-oriented text protocol, no shared structures.

Three things cut against relying on that:

1. **Shipping WASM to a browser is distribution.** GPLv3 §6 applies: you must convey complete
   corresponding source (or a written offer) to every visitor. GPLv3 has no AGPL network clause, so
   a purely *server-side* engine carries no source obligation — but a WASM engine in the page does.
2. **I found no statement from the Stockfish team or the FSF addressing WASM / Web Worker
   deployment specifically. [unverified]** That is a genuine gap, not an endorsement.
3. **The Stockfish team litigates.** They sued ChessBase in 2021; the
   [settlement of 2022-11-18](https://stockfishchess.org/blog/2022/chessbase-stockfish-agreement/)
   forced ChessBase to stop selling Stockfish-based products, appoint a Free Software Compliance
   Officer, and GPL its neural nets ([FSFE summary](https://fsfe.org/news/2022/news-20221212-01.en.html)).

Practical read: ship a GPLv3 WASM engine and you should plan to GPL the frontend, or keep the engine
server-side, or write your own. **Since the rules layer has to be yours anyway, the third option is
cheaper than it sounds — and it removes the question entirely.**

Other licenses: `chess.js` BSD-2, `react-chessboard` MIT, `bullet` MIT, Lozza MIT (per the current
`LICENSE` file — the chessprogramming wiki still says GPLv3, which appears stale **[flagged]**),
chessops/chessground/chessgroundx GPL-3.0-or-later, Ludii CC BY-NC-ND 4.0, Jocly AGPLv3,
pychess-variants AGPL-3.0.

---

## B. Machine learning and self-play

Short version: **Leela is a dead end, the Fairy-Stockfish NNUE pipeline is real and proven but
produces a 94 MB file for your variant, and the whole AlphaZero family is a much bigger project than
it looks.** The only ML worth doing in the next year is a small NNUE trained on your own engine's
self-play (§C.3).

### B.1 Leela Chess Zero — no variant support, and no fork

[LeelaChessZero/lc0](https://github.com/LeelaChessZero/lc0) is healthy — GPL-3.0, 3,209 stars, last
push **2026-09-12**, stable **v0.32.1 (2025-11-23)**, **v0.33.0-rc0 (2026-09-05)** — and it cannot
play your game.

A code search for `UCI_Variant` in the repo returns **zero hits**. `UCI_Chess960` exists
(`src/chess/uciloop.cc`), so Chess960/FRC is the only deviation from standard chess it understands.
[Issue #1563 "Please create Fairy-LC0"](https://github.com/LeelaChessZero/lc0/issues/1563) was closed
in June 2021 with the comment that variant support *"currently just isn't happening"*;
[issue #2336](https://github.com/LeelaChessZero/lc0/issues/2336) (opened 2025-11-01) is still open
with **no maintainer reply**. The [GSoC 2026 ideas page](https://lczero.org/contribute/gsoc/2026/)
lists twelve projects, none about variants. Searches for variant forks return nothing with more than
one star; [frpays/lc0-js](https://github.com/frpays/lc0-js) (Emscripten) died in April 2024.
**[unverified]** lc0's current stance is inferred from the 2021 closure plus silence, not from a
2026 statement.

**The lc0-shaped thing that does exist is [CrazyAra](https://github.com/QueensGambit/CrazyAra)** —
GPL-3.0, 292 stars, v1.0.6 released **2026-03-02**, but only 9 commits since 2025-01-01
(semi-maintained). It is an AlphaZero-style MCTS+NN *variant* engine, and its `.gitmodules` pulls in
**Fairy-Stockfish as a submodule**, with CMake options `MODE_BOARDGAMES`, `MODE_OPEN_SPIEL` and
`USE_RL`, plus `engine/src/rl/selfplay.cpp` and ONNX inference backends. It is the only existing
bridge from a Fairy-Stockfish `variants.ini` to an AlphaZero self-play loop and an ONNX net.
**[unverified]** Whether anyone has ever driven a *user-defined* variant through that loop — the
CMake option exists, real-world use is unconfirmed.

### B.2 The Fairy-Stockfish NNUE pipeline — proven, but the wrong output size

Pipeline: [Fairy-Stockfish](https://github.com/fairy-stockfish/Fairy-Stockfish) (engine) →
[variant-nnue-tools](https://github.com/fairy-stockfish/variant-nnue-tools) (data generator, GPL-3.0,
pushed **2026-09-11**) → [variant-nnue-pytorch](https://github.com/fairy-stockfish/variant-nnue-pytorch)
(trainer, pushed **2026-06-30**).

**The trainer is genuinely variant-agnostic.** Per its wiki: *"the training code is variant-agnostic
and other than those minor adaptations has no knowledge of the rules of the variants."* You edit only
`variant.h` / `variant.py` (`FILES`, `RANKS`, `PIECE_TYPES`, `PIECE_COUNT`, `KING_SQUARES`,
`DATA_SIZE`, `PIECE_VALUES`), and the data generator writes those files for you via
`trainer_config <variant> <dir>`. Architecture is HalfKAv2 with L1=512, L2=16, L3=32.

**It demonstrably works on exotic rules.** The [network list](https://fairy-stockfish.github.io/nnue/)
carries **146 published nets**, 35 of them trained during 2025, mostly by two or three individuals.
Elo gains over the handcrafted evaluation are large: chak **+2062**, breakthrough **+1522**,
antiantichess **+1309**, backrank **+1165** — and several of those (`backrank`, `capture`,
`captureall`, `checkmateless`) are explicitly labelled *"Custom defined variant"*, i.e. trained from
a user's own `variants.ini`. The pipeline really does learn new rules. Nets dated 2026 and later are
CC0.

**Compute is within indie reach — data generation, not training, is the long pole.**

| Step | Guidance (from the project's own wiki) |
|---|---|
| Positions needed | *"Usually at least 100M positions should be used to get decent results."* |
| Search depth | *"Depths 4-5 usually already give quite good results."* |
| Epoch size | *"One epoch is 20M positions"* → 200M positions ≈ `--max_epochs 10` |
| GPU | Kaggle's free **30 GPU-hr/week** is *"quite enough for NNUE training."* A 4090/5090 is ample |
| Env | `pytorch-lightning==1.9.5` pinned; a `requirements-CUDA128.txt` exists, so Blackwell works. The FAQ's "lightning <1.5.0" note is stale |

**[unverified]** No community-reported GPU-hour figures exist. The one discussion asking
([#789](https://github.com/fairy-stockfish/Fairy-Stockfish/discussions/789), 2024-08) has zero
replies. The numbers above are the project's guidance, not measured user reports.

**Three things disqualify this pipeline for King Down Chess:**

1. **Four of your five pieces cannot be described in `variants.ini`** (section A.1). The NNUE pipeline
   sits downstream of the engine, so you must fix the C++ first — and that is the expensive part, not
   the training.
2. **The resulting net would be ≈ 94 MB** (`64 x 64 x 11 x 2080`). Fairy-Stockfish's own FAQ says nets
   over 80 MB need the large-board build. Unusable as a web download.
3. **`variant-nnue-pytorch` ships no LICENSE file at all** — the GitHub API reports `license: null`
   and `contents/LICENSE` 404s. No licence means all rights reserved.

The pipeline is still worth reading as a **design reference**: the HalfKAv2 generalisation
(arbitrary board size, arbitrary piece count, variants without kings) and the 512-bit position
packing format are both directly instructive for your own trainer.

### B.3 AlphaZero-style frameworks, current in 2026

| Project | Last push / release | Stars | License | Pluggable rules? |
|---|---|---|---|---|
| [rlglab/minizero](https://github.com/rlglab/minizero) | 2026-08-18 | 142 | Apache-2.0 | **Best fit of the family** |
| [open_spiel](https://github.com/google-deepmind/open_spiel) | v2.0.2, 2026-08-12 | 5,478 | Apache-2.0 | Yes, incl. pure-Python games |
| [mctx](https://github.com/google-deepmind/mctx) | 2026-09-10 | 2,662 | Apache-2.0 | Search only — you supply `recurrent_fn` |
| [LightZero](https://github.com/opendilab/LightZero) | 2026-08-28 | 1,647 | Apache-2.0 | Yes; MuZero/EfficientZero/UniZero |
| [AlphaZero.jl](https://github.com/jonathan-laurent/AlphaZero.jl) | v0.5.5, 2025-12-12 | 1,334 | MIT | Yes (Julia) |
| [turbozero](https://github.com/jcbmrshll/turbozero) | 2026-08-09 | 112 | Apache-2.0 | Yes (JAX) |
| [KataGo](https://github.com/lightvector/KataGo) | v1.18.2, 2026-08-30 | 5,107 | MIT | **No** — Go-specific board layer |
| [alpha-zero-general](https://github.com/suragnair/alpha-zero-general) | **2025-01-01** | 4,513 | MIT | Dormant — use the [cestpasphoto fork](https://github.com/cestpasphoto/alpha-zero-general) (2026-05) |
| [muzero-general](https://github.com/werner-duvaud/muzero-general) | **2024-09-03** | 2,869 | MIT | Dormant |
| [pgx](https://github.com/sotetsuk/pgx) | **v2.6.0, 2025-03-06** | 648 | Apache-2.0 | Abandoned — 20 open PRs, none merged |
| Polygames (Meta) | **archived 2021** | — | — | Dead |

**If you ever do go AlphaZero, use minizero.** Maintained, Apache-2.0 (not GPL), C++ MCTS with
PyTorch training, implements AlphaZero *and* Gumbel AlphaZero/MuZero, and already ships 20+ games
including breakthrough, amazons and surakarta. Crucially its `BaseEnv` interface returns
`std::vector<Action> getLegalActions()` — **a dynamic move list**, so your beast chain captures do
not need fixed-shape gymnastics. `breakthrough.cpp` is about 14 KB, which is a realistic size target
for porting your rules.

**PGX is fast but abandoned and the wrong shape.** ~500K chess steps/s at batch 1024 on a single
A100 (**[unverified]** — read off a plot in the [paper](https://ar5iv.labs.arxiv.org/html/2303.17503),
not a table). Everything must be `jit`/`vmap`-clean on fixed shapes. Rifle, kamikaze and swap are
fine; the beast chain is not — a variable-length sequence forces a bounded `lax.while_loop` or a
"continue the chain" sub-turn hack. Combined with no merged PRs since March 2025, skip it.

**OpenSpiel** is the fastest way to prototype: implement in `open_spiel/python/games/` and call
`pyspiel.register_game()` — no C++ build. Its AlphaZero has been rewritten in JAX/Flax. But the docs
say plainly it *"is not designed to scale to superhuman performance in Go or Chess"*, and Python
games are an order of magnitude slower than C++. Two-week prototype, not a training run.

**KataGo: copy the techniques, not the code.** Playout cap randomisation, forced playouts + policy
target pruning, auxiliary heads (your analogue: material differential / piece survival), policy
surprise weighting, dynamic variance-scaled cPUCT — see
[KataGoMethods.md](https://github.com/lightvector/KataGo/blob/master/docs/KataGoMethods.md). The
[paper](https://arxiv.org/abs/1902.10565) claims ~50x computation reduction versus vanilla AlphaZero.

**Realistic single-GPU data points:**
- 9x9 Hex to near-perfect play: **one RTX 2080 Ti, under 3 hours**
  ([Scaling Scaling Laws with Board Games](https://ar5iv.labs.arxiv.org/html/2104.03113)), which also
  reports roughly **500 Elo per 10x compute**.
- Connect Four on an RTX 2070: 1–2 h per iteration x 15 iterations ≈ **15–30 h**
  ([AlphaZero.jl tutorial](https://jonathan-laurent.github.io/AlphaZero.jl/stable/tutorial/connect_four/)).
- alpha-zero-general on chess: **1–2 minutes per self-play episode** at 100 sims. Python-loop MCTS is
  the bottleneck, not the GPU. Do not use it.

Budget **days to ~2 weeks of 4090 time** for a genuinely strong 8x8 variant agent — *assuming a fast
C++ rules engine already exists*. A TypeScript rules engine in the self-play loop will not work.
That dependency is precisely why AlphaZero is a tier-4 project for you, not tier 3.

### B.4 Maia — not applicable now, worth copying later

[maia-chess](https://github.com/CSSLab/maia-chess) (GPL-3.0, 1,237 stars, no commits in 90 days),
[maia2](https://github.com/CSSLab/maia2) (MIT, v0.11.0, 2026-07-15), and
[maia3](https://github.com/CSSLab/maia3) (**AGPL-3.0**, created 2026-05-22,
[paper](https://arxiv.org/abs/2605.19091)); maia2's README now says *"Maia-3 is recommended for new
projects."*

**Relevance today: zero.** Maia's whole premise is supervised learning on millions of human Lichess
games to predict *human* moves at a target rating. You have no human corpus for King Down Chess, so
there is nothing to learn from. Note also the AGPL-3.0 on maia3 — a hazard for a hosted game.

The idea to steal once you have player data: **condition on skill level** to produce a beatable,
human-feeling opponent. That is a far better UX than a depth-limited engine, which blunders in
characteristically inhuman ways. Also note
[maia-platform-frontend](https://github.com/CSSLab/maia-platform-frontend) runs
`onnxruntime-web ^1.23.0` client-side — working prior art for the deployment shape.

### B.5 Browser inference in 2026

**onnxruntime-web** — npm `latest` **1.29.0 (2026-08-24)**; **v1.30.0 tagged on GitHub 2026-09-10**,
not yet on npm. The trap: the default import still gives you **JSEP, not the native WebGPU EP**. Per
[JSEP_Deprecation.md](https://github.com/microsoft/onnxruntime/blob/main/docs/JSEP_Deprecation.md)
you must `import 'onnxruntime-web/webgpu'`. The 1.29.0 notes say *"onnxruntime-web has announced the
deprecation of WebGL and JSEP. The native WebGPU EP is the recommended path going forward."*
**Do not use the WebGL backend.** Two more traps: ORT's `env.wasm.proxy` **cannot be combined with
WebGPU** (*"a GPU buffer is not transferable"*) — spawn your own worker; and service workers still
fail ([#20876](https://github.com/microsoft/onnxruntime/issues/20876), open since 2024). WASM threads
need COOP+COEP or they silently fall back to single-threaded SIMD.

**TensorFlow.js is effectively unmaintained.** `@tensorflow/tfjs` latest is **4.22.0, published
2024-10-21**; the 4.23.0-rc.0 from 2025-01-08 was never promoted.
[Issue #8719 "Is this project deprecated?"](https://github.com/tensorflow/tfjs/issues/8719) (opened
2026-06-10) has no maintainer reply. Weekly downloads: tfjs 366k versus onnxruntime-web 3.20M.
**[unverified]** There is no official deprecation statement — the silence is the finding.

**The decisive finding for us: at batch size 1, WebGPU loses.** A 2026 measurement
([arXiv:2604.02344](https://arxiv.org/abs/2604.02344)) puts per-dispatch cost at **32.8 µs** in
Chrome on an RTX 5090, **31.7 µs** in Safari on an M2, **66.5 µs** on an Intel iGPU — and
**~1,037 µs in Firefox**. A [follow-up](https://arxiv.org/abs/2608.08730) concludes *"dispatch
overhead, not kernel quality, is the bottleneck at batch size 1."* Consequences:

- Chrome/Safari give you only ~75–150 dispatches inside a 5 ms budget. A 6–10 block resnet is right
  at that cliff after fusion.
- **Firefox is unusable for small nets on WebGPU** — five dispatches would eat the whole budget.
- Measured at batch 1: **EfficientNet ~80 ms on WASM SIMD versus ~1100 ms on WebGPU** on an RTX 4090
  ([gpuweb discussion #5292](https://github.com/gpuweb/gpuweb/discussions/5292)).

WebGPU only wins if you **batch** — which means MCTS leaf evaluation, which means the AlphaZero
project you are not doing. For an alpha-beta engine calling eval once per node, **a hand-written
`Int16Array` NNUE in the Worker beats every framework**, by a lot, and adds zero megabytes. That is
section C.3.

One NPS anchor, dated but useful: lichess measured
[stockfish.wasm](https://github.com/lichess-org/stockfish.wasm/pull/21) at *"1000 knps wasm master /
10 knps wasm nnue / 60 knps wasm nnue with `-msimd128`"* against 1000 knps native NNUE (2020, so
pessimistic today).

---

## C. Recommended architecture

### C.1 Tier 1 — the AI to build now

**Alpha-beta, not MCTS.** Your game is capture-dense and tactical: rifle shots, kamikaze trades and
chain captures all produce sharp, forcing lines. Alpha-beta with a quiescence search resolves those
exactly; MCTS without a trained policy network is weak in chess-like games and would need the net
you do not have yet. Build the alpha-beta engine; it is also the data generator for tier 3.

The stack, in order:

1. **Board:** `Int8Array(120)` — a 10x12 mailbox with a sentinel border. This is what both
   [Tonnetto](https://github.com/marcobuontempo/tonnetto) (TS, MIT, ~20 KB, ~1600 Elo) and
   [Lozza](https://github.com/op12no2/lozza) use. Skip bitboards: JS needs `BigInt` (slow) or split
   32-bit halves (fiddly), and your pieces have irregular attack sets that magic bitboards do not
   help with anyway.
2. **Piece table, data-driven.** One record per piece type: step vectors, slide vectors, a
   `friendlyTransparent` flag (paladin), a `canCapture` flag (guard: no), `captureMask` /
   `quietMask` split (archer, beast), `riflesInsteadOfMoving` (archer), `selfDestructsOnCapture`
   (paladin), `swapsWithFriendly` (maester), `chains` (beast), and a `capturableBy` set (guard:
   `{king}`). That set of ten flags covers all five pieces *and* most of your roadmap.
3. **Move shape.** As above: `{ piece, from, to, kind, effects: [{square, before, after}] }`. Undo
   replays `effects` backwards. Do not try to pack it into an integer.
4. **Search:** negamax + iterative deepening + aspiration windows + Zobrist transposition table
   (two `Int32Array` halves, not `BigInt`) + MVV-LVA ordering + killer moves + history + quiescence.
5. **Eval:** material + piece-square tables to start. **Do not port chess PSTs** — your back rank is
   randomised, so file-indexed opening tables are meaningless. Use mobility, king safety and
   piece-specific terms (an archer near the enemy king is worth a lot; a guard in front of your king
   is a wall nothing can remove).
6. **Legality:** make the move, then test whether your king is attacked. Slower than incremental pin
   detection, obviously correct with weird pieces. Optimise only if profiling says so.

Expected: depth 5–7 in about a second, roughly 1600–1900 strength equivalent. That is a good
opponent for a web game, and it is where you should stop until players tell you otherwise.

### C.2 Tier 2 — getting a strong engine

**Do not fork Fairy-Stockfish.** Section A.1 is the evidence: five core features, one of them
(chain capture) blocked by a `static_assert`, all of them declined upstream, all of it under GPL-3.0
on a 6,671-commit C++ codebase. You would spend months and then own a fork forever.

**Do not write a bitboard engine from scratch either** — not first. The order is:

1. **Optimise the TS.** Zero allocation in movegen (pre-sized move buffers, integer-encoded moves
   where the effects list is empty — which is most moves), typed arrays everywhere, no closures in
   hot loops. Most JS engines leave 3–5x on the table here.
2. **Then measure.** If tier 1 hits its strength ceiling in real games, and only then:
3. **Port the hot loop to Rust → WASM**, reusing the *same* data-driven piece table, and keep the TS
   engine as the conformance oracle. Write a perft suite against the TS engine first; it becomes
   your regression test for the port. Expect 5–15x nodes, which is roughly +2 plies, which is
   roughly +150–250 Elo.

Keep the TS engine as the single source of truth regardless. A second implementation that disagrees
with the first is a bug factory — pychess avoids it by shipping one variant definition to both
sides; you avoid it by shipping one piece table to both sides.

**The honest counter-argument, and why I still say no.** There is a coherent case for patching
Fairy-Stockfish's C++ *first*: one investment unlocks a strong classical engine, the whole NNUE
training pipeline, CrazyAra's self-play loop (`MODE_BOARDGAMES` already links Fairy-Stockfish as a
submodule), and `ffish` in the browser as a cross-check on your own rules. That is a lot of
downstream value from one piece of work, and if your rules were frozen it would probably be the
right call.

They are not frozen. Army powers and card effects are on the roadmap, and each one is another core
patch to a codebase whose maintainer has repeatedly declined comparable features for maintenance
reasons. You would be paying the fork tax again and again, in C++, in someone else's design, under
GPL-3.0 — and the NNUE payoff at the end is a 94 MB file you cannot ship to a browser anyway. Build
the rules where the rules will keep changing: in your own TypeScript.

### C.3 Tier 3 — a neural evaluation

**Architecture: a perspective NNUE, not HalfKA, and not a policy network.**

Inputs: `2 colours x 11 piece types x 64 squares = 1408` features per perspective. Net:
`1408 → (256 x 2) → 1` with squared ReLU, int16-quantised. Weights ≈ `1408 x 256 x 2 B ≈ 720 KB`,
plus a trivial output layer.

Why not the Fairy-Stockfish architecture: HalfKAv2 buckets every feature by king square, multiplying
size by 64. Using their own formula, `SIZE >= SQUARES x KING_SQUARES x PIECE_TYPES x 2080` gives
`64 x 64 x 11 x 2080 ≈ 94 MB` for your variant. Their own FAQ says nets over 80 MB will not load in
the standard 8x8 build. And king-bucketing is *less* useful for you anyway: your back rank is
randomised, and a maester can teleport the king across the board, so "king square" is a much weaker
conditioning signal than in chess.

**Reference point:** Lozza's shipped net is `768 → (256x2) → 1`, quantised at `QA=255, QB=64`,
embedded as base64 in `src/weights.js` (526 KB of base64 ≈ 394 KB binary). The **entire engine plus
net** is 655 KB raw, **291 KB gzipped**. Scaling 768 → 1408 inputs roughly doubles the weights.
Still a completely ordinary web asset.

**Data.** Self-play from your tier-1 engine. Fairy-Stockfish's own guidance is the best anchor for
"how much":

> "The `count` and `depth` of the training data are the main factors influencing the strength of the
> resulting NNUE net. Usually at least 100M positions should be used to get decent results. [...]
> Depths 4-5 usually already give quite good results."
> — [variant-nnue-pytorch wiki](https://github.com/fairy-stockfish/variant-nnue-pytorch/wiki/Training-data-generation)

For an indie: 20–50M positions at depth 4–6, multi-threaded on a desktop CPU, is a few days of
wall-clock and gets most of the benefit. Store `FEN | score_cp | result` lines — that is the format
`bullet` ingests directly, which keeps the upgrade path open. Randomise the back rank across the
data set; a net trained on one setup will not generalise.

**Trainer.** Write ~150 lines of PyTorch. Sparse input, two shared-weight accumulators, squared
ReLU, a scalar output, MSE against a blend of search score and game result, then quantise to int16.
[`bullet`](https://github.com/jw1912/bullet) (MIT, 236 stars, last push **2026-08-29**) is faster
and is what most strong engines now use, but its built-in loaders (`SfBinpackLoader`,
`ViriBinpackLoader`, `bulletformat`) are chess-specific — you would write a custom loader in Rust.
Its docs do say *"You can easily write a dataloader for your own format if you wish"*, so it is a
clean tier-3.5 upgrade. **Start with PyTorch.**

**Inference in the browser: plain TypeScript.** `Int16Array` accumulators, incrementally updated on
make/unmake. Do not reach for ONNX Runtime Web, TF.js or WebGPU — for a 1408→256 net the runtime
overhead and the extra megabytes dwarf the compute, and you lose incremental updates, which are the
entire point of NNUE. Lozza is the existence proof.

**Do this last, and expect to redo it.** Every rule change — a new army power, a new card effect —
changes the input distribution and can change the input *features*. Design the feature extractor
with spare planes now (a per-piece "frozen" bit, an "uncapturable this turn" bit), or accept that
you retrain.

### C.4 Gotchas — the things that will bite

These are the specific consequences of your five pieces. Several of them break assumptions that are
so standard in chess code that they are usually invisible.

**1. Archer checks cannot be blocked.** The archer shoots over intervening pieces. So when an archer
gives check, "interpose a piece" is **not** a legal evasion — only capturing the archer or moving
the king works. Standard check-evasion generators emit blocking moves along the check ray; yours
must not, for archer (and beast, which checks from an adjacent square) checks. Get this wrong and
you will declare legal positions illegal and miss mates.

**2. Archer rifle captures break SEE and quiescence.** There is no destination square, therefore no
recapture. Static exchange evaluation is undefined for a rifle capture: the archer takes the piece
and stays safe behind its own lines. Consequences: never SEE-prune a rifle capture; always include
rifle captures in quiescence; and treat "piece is defended" as *not* a defence against an archer.
This also means archers are worth much more than their move pattern suggests — they capture
defended pieces for free.

**3. Paladin attacks must be excluded from the king-danger map.** The paladin cannot capture a king,
so a square attacked *only* by a paladin is **safe** for the king. If you compute one "squares
attacked by the enemy" bitboard and use it for both check detection and king-move legality, you will
wrongly forbid legal king moves. Maintain two maps, or tag attacks by source piece type.

**4. Paladin friendly-transparency breaks pin logic.** A paladin attacks *through* its own pieces,
so it defends squares your normal x-ray code will not see, and it cannot be blocked by your own
pieces (only by enemy ones — which means the *enemy* can block a paladin by putting a piece in front
of it, the reverse of the usual intuition). Also: a paladin capture always costs the paladin, so in
SEE every paladin capture is `victim_value - paladin_value`, never `victim_value`.

**5. Guard immunity breaks mate detection and material heuristics.**
   - A guard can permanently block a check line. Only the enemy *king* can remove it. Many
     positions that look winning are dead draws.
   - Guards cannot capture, so they can never give check, and K+G vs K is a draw.
   - **Do not port chess "insufficient material" rules.** They are wrong here. Write your own, or
     omit the rule and rely on the n-move rule.
   - Underpromotion to a guard is sometimes the best move (an indestructible blocker). Your
     promotion menu must be data-driven, not `nbrq`.
   - Guard shuffles are reversible and produce long drawish sequences — you need repetition
     detection and a 50-move equivalent from day one.

**6. Maester swaps are reversible two-piece moves.** They are not captures and not pawn moves, so
they must **not** reset the n-move clock, and they must be hashed correctly for repetition (two
`Zobrist.psq` XORs, not one). The first-rank maester–king swap is also a legal **check evasion** and
moves the king an arbitrary distance — any cached king-square must be updated, and legality is
"after the swap, is my king attacked?", tested normally.

**7. Beast chains explode the move list.** Continuing is optional, so *every prefix* of every chain
is a distinct legal move. Generate chains lazily (depth-first from the capture square, yielding at
each step) and bound them by the number of enemy pieces. Chains stop at kings ("another **non-king**
piece"). For NNUE: a chain dirties up to N+1 squares — just recompute the accumulator from scratch
when the dirty count exceeds ~3 rather than writing a general incremental path.

**8. The randomised back rank kills opening books and file-indexed PSTs.** No book, no "develop the
knight to f3" heuristics. Generate the setup once per game, ship the FEN, and make sure your
training data covers the full distribution of setups — including which subset of the 9 fairy types
appears, since only 7 of the pool are drawn each game.

**9. Your roadmap makes the state non-Markov per piece.** "Freeze a piece for a turn", "uncapturable
for a turn", "move a piece twice" are per-piece, per-turn flags. They must live in the position, in
the Zobrist hash, and (eventually) in the NNUE input — or your search will happily transpose between
positions that are not the same position. Reserve the bits now. The Interactive Diagram's `spell`
parameter (A.4) is prior art for how to model these declaratively.

---

## Tier 2 results (2026-09-13)

The tier-2 player lives in `src/ai/` and touches no rule: every move still comes from
`genPiece`, and legality is still "make the move, then look at your own king".
Files: `eval.ts` (material, tables, mobility, king safety), `zobrist.ts` (keys),
`search.ts` (search, transposition table, time budget), `search.test.ts` (11 tests).

### What the evaluation counts

Material, in centipawns: pawn 100, knight 320, bishop 330, rook 500, queen 900, archer **430**,
paladin **470**, guard **250**, maester **330**, beast **350**. The reasoning for the five fairy
values is in the header of `eval.ts`. In short: the archer captures through blockers with no
recapture square, so "defended" is no defence and it is worth more than a bishop; the paladin has
queen lines but dies on its own capture and can never check, so it is worth less than a rook; the
guard cannot capture and cannot be captured, so it is a wall with no offence; the maester is a
commoner plus the first-rank king swap; the beast is a minor that eats three pieces at once in a
crowded position and is stuck in an open one.

Piece-square tables for all eleven types, mirrored for Black (`s ^ 56`). No file-indexed opening
knowledge — the back rank is random (gotcha 8), so every table is left-right symmetric and encodes
only centrality and advancement. The king has a middlegame table and an endgame table, blended by
the non-pawn material left on the board. On top: slider mobility (bishop x4, rook x3, queen x2,
paladin x2 per destination; the paladin's ray walks through friendly pieces), adjacent beast
targets, a king shield (pawn +12, **guard +26** — nothing but a king can remove it), maester
proximity to its own king, and a 10-point tempo.

### What the search does

Iterative deepening with PVS, a 131k-entry transposition table (key, depth, bound, best move),
ordering TT move → MVV-LVA captures → two killers → history, quiescence with stand-pat, delta
pruning and full check evasions, mate-distance scores and pruning, a one-ply check extension capped
at twice the nominal depth, repetition (search path plus an optional `history` of position keys)
and 50-move draws, and a soft/hard time budget that does not start an iteration it cannot finish.

### Before / after, 1 second per position

Node 26, M-series Mac, **shared with other build agents** (load average ~35 on 16 cores), so read
the depths first and the absolute rates as a range. Ten timed runs per cell.

| Position | Engine | Depth | Nodes/s (median) | Nodes/s (best) |
|---|---|---|---|---|
| Start (`RSAKGQLB`) | tier 1 | 4 | 129k | 184k |
| Start (`RSAKGQLB`) | **tier 2** | **6–7** | **191k** | **337k** |
| Middlegame | tier 1 | 4 | 114k | 152k |
| Middlegame | **tier 2** | **6–7** | **174k** | **284k** |

Middlegame position:
`1sakg1l1/1p1pppq1/3b4/r1p3p1/p1PPB1Pp/4P2P/PP1GQP2/RSAKL3 w - - 0 13` (tier-2 self-play, ply 24).

**+2 to +3 plies at the same time control**, and the nodes are worth more: the old search had no
transposition table, no killers and no history.

### The allocation question, measured

`makeMove` allocating a new `Position` per node is **not** the bottleneck. Same move list, same
rules, `perft(4)` on the middlegame position (1,857,048 nodes):

| Path | ms | Nodes/s |
|---|---|---|
| `engine.perft` (allocates a 64-byte board per node) | 612 | 3.03M |
| AI in-place `apply`/`undo` on one scratch board | 722 | 2.57M |

V8 allocates and copies 64 bytes in the nursery for less than an in-place write log costs. The
tier-1 per-node cost was elsewhere: `ordered()` built three arrays and sorted them at **every**
node, and the legality test allocated a second Position per move. The in-place path still earns its
place, for a different reason — it makes the Zobrist key incremental and lets every buffer be
reused, so the search allocates nothing per node except the Move objects `genPiece` creates.

One measurement changed the design: the first in-place version also maintained the hash inside the
legality probe, which runs for every pseudo-legal move at every node. That version ran at 1.61M
perft nodes/s — **slower than the allocating engine**. Splitting out a hash-free `applyQuiet` for
the probe took perft to 2.57M and the search from ~137k to ~337k nodes/s.

### Reproducible runs

`search(pos, { maxDepth: n })` with **no** `timeMs` ignores the wall clock, so a fixed-depth run
gives the same answer on any machine. Call `resetSearchState()` first to clear the transposition
table, killers and history; after that the result depends only on the position and the depth. There
is no randomness in the module — the Zobrist keys come from a fixed-seed xorshift. `search` imports
into plain Node with no DOM globals (it uses `performance.now()` only); `worker.ts` stays a browser
Worker.

### Not done

No aspiration windows, no null-move pruning (guards and paladins make zugzwang cheap to reach), no
late-move reductions, no static exchange evaluation. Values and table weights are reasoned, not
self-play tuned; tuning them is the next cheap win.

---

## Tier 3: tuned eval (2026-09-13)

"Values and table weights are reasoned, not self-play tuned" is now out of date. Every number in
`src/ai/eval.ts` — 10 material values, 12 piece-square tables, mobility, the beast's target bonus,
the king shield, maester proximity, tempo and the phase blend, **408 parameters** — was fitted by
Texel's method to **583,868 quiet positions** drawn from 28,600 of our own v0.6 games, then applied
by `npm run tune:apply`. Full method, data and caveats: `docs/research/sim-tuning-2026-09-13.md`.

**+113 ± 27 Elo at depth 3** (400 paired games) and **+117 ± 33 at depth 4** (200), tuned against
untuned in colour-swapped pairs on random back ranks. One ply of search is worth about 180 Elo at
this strength, so the fit is worth two thirds of a ply and costs nothing at run time: the evaluation
does exactly the work it did before, with better numbers.

Three results are worth carrying into tier 3 proper (the NNUE in C.3):

- **Validation MSE is not playing strength.** The unregularised fit had the best held-out error of
  six and lost its match; the fits that won were pulled toward the old values by an L2 term. A net
  trained to convergence on this data would inherit the same trap, so keep a match in the loop.
- **The hand-set mobility weights were about four times too big** (bishop 4 → 1, queen 2 → 0). With
  tables this detailed most of what mobility says is said already by where a piece stands.
- **The one big table change is a rank the tables were not designed for.** A maester swaps with a
  friendly neighbour, so a pawn can be dragged back onto rank 1, and 14% of the sampled positions
  have one there. King Down needs squares standard chess never has to price.

The tuner lives in `src/sim/tune.ts` (sample / fit / apply / match) with `src/sim/tune.test.ts`
holding its second implementation of the evaluation bit-for-bit equal to `evaluateBoard`. Data
generation is a normal simulation run, so the next pass is a command, not a project.

## Tier 4: a small NNUE, measured and not shipped (2026-09-13)

C.3 said a learned evaluation is worth 200–600 Elo in a new variant, on the evidence of the
Fairy-Stockfish per-variant table. **It is not worth that on 863k positions.** Full pass, data,
curves and diagnosis: `docs/research/ai-nnue-2026-09-13.md`.

Built exactly as C.3 and `ai-players.md` §2 specify: `1408 -> 32x2 -> 1`, a perspective net over
2 relations × 11 piece types × 64 squares, **no king buckets**, clipped ReLU, Int16 weights in one
117.6 kB base64 line, quantised at QA = 16384 / QB = 4096 / SCALE = 400, inference in plain
TypeScript. It is correct — 0.71 cp worst-case against the trainer's float forward pass over 1,000
positions, exactly colour-symmetric, deterministic — and it is **1.19x** slower than the linear
evaluation, which is why the incremental accumulator was not written: at fixed depth a slower
evaluation costs no strength, and a one-second search still reaches depth 5.8.

It lost **−129 ± 29 Elo** at depth 3 over 400 paired games and **−98 ± 40** at depth 4 over 200.
Three findings are worth carrying:

- **The win-draw-loss half of the target is a memorisation channel in this game.** One result is
  attached to all ~114 positions of a game, and every game starts from its own random back rank out
  of 1,373 piece sets, so 45k feature weights learn "this army beat that army" and held-out error
  rises from the second epoch. The real sample size of a WDL term here is *games*, not positions.
  Chess engines do not hit this because they train on millions of games from a fixed start.
- **The net predicts the search score better than the evaluation that beats it** (63.9 cp RMS
  against 74.9 on held-out positions) and still plays 129 Elo worse; the variant trained on plain
  centipawns predicts better again (60.9) and plays 187 Elo worse. Tier 3's lesson repeats one
  level up: held-out error ranks candidates, only a match decides them.
- **A net fitted on quiet positions compresses material.** It reads a missing queen as 549 cp
  against the linear 931, because large imbalances are rare in self-play and the sigmoid target
  saturates past about ±400 cp. Inside alpha-beta that under-rewards every capture. The obvious
  fix — evaluate `material + net(board)` and fit the net to the residual — is untested and is the
  first thing to try, ahead of more data.

Everything is in the tree behind `setEvaluator('nnue')`, with the trainer in `src/sim/gen.ts`
(TypeScript, not `bullet`: it imports the inference module's own feature indexing, so trainer and
engine cannot disagree about what an input means). Two evaluations play each other through the
existing tuning match, because `EvalParams` now carries an `evaluator` field and `src/sim/game.ts`
already swaps an `EvalParams` per side between plies.

---

---

## Things I could not verify

- Any Stockfish-team or FSF statement addressing **WASM / Web Worker deployment** of a GPLv3 engine
  specifically. The mere-aggregation analysis in A.7 is mine, not theirs.
- Whether the Interactive Diagram's multi-leg XBetza can express an **unbounded** chain capture
  (bounded two-leg captures are documented).
- Ludii's ludeme grammar per-piece against your five rules (moot given the licence).
- Lozza's current CCRL rating — computerchess.org.uk returns HTTP 403 to automated fetches. An older
  figure of ~2174 for Lozza 1.12 appears in search results; current versions are much stronger but I
  have no verified number.
- Lozza's licence is **MIT** per the current `LICENSE` file in the repo; the chessprogramming wiki
  still lists GPLv3. The repo file is authoritative and current.
- The exact XBetza string for an Archer-geometry rifle capture. The *pattern* is documented
  (`mRcaibR` for a slider); the F/D leaper analogue should follow, but I did not test it.
- lc0's *current* official position on variants. Inferred from the 2021 issue closure plus silence on
  the 2025 issue, not from a 2026 maintainer statement.
- Whether anyone has actually driven a **user-defined** `variants.ini` game through CrazyAra's
  self-play loop. The `MODE_BOARDGAMES` CMake option and the Fairy-Stockfish submodule are confirmed;
  real-world use is not. Validate this early if you ever take that path.
- Community-reported **GPU-hours** for variant NNUE training. The only discussion asking
  ([#789](https://github.com/fairy-stockfish/Fairy-Stockfish/discussions/789)) has zero replies. All
  compute figures in B.2 are project guidance, not measured reports.
- PGX throughput (~500K chess steps/s) is read off a figure in the paper, not a table.
- TensorFlow.js has no *official* deprecation statement. The eighteen-month release gap and the
  unanswered "is this deprecated?" issue are the evidence.
- No published batch-1 latency benchmark for a small convnet under onnxruntime-web's WebGPU EP, and no
  published NPS figure for browser-side MCTS.

---

## Source index

**Fairy-Stockfish**
- Repo: <https://github.com/fairy-stockfish/Fairy-Stockfish> (GPL-3.0, commit 2026-09-06)
- `src/variants.ini`: <https://github.com/fairy-stockfish/Fairy-Stockfish/blob/master/src/variants.ini>
- `src/piece.cpp` (Betza parser): <https://github.com/fairy-stockfish/Fairy-Stockfish/blob/master/src/piece.cpp>
- `src/types.h` (move encoding `static_assert`): <https://github.com/fairy-stockfish/Fairy-Stockfish/blob/master/src/types.h>
- `src/position.cpp` (blast / petrify): <https://github.com/fairy-stockfish/Fairy-Stockfish/blob/master/src/position.cpp>
- `src/bitboard.h` (`attacks_bb`): <https://github.com/fairy-stockfish/Fairy-Stockfish/blob/master/src/bitboard.h>
- Issue #368, capture by non-displacement: <https://github.com/fairy-stockfish/Fairy-Stockfish/issues/368>
- Issue #606, iron/uncapturable pieces: <https://github.com/fairy-stockfish/Fairy-Stockfish/issues/606>
- PR #912, `ironPieceTypes` (open): <https://github.com/fairy-stockfish/Fairy-Stockfish/pull/912>
- Issue #1005, prohibited captures: <https://github.com/fairy-stockfish/Fairy-Stockfish/issues/1005>
- Issue #1038, general XBetza support: <https://github.com/fairy-stockfish/Fairy-Stockfish/issues/1038>
- Issue #167, Lancer (maintainer policy): <https://github.com/fairy-stockfish/Fairy-Stockfish/issues/167>
- `multimove` branch (stale 2022): <https://github.com/fairy-stockfish/Fairy-Stockfish/tree/multimove>
- NNUE wiki: <https://github.com/fairy-stockfish/Fairy-Stockfish/wiki/NNUE>
- WASM port: <https://github.com/fairy-stockfish/fairy-stockfish.wasm>
- Network list: <https://fairy-stockfish.github.io/nnue/>

**NNUE training**
- variant-nnue-pytorch: <https://github.com/fairy-stockfish/variant-nnue-pytorch>
- Technical details (architecture, file size): <https://github.com/fairy-stockfish/variant-nnue-pytorch/wiki/Technical-details>
- Training data generation: <https://github.com/fairy-stockfish/variant-nnue-pytorch/wiki/Training-data-generation>
- NNUE training: <https://github.com/fairy-stockfish/variant-nnue-pytorch/wiki/NNUE-training>
- FAQ (15-piece-type limit): <https://github.com/fairy-stockfish/variant-nnue-pytorch/wiki/FAQ>
- Kaggle free-GPU guide: <https://github.com/fairy-stockfish/variant-nnue-pytorch/wiki/Training-through-Kaggle-GPU>
- variant-nnue-tools (data generator): <https://github.com/fairy-stockfish/variant-nnue-tools>
- bullet (MIT NNUE trainer): <https://github.com/jw1912/bullet>

**ML frameworks**
- lc0: <https://github.com/LeelaChessZero/lc0> · variant issues [#1563](https://github.com/LeelaChessZero/lc0/issues/1563), [#2336](https://github.com/LeelaChessZero/lc0/issues/2336) · GSoC 2026 ideas <https://lczero.org/contribute/gsoc/2026/>
- CrazyAra (MCTS+NN variant engine, FSF submodule): <https://github.com/QueensGambit/CrazyAra>
- minizero (Apache-2.0, best AlphaZero fit): <https://github.com/rlglab/minizero>
- OpenSpiel: <https://github.com/google-deepmind/open_spiel>
- mctx: <https://github.com/google-deepmind/mctx> · LightZero: <https://github.com/opendilab/LightZero>
- AlphaZero.jl: <https://github.com/jonathan-laurent/AlphaZero.jl> · turbozero: <https://github.com/jcbmrshll/turbozero>
- KataGo methods: <https://github.com/lightvector/KataGo/blob/master/docs/KataGoMethods.md> · paper <https://arxiv.org/abs/1902.10565>
- alpha-zero-general (dormant) + active fork: <https://github.com/suragnair/alpha-zero-general> · <https://github.com/cestpasphoto/alpha-zero-general>
- muzero-general (dormant): <https://github.com/werner-duvaud/muzero-general>
- pgx (abandoned): <https://github.com/sotetsuk/pgx> · paper <https://ar5iv.labs.arxiv.org/html/2303.17503>
- Maia: <https://github.com/CSSLab/maia-chess> · <https://github.com/CSSLab/maia2> · <https://github.com/CSSLab/maia3>
- Scaling laws on board games (single-GPU data points): <https://ar5iv.labs.arxiv.org/html/2104.03113>
- AlphaZero.jl Connect Four timings: <https://jonathan-laurent.github.io/AlphaZero.jl/stable/tutorial/connect_four/>

**Browser inference**
- onnxruntime-web JSEP deprecation: <https://github.com/microsoft/onnxruntime/blob/main/docs/JSEP_Deprecation.md>
- ORT release notes 1.29.0: <https://github.com/microsoft/onnxruntime/releases/tag/v1.29.0>
- ORT service-worker issue: <https://github.com/microsoft/onnxruntime/issues/20876>
- TF.js "is this deprecated?": <https://github.com/tensorflow/tfjs/issues/8719>
- WebGPU dispatch overhead: <https://arxiv.org/abs/2604.02344> · follow-up <https://arxiv.org/abs/2608.08730>
- WASM vs WebGPU at batch 1: <https://github.com/gpuweb/gpuweb/discussions/5292>
- lichess stockfish.wasm NPS figures: <https://github.com/lichess-org/stockfish.wasm/pull/21>

**Engines and libraries**
- Lozza (MIT, JS + NNUE, Web Worker): <https://github.com/op12no2/lozza>
- Tonnetto (MIT, TS, ~20 KB): <https://github.com/marcobuontempo/tonnetto>
- Interactive Diagram docs: <https://www.chessvariants.com/page/MSinteractive-diagrams>
- Sjaak II mirror: <https://github.com/RMKirkpatrick/SjaakII> · <https://chessprogramming.org/Sjaak_(Glebbeek)>
- ChessV: <http://www.chessv.org/>
- Ludii: <https://github.com/Ludeme/Ludii> · <https://ludii.games/>
- Jocly: <https://github.com/aclap-dev/jocly>
- Fairy-Max: <https://home.hccnet.nl/h.g.muller/CVfairy.html>
- pychess-variants: <https://github.com/gbtami/pychess-variants>
- chessops: <https://github.com/niklasf/chessops>
- chessgroundx: <https://www.npmjs.com/package/chessgroundx>
- react-chessboard: <https://www.npmjs.com/package/react-chessboard>

**Licensing**
- GPL FAQ, mere aggregation: <https://www.gnu.org/licenses/gpl-faq.html#MereAggregation>
- Stockfish / ChessBase settlement: <https://stockfishchess.org/blog/2022/chessbase-stockfish-agreement/>
- FSFE summary: <https://fsfe.org/news/2022/news-20221212-01.en.html>
