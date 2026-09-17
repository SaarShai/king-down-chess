# Fairy piece values — research for King Down (v1, 2026-09-13)

Scope: the five fairy pieces in docs/RULES.md §3. Per piece: closest known analogues, published values that transfer, a first-principles estimate
in pawn units, and what to measure. Baseline P1 N3 B3 R5 Q9 [S1]. Every number here is a prior, not an answer. Muller: "There is only one
reliable way to determine piece values, and that is the empirical one. Exact mathematical calculations by a guessed method are still blind
guesses." [S2]

## 1. Sources

| # | Source | URL |
|---|---|---|
| S1 | Chess piece relative value (P1 N3 B3 R5 Q9) | https://en.wikipedia.org/wiki/Chess_piece_relative_value |
| S2 | Muller: leaper value = 33N + 0.69N² cP; empirical method | https://www.chess.com/forum/view/chess-variants/how-can-i-figure-out-the-relative-piece-values-in-variants-i-come-up-with |
| S3 | TalkChess: 1.1·(30+5/8·N)·N; "Rifle Queen ... two normal Queens or more" | https://talkchess.com/viewtopic.php?t=64292 |
| S5 | Betza: mobility, forwardness, distance, colourboundness, capture | https://www.chessvariants.com/d.betza/pieceval/forward.html |
| S6 | Betza: restrictions on being captured (Ghost, Iron Ghost, Ravager) | https://www.chessvariants.com/d.betza/pieceval/p7-05.html |
| S8 | Betza: modified jumpers (move/capture split; Xiangqi Cannon = 0.75 R) | https://www.chessvariants.com/piececlopedia.dir/ideal-and-practical-values-5.html |
| S9 | Betza: grasshopper mobility (gR 1.1, gB 0.7, gQ 1.8; near zero in the endgame) | https://www.chessvariants.com/d.betza/pieceval/grasshop.html |
| S10 | Betza: The Iron Knight (uncapturable-piece tests) | https://www.chessvariants.com/d.betza/chessvar/iron.html |
| S11 | Betza: The Black Ghost (non-capturing piece < 1 pawn) | https://www.chessvariants.com/d.betza/chessvar/ghost.html |
| S12 | Betza: Crab / DemiRifle army (rifle capture ≈ ×2) | https://www.chessvariants.com/d.betza/chessvar/pieces/crab.html |
| S13 | Betza: Chess with Different Armies (buy-points failed) | https://www.chessvariants.com/unequal.dir/cwda.html |
| S14 | CwDA: 2010 Fairy-Max retest found two armies too strong | https://en.wikipedia.org/wiki/Chess_with_different_armies |
| S15 | Rifle Chess (Seabrook 1921): "it is of no use to guard pieces" | https://www.chessvariants.com/page/RifleChess |
| S16 | Ultima: Long Leaper, Immobilizer, Chameleon | https://www.chessvariants.com/other.dir/ultima.html |
| S17 | Baroque chess: some groups forbid multi-leaping for playability | https://en.wikipedia.org/wiki/Baroque_chess |
| S18 | Chu Shogi Lion: double capture and igui (stationary capture) | https://www.chessvariants.com/piececlopedia.dir/lion.html |
| S19 | Kamikaze Chess (Laws 1928): the capturing man is removed too | https://www.chessvariants.com/difftaking.dir/kamikaze.html |
| S21 | Duck Chess: uncapturable, unpassable blocker | https://www.chessvariants.com/rules/duckchess |
| S22 | Switching Chess: swap with an adjacent friendly piece | https://www.chessvariants.com/diffmove.dir/switching.html |
| S24 | Fairy-Stockfish types.h: engine piece values | https://github.com/fairy-stockfish/Fairy-Stockfish/blob/master/src/types.h |
| S26 | Betza notation extended: `t` = hop over friendly only; `udQ` = swap | https://www.chessvariants.com/page/MSbetza-notation-extended |
| S27 | Musketeer Chess values from thousands of engine games | https://musketeerchess.net/site/musketeer-chess-relative-piece-value/ |
| S28 | Seirawan Chess: Q 950, RN 925, BN 875 on 8x8 | https://www.pychess.org/variants/seirawan |
| S29 | Capablanca Random Chess: queen and archbishop on opposite colours | https://www.chessvariants.com/contests/10/crc.html |
| S30 | Chess960: bishops on opposite colours for balance | https://en.wikipedia.org/wiki/Chess960 |

