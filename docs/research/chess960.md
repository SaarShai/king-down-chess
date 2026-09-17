# Chess960 research — balance and starting arrangements

Scope: what Chess960 (Fischer Random) tells us about picking and balancing random back ranks. Written
for King Down Chess, which has **no castling**, **7 random pieces + king**, and a **fairy pool**.
2026-09-13. Every claim carries a URL.

## 1. Sources

| URL | What it is | Usable data |
|---|---|---|
| https://handbook.fide.com/chapter/E012023 (PDF mirror: https://ballaratchess.com/ClubDocs/FIDE%20Guidelines%20Chess960%20Jan2023.pdf) | FIDE Handbook, Guidelines II (Chess960), Jan 2023 | Rules only |
| https://en.wikipedia.org/wiki/Chess960 | History, 960 count, variant list | Background |
| https://en.wikipedia.org/wiki/Chess960_numbering_scheme | Scharnagl numbering | Algorithm |
| https://arxiv.org/abs/2512.14319 | Barthelemy, "Not all Chess960 positions are equally complex" (v3, 2026-03-09) | Numbers in paper; no data file |
| https://en.chessbase.com/post/complexity-chess960-marc-barthelemy | ChessBase summary of the above | Numbers differ from v3 (see §3) |
| https://github.com/stumpc5/chess960 | 100M Stockfish 16/17.1 games, 50,000 per position | **Yes** — raw: https://raw.githubusercontent.com/stumpc5/chess960/main/BoardAnalysis/2025-06_SF17.1_analysis_overview.md |
| https://github.com/Bot-Rakshit/chess960-explorer | Stockfish 17 evals, plans, tags | **Yes** — raw: https://raw.githubusercontent.com/Bot-Rakshit/chess960-explorer/main/public/data/chess960.json (1.4 MB) |
| https://www.chess.com/article/view/whats-the-most-unbalanced-chess960-position and http://chess960frc.blogspot.com/2019/02/a-stockfish-experiment.html | Sesse / Stockfish 9 evals (depth 39–40); Mark Weeks checks them against CCRL | Summary only |
| https://github.com/welyab/chess960-win-by-position-setup | 4.57M Lichess games by setup | **Yes** — raw: https://raw.githubusercontent.com/welyab/chess960-win-by-position-setup/master/README.md |
| https://www.alexmolas.com/2023/01/11/chess-960-initial-position.html | Bayesian A/B test on Lichess games | **Yes** — https://www.kaggle.com/datasets/alexmolas/chess-960-lichess , https://github.com/alexmolas/chess-960 |
| https://huggingface.co/datasets/Lichess/chess960-chess-games | 25.1M Lichess Chess960 games, Parquet, ~18 GB, CC0 | **Yes** |
| https://lichess.org/@/rdubwiley/blog/using-lichesss-public-data-to-find-the-best-chess-960-position/GCpB9WLH | Ryan Wiley: "fun index" on ~1M Lichess games | Method only |
| https://arxiv.org/abs/2310.18938 | ML to predict Chess960 results (480,000 engine games) | Method only |
| https://arxiv.org/abs/2009.04374 | Tomašev, Paquet, Hassabis, Kramnik: "Assessing Game Balance with AlphaZero" (2020) | **Yes** — tables in paper |
| https://en.chessbase.com/post/the-first-ever-no-castling-chess-tournament-results-in-89-decisive-games | First no-castling tournament, Chennai 2020 | **Yes** |
| http://chess960frc.blogspot.com/2012/06/myth-of-corner-bishop.html and https://www.chess.com/blog/Vicariously-I/guide-to-chess-960-part-1-opening-principles | Corner-bishop debate; Chess960 opening principles | Opinion |
| https://fairy-stockfish.github.io/variants/ | Fairy-Stockfish variant list, custom variants | Tool |
| https://en.wikipedia.org/wiki/Capablanca_chess , https://www.pychess.org/variants/capablanca960 | Capablanca chess, Capablanca960 | Rules |
| https://www.chess.com/terms/seirawan-chess , https://hgm.nubati.net/rules/Seirawan.html | Seirawan chess, fairy values | Values |

