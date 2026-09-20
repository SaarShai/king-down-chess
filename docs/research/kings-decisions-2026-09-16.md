# Kings' powers — the five decisions the owner still owes (2026-09-16)

Companion to [sim-kings-2026-09-16.md](sim-kings-2026-09-16.md). The six tier-1 powers are
implemented, tested and measured with the current reading; these are the choices the proposal left
open. Each entry: what the proposal asked, what the engine does today, the options, the evidence, and
a recommendation. **No default changes without a decision here.**

## 1. Mercy vs guard immunity

- **Proposal (§1.10):** "the king captures nothing" and warns that an enemy guard then becomes
  *permanently* uncapturable — "the sharpest interaction trap in the document".
- **Engine today:** the Mercy king **may take an adjacent guard** (decision 15: a piece may be hard
  to take, never impossible). Everything else adjacent is untouchable by it.
- **Options:** (a) keep the guard exception; (b) forbid it, making the guard immortal against Mercy.
- **Evidence:** guard-heavy pools are the measured draw engine; per-piece pricing puts the guard
  under 1.5 pawns with the current rules. Making it permanently safe against one power raises draws
  further and contradicts design rule 1 in `PIECES-PROPOSED.md`.
- **Recommendation: (a).** The seam is one line in `canCapture` plus its mirror test.

## 2. Death Touch: one verb or two?

- **Proposal (§1.11):** asks whether the king *also* keeps the ordinary displacement capture.
- **Engine today:** the shot **replaces** it — the king can only take by shooting, never by moving
  onto the victim.
- **Options:** (a) shot only (current); (b) shot plus displacement capture.
- **Evidence:** option (b) was built as the `deathTouchMoves` toggle and measured on 2026-09-17
  (1,600 games an arm at depth 3, 400 at depth 4): decisive **−6.0 ± 2.7** versus the delivered
  reading's −5.0 ± 2.7, draws +4.2 ± 2.7, capped +1.8 ± 0.9, plies +8.0 ± 2.5; depth 4 repeats the
  direction (−6.3 ± 6.0). **Both readings drag draws** — the power is not the anti-draw tool the
  proposal imagined.
- **Recommendation: neither reading ships**; keep the power off by default and out of the picker
  until a stronger design exists. The toggle stays as lab evidence (`deathTouchMoves`).

## 3. March and Leap: always on, or three uses?

- **Proposal (§1.7/§1.8):** "3 uses, or always on" — the rulebook's charge counter.
- **Engine today:** **always on**; there is no charge counter anywhere.
- **Options:** (a) always on (stateless, no new state); (b) three uses per side (needs per-side state
  on `Position`, FEN fields, Zobrist keys, search make/unmake, and the exact-state serialization the
  takeover review calls a prerequisite for any extra-turn feature).
- **Evidence:** the campaign measures the always-on reading. Charges are flavour, not power; they
  would also make two identical lab arms play differently by history, which the current A/B design
  cannot express.
- **Recommendation: (a)** for the lab and any first exposure. Charges are a tier-2 plumbing project
  of their own, not a wording change.

## 4. May two Mercy kings stand adjacent?

- **Proposal (§1.10):** asks, since a Mercy king attacks nothing.
- **Engine today:** **no** — the empty-square king-adjacency invariant is unchanged, so kings keep a
  square between them.
- **Options:** (a) keep the invariant; (b) allow adjacency between two Mercy kings (or any pair).
- **Evidence:** (b) creates a position class where neither king can ever capture the other, and makes
  check/mate detection depend on both powers — a new special case in the hottest function in the
  engine. It buys a rarer, stranger endgame at real correctness risk.
- **Recommendation: (a).**

## 5. Darkness and the evaluation

- **Proposal (§1.12):** the fitted shield terms assume today's pawn, so a Darkness game is played
  through an evaluation that misprices its pawn structure.
- **Engine today:** **not re-fitted**; the campaign reads Darkness through the shipped evaluation.
- **Options:** (a) keep the caveat on every Darkness number; (b) re-fit the shield (and pawn PST)
  weights on a Darkness corpus with `npm run tune`, then re-run the A/B.
- **Evidence:** the plan's own instruction is to resolve the confound only if the rule is a serious
  candidate. A refit needs a fresh corpus and turns a 1-hour measurement into a day.
- **Recommendation: (a)** unless Darkness wins its A/B by more than the confound could explain — then
  (b) before any adoption.

## 6. Strike (Flame A), now built — keep the queen-move reading?

- **Built 2026-09-17:** once per side, any own non-king piece moves as if it were a queen; the piece
  keeps its type, never takes a king, never promotes (`Position.strike`, FEN field 7, LAN `!`).
- **Measured (1,600 games an arm, paired arrangements and seeds):** decisive **−15.5 ± 3.2** points
  at depth 3 and **−20.2 ± 5.8** at depth 4; draws **+22.2 ± 5.8** at depth 4; mean plies −27.6 ± 3.6;
  white score +2.3 ± 2.6. Both sides use it (~1 use each per game). It is a **draw engine**, not the
  one-turn surprise the proposal imagined — the same direction as Death Touch.
- **Options:** (a) keep the reading (the lab can hold it, but it does not improve games);
  (b) shelve it — `parseKing` keeps refusing it until a reading measures better; (c) try the card
  game's other verb, **Strike = capture without moving** (RULES.md §5), as a second reading A/B.
- **Second reading measured 2026-09-17** (`strikeMode=capture`, 1,600 games an arm at depth 3 plus
  400 at depth 4, same seeds): decisive **−0.101 ± 0.034** then **−0.295 ± 0.073**, draws
  **+31.5 ± 7.4** points at depth 4, plies −37.5. Used ~1.94 times per game. It is **worse** than
  the reading as written: each side spends its one free capture on the piece that matters, the board
  simplifies and the ending is drawn.
- **Recommendation: (b) shelve.** Neither reading improves games. The power stays built, tested and
  off by default (like the lab pieces); `parseKing` still accepts `flame:strike` for lab work, but
  nothing selects it and no verdict depends on it. Revisit only with a different verb.