## 2. Published methods that transfer

**Leapers.** value = 33N + 0.69N² cP, where N = squares attacked [S2]; N=8 gives 308 cP, a knight. TalkChess states the same rule as
1.1·(30+5/8·N)·N [S3].

**Move and capture split.** Betza: "the ability to move like a Rook (but not to capture in that manner) is worth half as much as a Rook, as long
as the capturing power of the final piece is above some minimum threshold"; he prices the Xiangqi Cannon (mRcpR) at 0.75 R [S8]. Rule of thumb:
move-only ≈ 0.5 of the full pattern, capture-only ≈ 0.4–0.5. He also warns that "Capture ... is really more important than mobility" [S5]. More
forward directions raise value; colourboundness lowers it; a piece that cannot retreat is clumsy [S5].

**Uncapturable pieces.** The Ghost (teleports anywhere, cannot capture, capturable) ≈ 0.5 pawn [S11]. The Iron Ghost (same but uncapturable) ≈ "a
Knight or Rook", 5–10× the Ghost [S6]. An Iron Rook beats a whole 31-point army; an Iron Knight does not [S10]. The decisive factor is perpetual
check: "having a single Iron piece that can follow the King guarantees at least a draw" [S10].

**Pieces that cannot check.** The Ravager has twelve knights of mobility but cannot capture a king; Betza prices it near "a Queen and a Rook" and
notes it "fares poorly in the simple Pawnless endgames" [S6].

**Rifle capture.** Betza built a half-strength army and guessed that rifle capture alone would restore it to full FIDE strength [S12], which
implies about ×2; TalkChess puts a Rifle Queen at "two normal Queens or more" [S3]. Rifle capture also kills defence: "it is of no use to guard
pieces" [S15]. **Hoppers** lose almost all value as the board empties: gR 1.1 P, gB 0.7 P, gQ 1.8 P [S9].

**Engine anchors.** Fairy-Stockfish midgame, as a ratio to its own knight (781): Wazir 400 = 0.51 N, Fers 420 = 0.54 N, Commoner (non-royal
king-mover) 700 mg / 900 eg = 0.90 N mg and 1.05 N eg, Cannon 800 = 1.02 N, immobile piece 50 [S24]. Play-tested on 8x8: Q 950, RN 925, BN 875
[S28]. Musketeer, with N=B=315, R=500, Q=975: Hawk 550, Unicorn 560, Elephant 630, Leopard 670, Cannon 750, Fortress 760, Spider 815 [S27]. The
Spider matters most here: short range, hard to attack, still near a queen.

## 3. Archer (A) — rifle capture at fixed range

Move: one orthogonal step to an empty square. Capture: any enemy diagonally adjacent (4 squares) or exactly two squares away orthogonally (4),
without moving, blockers ignored; check works the same.

**Analogues.** Rifle Chess: the capturing man stays and shoots the target off the board [S15]. Betza's DemiRifle army gives a whole army rifle
capture [S12]. The Chu Shogi Lion does this at range 1 as *igui*, "stationary eating" [S18]. No published piece uses our Ferz+Dabbaba shooting
set, so the pattern is priced from scratch.

**Two strengths.** A shot is always clean, because there is no recapture, so defending a target does nothing [S15]. The check ignores blockers,
so it cannot be answered by interposition — only by a king move or by taking the archer. **Two brakes.** The (1,1) and (2,0) sets both keep
square colour, so an archer threatens only its own colour at any moment, and changes complex only by moving. The orthogonally adjacent ring is a
blind spot: an enemy rook or king next to an archer is immune and can take it.

