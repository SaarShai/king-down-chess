# The Warden — a two-step guard against the Wall (2026-09-13)

The guard keeps its identity: **immortal** (only a king removes it) and it **captures nothing**. The
pool now deals each army **one** guard (`POOL = 'QLRRBBNNAAGMMSS'`). Does it step **two** squares?

| name | rules | idea |
|---|---|---|
| **Wall** (today) | `guardStep=1` | the guard shuffles one square at a time |
| **Warden A** | `guardStep=2` | two squares along a line, through empty squares, move only |
| **Warden B** | `guardStep=2 guardNoSecondRank=true` | the same, and it may never end a move on rank 2 (rank 7 for Black) |
| **Control** | `guardNoSecondRank=true` | the ban alone, to price it apart from the step |

## 1. Method

Each variant plays a **paired A/B** against the Wall: the same 60 back ranks and opening seeds
(`commonSeeds`), 1 500 games an arm, depth 3, 4 random opening plies, ply cap 300, Fishtest
adjudication. Both populations play themselves, so there is no match and no SPRT; read the **mean
paired difference over the 60 ranks**, at a 95% normal approximation.

**Every A/B rank holds exactly one guard**, because a random draw gives one to only 47.9% of setups.
**Multiply any difference below by 0.479 for the effect on the game as it is dealt.** The value arm
is Muller's odds match: the guard replaces a knight of `RNBQKBNR` on one side, 300 colour-reversed
games, `--eloPerPawn 64`, one seed for all arms. Activity, drag and the excerpts come from
`tools/warden-report.ts`, which reads every rule **off the moves**, never off the spec (`LESSONS.md`).

## 2. The pool holds one guard

`randomBackRank()` was drawn **20 000** times from the shipped pool: 9 571 ranks hold one guard,
10 429 hold none, **none holds two** — the 15-letter pool carries a single `G`. The run records
agree: over the **12 000 side-games** of the four A/B arms, no rank holds two.

## 3. What the guard is worth (odds match vs a knight)

| arm | score | Elo vs knight | paired Δ score vs the Wall | paired Δ Elo |
|---|---|---|---|---|
| **Wall** | 0.220 | **−220 ± 31** | — | — |
| **Warden A** | 0.255 | −186 | +0.035 ± 0.038 | **+35 ± 39** |
| **Warden B** | 0.255 | −186 | +0.035 ± 0.058 | **+35 ± 59** |
| **Control** | 0.188 | −254 | −0.032 ± 0.057 | **−32 ± 58** |

The Wall replicates its earlier price (−207 ± 32, `sim-rules-2026-09-13.md` §2). **No guard rule
reaches a minor piece**: 220 Elo is 3.4 pawns below a knight, outside Muller's ±1.5-pawn band, so
read the column as a direction and not a value. **The second step pays about +35 Elo, the ban alone
costs about −32, and together they cancel.** Each interval crosses zero, so no row is a finding
alone; the pattern is, because §5 explains it — the ban holds a one-step guard on its own back rank,
while a two-step guard steps over it.

## 4. The three A/B arms against the Wall

The Wall column is pooled; each Δ column is that variant's mean paired difference over the same 60
ranks, with its 95% interval. **Bold** clears its interval; the ending row is two-sample binomial.

| metric | Wall | Warden A Δ | Warden B Δ | Control Δ |
|---|---|---|---|---|
| White score ± CI | 0.532 ± 0.021 | +0.005 ± 0.024 | −0.014 ± 0.027 | +0.013 ± 0.027 |
| decisive share | 0.702 | **−0.027 ± 0.023** | −0.026 ± 0.028 | **+0.041 ± 0.028** |
| draw share | 0.283 | +0.010 ± 0.021 | +0.024 ± 0.025 | **−0.035 ± 0.027** |
| capped share | 0.015 | **+0.017 ± 0.009** | +0.002 ± 0.009 | −0.005 ± 0.007 |
| dead material / of it 50-move | 0.022 / 0.013 | +0.009 ± 0.011 / +0.003 ± 0.009 | **+0.013 ± 0.012** / **+0.011 ± 0.010** | −0.007 ± 0.010 / **−0.007 ± 0.007** |
| mean plies | 121.7 | **+5.7 ± 3.2** | +1.1 ± 3.3 | **−7.4 ± 2.7** |
| branching | 31.8 | **+1.4 ± 0.2** | **−0.4 ± 0.3** | **−2.1 ± 0.2** |
| interest, raw / residualised | 0.480 / −0.000 | −0.000 ± 0.004 / +0.001 ± 0.003 | +0.001 ± 0.005 / +0.004 ± 0.004 | +0.004 ± 0.005 / −0.000 ± 0.004 |
| interest (min-use), raw / resid. | 0.472 / 0.012 | **+0.011 ± 0.010** / **+0.012 ± 0.010** | +0.003 ± 0.011 / +0.006 ± 0.010 | **−0.082 ± 0.013** / **−0.085 ± 0.012** |

**Balance does not move anywhere**: no arm's White score clears its interval. **Warden A** costs 2.7
decisiveness points, 6 plies and 1.7 capped points, reaching 3.3% against the 5% gate; its one gain
is the min-use interest term, which the guard itself sets. **Warden B** pays the pace back — length,
capped share and branching all return to the Wall — but not the ending, where dead material and
50-move draws each rise by about one error bar. **The Control is the trap row**: it gives the
campaign's best pace numbers and buys them by **deleting the piece** (§5), and the min-use term
falls 0.082 to say so.