## 2. Official rules (brief)

**Setup** (FIDE Guidelines II.2): pawns as usual; the other white pieces go on rank 1 at random, but
II.2.1 the king stands between the two rooks, II.2.2 the bishops stand on opposite-coloured squares,
II.2.3 black mirrors white. A computer, dice, coin or cards may draw the position.
**Castling** (II.3): each player castles once, by one of four methods — double-move, transposition,
king-move-only, rook-move-only. The king always ends on c1 (c-side) or g1 (g-side); the rook ends on d1
or f1. Castling can be legal on move 1. Squares that classical chess needs empty can stay filled.

**Why 960**: 4 squares for the light bishop × 4 for the dark bishop × 6 for the queen × 10 knight
pairs on the last 5 squares = 960. **Scharnagl numbering** (0–959): divide N by 4 for the light bishop,
the quotient by 4 for the dark bishop, that quotient by 6 for the queen, then read the last quotient
(0–9) from a knight table. Number 518 is the classical RNBQKBNR.

**For King Down**: II.2.1 does not apply — no castling, no rook constraint. We keep II.2.2
(opposite-colour bishops) and II.2.3 (mirrored). Our pool is larger, so we share a setup as its
8-letter string, not a number.

## 3. Balance of individual starting positions

### 3.1 Engine evaluation of the opening position

**Barthelemy (arXiv 2512.14319 v3)** — Stockfish 17.1 NNUE, 1 thread, 1 GB hash, depth 30, all 960:
mean **+0.33 ± 0.12 pawns** for White; **959 of 960 (99.9%) favour White**; classical #518 is +0.28
(37th percentile); most White-favourable **#333 NRQBKRBN at +0.81**; the only Black-favouring position
is **#774 QRBKNBRN at −0.18**.

**Depth instability is the key warning.** At depth 10 the top position reads +5.89, at depth 15 about
+1.16, at depth 30 +0.81, at depth 40 about +0.79. None of the depth-10 top three stay in the top three
at depth 20. Aggregate statistics stay stable; outliers do not.