**Derivation.** Capture set as a full leaper, N=8 → 308 cP [S2], less a colourbound penalty [S5] ⇒ 2.7 P. Capture-only ⇒ ×0.45 ≈ 1.2 [S8]. Rifle
⇒ ×2 ≈ 2.4 [S12][S3]. Unblockable check and dead defence ⇒ +0.5. Move-only Wazir ≈ 0.5 × 1.5 = 0.7 [S8][S24]. **Estimate 3.5, range 2.8–4.8.**
Expect a crowded-board piece: strong while targets walk through its eight squares, weak once the board empties. K+A versus K is a draw.

## 4. Paladin (L) — friendly-leaping queen that dies on capture

Queen move; leaps friendly pieces; blocked by enemies; captures by displacement; cannot capture a king, so it never checks; removes itself after
capturing.

**Analogues.** The friendly-only hop is Betza's `t` modifier [S26]; hoppers are the nearest movement family [S8][S9]. Self-removal on capture is
Kamikaze Chess, from 1928 [S19]. "Cannot capture a king" is the Ravager [S6].

**What the rules do.** Self-removal makes every capture a one-for-one trade, but a trade the paladin always wins on access: because it
disappears, the defence of the target does not matter. So it is a token to cash once for the best enemy piece it can reach. Against that: it
cannot win a pawn, it cannot check, and it can never join a mating net, because covering a flight square needs the power to capture the king. It
is also easy to harass — a pawn that attacks it wins a large tempo, because taking the pawn loses the paladin.

**Derivation.** Movement alone is queen-like and develops faster ≈ 9. Remove all checking and mating power [S6], then cut the capture power to a
single cash-in. What remains is a permanent tax: the opponent must keep every piece worth more than the paladin off paladin lines. Price the
cash-in near a rook, add nuisance value. **Estimate 4.0, range 2.5–6.0.** This is the least certain of the five; measure it directly.

## 5. Guard (G) — immune blocker that cannot capture

One step in any direction, empty squares only. Cannot capture. Cannot be captured, except by a king. Blocks sliders.

**Analogues.** Betza's Iron Ghost is the direct model [S6]. The Duck is an uncapturable, unpassable obstacle [S21]. Ultima's Immobilizer has
partial immunity: it "can never be captured by a king, withdrawer, immobilizer, or chameleon" [S16] — our guard inverts that list.

**Derivation.** A capturable, non-capturing king-stepper sits below Betza's capture threshold [S8] at about 0.3–0.5 P; his far more mobile Ghost
is only 0.5 P [S11]. Immunity multiplies by 5–10 [S6] ⇒ 1.5–5. Damp that hard, because the guard cannot check and cannot follow a king, and
perpetual check is what makes iron pieces terrifying [S10]. What remains is permanent blocking: a guard in front of a passed pawn stops it for
the whole game, and a guard beside its own king blocks a checking line for ever. **Estimate 2.0, range 1.2–3.5.** The count matters more than the
value: the second guard near the king should be worth more than the first, and guards should raise the draw rate, as RULES.md §6.4 already
assumes.

## 6. Maester (M) — commoner that swaps

One step in any direction; captures an adjacent enemy; swaps with an adjacent friend; if maester and own king are both on rank 1, they swap at
any distance, subject to king safety (§6.7).

**Analogues.** The base piece is the Commoner, 700 mg / 900 eg against knight 781/854 [S24]; Muller's formula at N=8 agrees at 308 cP [S2]. The
swap is Switching Chess, where every piece "may also switch places with an adjacent friendly piece" [S22]; Betza writes it `udK` [S26]. The long
swap is a castling substitute, and King Down has no castling.