## 5. Guard activity

3 000 side-games an arm. `(plies)` is a share of the plies in which that side holds a guard.

| arm | moves/game | 2-step/game | squares seen | adj. king (plies) | shields a king ray (games) | on the enemy promotion rank (games) | own 2nd rank (plies) | survival | taken by a king |
|---|---|---|---|---|---|---|---|---|---|
| Wall | 4.43 | 0.00 | 3.53 | 33.2% | 16.2% | 74.7% | 29.1% | 95.2% | 145 |
| Warden A | **6.19** | 1.97 | **4.40** | **36.2%** | **21.5%** | 75.6% | 27.0% | 96.0% | 119 |
| Warden B | 4.76 | 2.77 | 3.35 | 25.9% | 10.9% | **88.8%** | **0.0%** | 96.2% | 114 |
| Control | **1.66** | 0.00 | **1.92** | 21.6% | **2.2%** | 92.8% | **0.0%** | 96.1% | 118 |

The 2-step column separates the Wall from the Wardens and the second-rank column reads **0.0%**
wherever the ban is on, so both rules are confirmed from the moves. **Warden A is the only arm that
makes the guard do more of everything.** **Warden B trades the bodyguard for the picket** — the
square in front of the king *is* the second rank, so the ban costs a third of its king contact.

## 6. Guard drag

Share of **drawn** side-games with a guard among the side's last 3 non-king pieces, or next to its
own king at the end. **Warden A drags**: half its drawn games end so, against two in five for the Wall.

| arm | drawn side-games | among the last 3 | next to its king | either |
|---|---|---|---|---|
| Wall | 894 | 10.1% | 32.3% | 40.5% |
| Warden A | 976 | 15.8% | 39.0% | **52.0%** |
| Warden B | 972 | 14.1% | 30.9% | 43.7% |
| Control | 772 | 11.1% | 20.9% | 31.1% |

## 7. What a Warden does that a Wall cannot

All from `ab-warden-a.var`. Each move covers two squares in one turn, so a one-step guard cannot
answer: the square it needs is two moves away and the opponent moves in between.

- **Seal a file** — #51, ply 115. Black checks with `Rh1-d1`; `Gf2-d2` shuts the d-file for good.
  `f4-f5 Rh1-d1 Gf2-d2 Rd1-b1 f5xg6` — `8/2g2kp1/6pp/R4P2/P2KA1P1/2P5/3G4/3r4 b - - 0 58`
- **Escort a pawn** — #13, ply 213. `Rg2-g7` attacks d7; `Gc5-e7` blocks the rank for good.
  `Gd5-c5 Rg2-g7 Gc5-e7 Gf8-h8 Ge7-f7` — `5g2/2kPG1r1/4K3/8/8/8/8/8 b - - 0 107`
- **Deny a promotion square** — #3, ply 110. White's pawn reaches h7; `Gf8-h8` stops it for good.
  `a4-a3 h6-h7 Gf8-h8 Af4-e5 a3-a2` — `3p3g/7P/p3p3/3m4/2kP1A2/p3K3/8/5G2 w - - 0 56`

## 8. Recommendation

**Adopt Warden A (`guardStep=2`). Do not adopt the second-rank ban.**

*The identity argument.* The guard is immortal and mute: only a king takes it, and it captures
nothing. **Neither candidate touches either clause.** The second step changes **reach**, and reach is
what one guard needs. The 2017 wall was two guards side by side; the pool now deals one, so the piece
is a bodyguard — and a one-step bodyguard arrives a move late at every square that matters (§7).

*The price.* Warden A costs 2.7 decisiveness points, 6 plies, 1.7 capped points (3.3%, under the 5%
gate) and takes the drag from 40.5% to 52.0%. The guard is the draw engine and always was — batch 3
measured two guards at +20.1 draw points. **One guard an army already refunded most of that; the
Warden spends a small part of the refund to make the piece play.** At +35 ± 39 Elo it stays 186 below
a knight, so it does not become strong — it becomes a piece that does its job.

*Why not Warden B.* The ban buys the pace back, but it takes the guard away from its king (contact
33.2% → 25.9%, shields 16.2% → 10.9%) and raises dead-material and 50-move endings; a guard that may
not stand in front of its own king is not the piece the rulebook draws. **Reject the Control**: it
wins every pace metric by making the guard inert — 1.66 moves a game, 2.2% shields.

## 9. Limits

Depth 3, one rank set, 1 500 games an arm; nothing here is confirmed at a second depth, which
`SIM-PLAN` §9 asks for before a rule ships. The A/B conditions on a guard being dealt, so scale by
0.479 for the whole game. Warden B's ending rows sit at about one error bar. A larger pass is
**prepared but not run**: raise `games` to 3 000 in `sim/specs/warden/{a,b,ctrl}.json`, then replay
each with `npm run sim -- --spec sim/specs/warden/<arm>.json --experiment ab --workers 16`; the runs
resume from their JSONL, so the 1 500 games already played are kept.