It also measures decision **complexity** in bits (depth 15): total 2.6–17.2, asymmetry
A = S_Black − S_White from −4.5 to +4.2 (mean −0.26). Most complex is **#524 RBNQKNBR at 17.17 bits**;
#518 is 11.20 (72.5th percentile). Complexity and evaluation are almost independent (r ≈ 0.15), and
#524 is nearly equal (+0.24). So **sharp is not the same as unfair**. The ChessBase summary quotes
different figures (mean +0.297, 956/960, #226 most complex); treat the arXiv v3 numbers as current.

**Sesse / Stockfish 9, depth 39–40** (chess.com): mean +0.18, most unbalanced **BBNNRKRQ at +0.57**,
27 positions at 0.00, none favour Black, #518 at +0.22. Mark Weeks checked BBNNRKRQ against CCRL games:
White scored only 51.0% with 15.3% draws. His conclusion: engines evaluate Chess960 starts poorly.

### 3.2 Engine game results (the most useful dataset)

**stumpc5/chess960** — 100M games, Stockfish 16 and 17.1, skill 20, 4 s per game + 0.05 s per move,
**50,000 games per position**, downloadable as Markdown tables.
SF17.1 extremes: **SPI 18 BNQNRBKR** = 44.8% White / 51.3% draw / 3.9% Black (0.704 points);
**SPI 39 NNBQRKRB** and **SPI 671 RNKRNQBB** = 0.500; **SPI 240 BBNRKQNR** = 0.487;
classical #518 = 11.1 / 83.9 / 5.0 (0.531).

We parsed that table (960 rows). Derived: draw rate mean **79.0%**, sd 6.0, range 51.3–92.8; White
points mean **0.540**, sd 0.033, range 0.487–0.704; and **corr(draw rate, White points) = −0.92** —
decisive positions are decisive *for White*.

### 3.3 Human results

- **welyab** (4.57M Lichess games): White 49.17%, Black 47.1%. Largest gap RNBKRBQN (+323 wins for
  White over 4,828 games); most Black-favouring RKRBBQNN (−126 over 4,596); level BNRQNKRB, NQRNBBKR.
- **alexmolas** (~2.4M Lichess blitz games, 1800–2100 Elo, ~2,500 per position): Bayesian Beta A/B with
  a multiple-comparison correction (α_eff ≈ 1e−7) finds **no statistically significant difference
  between positions**. Past win rate does not predict future win rate, and Stockfish evaluations do not
  predict human win rates.
- **Ryan Wiley** (~1M Lichess games, Apr–Jul 2022): scores positions with a "fun index" =
  (1 − |White wins − Black wins|) − draw rate. The best position changes with the Elo band.
- **Lichess on Hugging Face**: 25.1M games with FEN, result and both Elos — best raw source.

## 4. Interesting versus dull positions

Community opinion: a **corner bishop** has one way to develop, so Kramnik calls it poor; Mark Weeks
answers that one pawn move activates it and that it never blocks castling. Both bishops in one corner
is the awkward case — an early exchange can leave a bishopless middlegame. A **corner knight** is
clearly bad (least mobility). A **corner queen or rook** gives slow build-ups and few early tactics.

Measured effects, from the 50,000-games-per-position SF17.1 table (960 rows, our own grouping):

| Feature | n | Δ draw rate | Δ White points |
|---|---|---|---|
| Both bishops in corners (a1 and h1) | 60 | **+7.5** | **−0.022** |
| Queen in a corner | 240 | **−3.1** | **+0.015** |
| Rook in a corner | 612 | +1.7 | −0.014 |
| King on d1 or e1 (centre) | 408 | −1.7 | +0.009 |
| Knight in a corner | 444 | −1.3 | +0.006 |
| One bishop in a corner | 420 | +0.7 | −0.002 |
| Knights adjacent | 252 | +0.7 | −0.001 |
| Bishops adjacent | 420 | −0.8 | +0.001 |
| Both rooks on one flank | 144 | +0.4 | −0.005 |
| Queen next to the king | 248 | +0.3 | −0.004 |

Read this as: **two bishops in the corners is the strongest dullness signal**, a corner queen is the
strongest sharpness signal, and adjacency of like pieces does almost nothing. Every effect is small
next to the −0.92 correlation between draw rate and White's score.

## 5. Special rules and known variants

- **Chess480**: orthodox castling (king moves two squares toward a rook). Critics say the king often
  lands on d1 or e1, which makes castling undesirable.
- **Chess18**: king and both rooks keep their classical squares, so castling is unchanged; 18 positions.
  **DFRC (Double Fischer Random)**: each side drawn independently; 921,600 positions.
- **Capablanca chess**: 10×8, archbishop (B+N) and chancellor (R+N), 10 pawns, king castles three
  squares, promotion to the new pieces. **Capablanca Random Chess / Capablanca960** randomises the rank.
- **Seirawan chess**: hawk (B+N) and elephant (R+N) wait in hand and gate onto a vacated first-rank
  square. Play-tested values: Q 950, elephant 925, hawk 875, R 500, B = N 325. Reported effect:
  **super-pieces lose value when the opponent has few strong pieces**.
- **No-castling chess** (Kramnik with AlphaZero). Chennai 2020, 13 juniors averaging 2457 Elo:
  **24 of 27 games decisive = 89%**.

**AlphaZero results** (Tomašev et al. 2020), 10,000 self-play games per variant at about 1 s per move:

| Variant | W / D / L | Draws | Decisive | White score |
|---|---|---|---|---|
| Torpedo | 2086 / 7191 / 723 | 71.9% | **28.1%** | 56.8% |
| Semi-torpedo | 1306 / 8103 / 591 | 81.0% | 19.0% | 53.6% |
| **No-castling** | 1110 / 8441 / 449 | **84.4%** | **15.6%** | **53.3%** |
| Stalemate=win | 1000 / 8606 / 394 | 86.1% | 13.9% | 53.0% |
| Self-capture | 871 / 8783 / 346 | 87.8% | 12.2% | 52.6% |
| Pawn-sideways | 872 / 8815 / 313 | 88.2% | 11.9% | 52.8% |
| **Classical** | 772 / 8820 / 409 | **88.2%** | **11.8%** | **51.8%** |
| Pawn one square | 709 / 8891 / 400 | 88.9% | 11.1% | 51.6% |
| No-castling (10) | 604 / 9002 / 394 | 90.0% | 10.0% | 51.0% |
| Pawn-back | 532 / 9160 / 308 | 91.6% | 8.4% | 51.1% |

Draws rise with thinking time in every variant: at 1 minute per move classical draws 97.9%.
Piece values (Table 6): classical P 1, N 3.05, B 3.33, R 5.63, Q 9.5; **no-castling** P 1, N 2.97,
B 3.13, **R 5.02**, Q 9.49; torpedo P 1, N 2.25, B 2.46, R 3.58, Q 7.12. Removing castling costs the
rook about 11% and leaves the other pieces almost unchanged. The paper also reports a negative
correlation between opening diversity and decisiveness. Kramnik on no-castling: king safety is weak
for both sides, so attack and counter-attack run together, and equality stays dynamic, not dry.

## 6. Random setups with fairy pieces

Fairy-Stockfish plays Chess960, **Capablanca Random Chess** and Seirawan, and accepts user variants
through `variants.ini`. It is the practical tool for testing a fairy random variant. No published study
measures the balance of individual random back ranks with fairy pieces; the Seirawan value list above
is the closest published data. Treat every fairy value as a quantity to measure, not to assume.

## 7. What this means for King Down Chess

Testable hypotheses for the simulation. Each names the Chess960 number it is derived from.

1. **White advantage is structural, not positional.** Expect White to score about 0.53–0.55 across
   random back ranks, sd near 0.03 (Chess960: mean 0.540, sd 0.033).
2. **Decisiveness mostly measures White's edge, not fun.** Expect corr(draw rate, White score) near
   −0.9 (Chess960: −0.92). Rank first on |score − 0.5|; use drama, lead changes and volatility — never
   a bare draw rate — as the interest score.
3. **Shallow rankings will not survive depth.** Depth-3 scores will reorder at depth 5+ (Chess960:
   +5.89 at depth 10 versus +0.81 at depth 30; no depth-10 top-3 survived to depth 20). Screen at
   depth 3–4, then confirm the kept 50 at depth 5+ with 200+ games.
4. **Two bishops in the corners make dull, fair games.** Expect about +7 draw points and about −0.02
   White points versus other back ranks (Chess960, n = 60).
5. **A queen in a corner makes sharp, unfair games.** Expect about −3 draw points and about +0.015
   White points (Chess960, n = 240). Flag it as a risk, not a target.
6. **Adjacency of like pieces does not matter.** Knights adjacent, bishops adjacent and both rooks on
   one flank each move the draw rate by under 1 point in Chess960. Expect the same in our feature
   regression; piece *identity* in the corners should dominate.
7. **No castling raises decisiveness by about a third.** Expect our default rules to be roughly 1.3×
   more decisive than a castling-enabled control (AlphaZero: 15.6% versus 11.8% decisive).
   A/B this once castling is toggleable.
8. **No castling cuts the rook's value by about 10%.** Expect our logistic regression to put rooks
   below 5 pawns (AlphaZero no-castling: 5.02 versus 5.63). Re-price every fairy piece against that
   rook, not against the classical rook.
9. **King placement matters more for us.** Our king cannot run to c1 or g1. Expect a larger penalty
   than Chess960's +0.009 White points for a king on d1/e1, and corner kings to raise the draw rate.
10. **Short-range fairy pieces suffer most in a corner.** The archer, guard, maester and beast all
    move one square. Expect back ranks that corner them to show fewer moves and captures by that piece,
    mirroring the "corner knight is worst" rule.
11. **Pool composition changes piece values, not only order.** Expect the paladin and the beast to
    measure higher in pools that still contain a queen and rooks (Seirawan: super-pieces lose value
    when the opponent holds few strong pieces). Test each fairy piece in two pools.
12. **Engine rankings will not predict human results.** 2.4M Lichess games show no significant
    per-position bias, and Stockfish evals do not predict human win rates. Ship the sim ranking as a
    playtest shortlist, never as a verdict.