**What the swap adds.** It fixes the one real weakness of a short-range piece: getting out. The maester tunnels through its own pawn wall, pulls
a stuck rook into play, and escapes while improving a second piece — one tempo, two useful placements. Switching Chess reports the side effect:
switching "makes checkmate harder", and readers proposed no switching while in check and no switching with the king [S22]. Our §6.7 keeps a
weaker first rule.

**Derivation.** Commoner ≈ 3.0 [S24][S2], swap utility +0.3 to +0.7, and the long swap carries the value of castling while both pieces stay on
rank 1. **Estimate 3.5, range 2.8–4.5.** Also test the maester–guard tandem: the maester is the cheap way to move a guard and to step out of
danger in one move.

## 7. Beast (S) — one-way stepper with chain capture

Moves one square straight forward, empty only. Captures on any of the other seven adjacent squares, never straight ahead. It may keep capturing
from its new square, but never a king as a continuation.

**Analogues.** Chain capture is Ultima's Long Leaper, which "may make multiple captures in the same line" [S16], the checkers king, and the Chu
Shogi Lion, which captures twice in one turn [S18]. The strongest precedent is social, not numeric: some Baroque groups forbid multi-leaping
"because it is felt that the game is more playable if the Leaper is less powerful" [S17]. The move and capture split is the pawn's, priced by
Betza's rule [S8].

**Derivation.** Capture set of 7 as a full leaper: 33·7 + 0.69·49 = 265 cP ≈ 2.6 P [S2]. Capture-only ⇒ ×0.5 ≈ 1.3 [S8]. A forward step to an
empty square ≈ 0.25; the forwardness bonus applies, but so does the clumsiness penalty for a piece that cannot retreat [S5]. Chain capture is a
threat premium, not steady income: it forces the opponent to spread out. Add 0.5–0.7. **Estimate 2.2, range 1.5–3.2.** The blind spot is severe:
a defended enemy pawn straight ahead stops the beast's only move and cannot be taken. Expect the value to fall as the board empties, like a
hopper [S9].

## 8. Lessons from variants that mix such pieces

- **Chess960** constrains the random back rank (bishops on opposite colours) only to keep it balanced [S30]. Our §2 copies this. **Capablanca
  Random Chess** adds a second colour constraint, queen and archbishop on opposite colours [S29]: each piece with a colourbound component needs
  its own constraint. Our archer has one.
- **Chess with Different Armies.** Betza tried to let players buy pieces by value and gave up: "I found that the values aren't sufficiently
  precise, and that the team as a whole must be considered. Some pieces work together well ... other pieces do not, and an army made up of them
  will be weaker on the board than it would seem to be 'on paper'." [S13] The four armies then passed master playtesting, and a 2010 Fairy-Max
  retest still found two of them significantly stronger than the FIDE army [S14]. Human playtesting is not enough.
- **Musketeer Chess** measured its pieces over thousands of engine games and found a short-range, hard-to-attack piece near queen value [S27].
  **Seirawan Chess** shows a second-order effect: when added pieces are near queen value, under-promotion becomes common [S28]. Our promotion set
  includes every fairy piece, so watch it.
- **Ultima** is a live precedent for the beast question: a community weakened a chain-capturing piece to keep the game playable [S17]. **Rifle
  Chess** shows a class of play dying at once: guarding stops working [S15].

## 9. Summary

| Piece | Analogues | Published values | Our estimate | Range | What to test in simulation |
|---|---|---|---|---|---|
| Archer A | Rifle Chess [S15], DemiRifle army [S12], Chu Shogi igui [S18] | rifle ≈ ×2 [S12][S3]; leaper N=8 = 308 cP [S2]; capture-only ×0.4–0.5 [S8] | 3.5 | 2.8–4.8 | value vs knight; decay as material falls; archer and guard synergy; two archers on same vs opposite colour |
| Paladin L | Kamikaze [S19], Ravager [S6], friendly hopper `t` [S26][S9] | Ravager ≈ Q+R despite 12×N mobility [S6]; gQ 1.8 [S9] | 4.0 | 2.5–6.0 | how often it ever captures, and what; zero mating contribution; midgame vs endgame weight |
| Guard G | Iron Ghost [S6], Duck [S21], Ultima Immobilizer [S16] | Ghost 0.5 P [S11]; Iron Ghost N to R [S6]; immobile piece 50 cP [S24] | 2.0 | 1.2–3.5 | draw rate by guard count; guard survival; quadratic term; guards blockading passed pawns |
| Maester M | Commoner [S24], Switching Chess [S22], Betza `udK` [S26] | Commoner 700 mg / 900 eg vs N 781/854 [S24]; N=8 = 308 cP [S2] | 3.5 | 2.8–4.5 | long-swap use rate and the Elo cost of removing it; maester and guard tandem; king safety after the swap |
| Beast S | Ultima Long Leaper [S16][S17], checkers king, Chu Shogi Lion [S18] | leaper N=7 = 265 cP [S2]; capture-only ×0.5 [S8] | 2.2 | 1.5–3.2 | chain-length histogram; Elo cost of turning the chain off; blocked plies against pawn chains |

## 10. Simulation hypotheses

Use the asymmetric-swap design in SIM-PLAN §4.2 (equal depth, colours alternated). "Implied value" = the regression weight on material imbalance.

1. **H1 Ordering.** Implied values order L > M ≈ A > S > G, with A and M in [3.0, 4.5] and G and S in [1.5, 3.0]. A different order falsifies the
   model above, not just its scale.
2. **H2 Archer beats knight.** N→A gains 20–80 Elo over 400 games. Above 120 Elo the archer needs a nerf, most likely losing the two-square ring
   or the right to check.
3. **H3 Archer decays.** Archer shots per ply fall by over 30% once each side holds under 20 points. Fit the implied archer value on short and
   long games apart; expect a gap of 0.8 P or more.
4. **H4 Archer and guard.** Add a product term A·G to the regression. Predict a positive, significant coefficient: guards wall the archer in
   while archers shoot through the wall.
5. **H5 Paladin is a one-shot.** Record per paladin: does it ever capture, on which ply, and the target value. Predict over 30% never capture and
   a median cashed value of 4 or more. A mean cashed value far below its implied value means the paladin is priced by threat, not by material.
6. **H6 Paladin cannot finish.** Count wins where the winner's last non-pawn material is a paladin. Predict near zero, and predict K+L versus
   K+minor draws. If so, give the paladin a lower endgame weight than midgame.
7. **H7 Beast chains are rare.** Record the chain-length histogram. Predict a median of 1 and under 15% of beast captures of length 2 or more.
   Then A/B the chain off: under 20 Elo delta it is flavour, not balance, and can stay for fun (the Ultima precedent [S17]).
8. **H8 Beast blind spot.** Measure plies where a beast is blocked head-on by an enemy pawn. Predict over 15% of beast plies while pawn chains
   are intact, and a negative correlation with the result.
9. **H9 Long swap is castling.** Measure the share of games that use the maester–king long swap, and the ply. Predict over 40% before ply 30. A/B
   it off: predict the side that loses it drops 15–40 Elo.
10. **H10 Guards draw games.** Compare draw rate by guard count per side (0, 1, 2). Predict a monotone rise of at least 10 points from 0 to 2,
   and guard survival near 100%. Fit a quadratic guard term and predict it beats the linear fit, because guards are super-linear in defence.
11. **H11 Archer colour split.** Among back ranks with two archers, compare opposite-colour starts with same-colour starts. Predict 10–30 Elo for
   the split pair, which would justify a Chess960-style constraint, as in Capablanca Random Chess [S29].
12. **H12 Arrangement spread.** Compare the variance of the white score across random back ranks with a Chess960 control of the same size.
   Predict a larger spread, because these pieces interact more strongly. If so, the sweep in SIM-PLAN §4.3 needs more games per rank, not more
   ranks.
