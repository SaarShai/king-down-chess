# Full native rules port and AI comparison

The native test port now covers all twelve king powers and all 36 card names in
King Down's reference engine, beside the six ordinary and nine fixed fairy
pieces. It remains on `codex/fairy-stockfish-eval`. No shipped AI, game rule,
price, deployment or merge changes.

## Evidence

Card campaign: `fairy-stockfish-full-20261011`. The current certification is
`native-check-4` and `rebuild-check-1`. Both builds agree on 2,391 positions,
139,014 atomic effects and 161,506 complete search turns. All recorded check
hashes match. Inputs include both rule profiles and colours, every king pairing,
every card, both Mirror variants, reserve and draw state, sparse material,
delayed availability, marks, held turns, the base corpus and seeded legal traces.
Every child FEN and check flag, all attack maps and terminal states agree.
Native assertions check physical boards, cold/predicted search keys, material,
pawn keys, piece-square scores, undo, promotion data and complete TT payloads.

`controls-2` records 192 legal bounded search replies, ordinary perft through
8,902 nodes, rejected illegal history and configuration inputs, and a legal
repetition cycle that moves a pawn back to its old square. The prior native port
misses this draw because it bounds history by the fifty-move clock. The baseline
failure is saved separately. The full port uses complete real history.

The first game smoke exposes a Control exclusion error: a borrowed Paladin
capture carries self-removal before Control removes that flag. The own-reach
filter must test the resulting plain capture shape without the borrowed
self-removal restriction. A two-colour, two-profile regression fails on the old
binary, including a copied Control, then passes on the repaired build. Failed
output and the old binary remain in `control-before`; the incomplete smoke is
not a strength sample.

The corrected `smoke-fixed` has eight completed games and 874 checked actions,
with 882 full legal-set/state checks. The current residual AI wins six; the
native engine wins two. No move is illegal and no game reaches the action cap.
This is a small smoke with one army, not an Elo estimate or a final strength
comparison. Its exact reference source is in `smoke-fixed-source.tgz`.

The earlier ordinary/one-capture smoke and base-piece certificates retain their
own snapshots and source commits. Their results do not enter this comparison.

## Search design

An independent C++ module implements the rules. It does not delegate native
legality to the TypeScript engine. Atomic-action parity is checked separately
from the search adapter. The adapter compiles a held first action and each legal
follow-up/pass into one alternating search turn. A draw after the first action
ends the turn. The move and TT retain both complete action payloads.

During comparison, validate the entire native plan, play its first action, and
request a new decision if the player still holds the turn. Both engines receive
80 ms per atomic decision. Record actual latency, including overrun, instead of
assuming equal nominal time means equal work. Both run on the same machine.
Native threads are one; hash is 16 MiB; NNUE is off. The current opponent uses
the browser's residual evaluator, temperature zero and one PV.

Orthodox null moves, cycle shortcuts, specialized endgame tables and
single-square exchange pruning are disabled for King Down. The evaluation
still uses approximate movement, pawn structure and piece values. Correct rules
do not imply a strong evaluation.

## Controlled match

The frozen match has 192 games: 24 fresh random armies, four explicit groups,
and two engine assignments per group/army. Groups are fixed fairy pieces with
no powers; default kings; balanced kings; balanced four-card hands. The two king
groups cover every power twice. The card group uses the approved explicit
28-card test pool. Pairs keep rules, start and deal fixed and swap the engines'
colours. No prior results enter this sample.

A 400-action cap is censored, not a draw. Report wins, true draws, caps, side
splits, actual latency, card/power use and complete-turn counts. Use army blocks
for uncertainty because the four groups share starts. Report subgroup results as
descriptive; do not select new tests or adopt rules automatically.

The two-game Kaggle pilot must pass source, settings, schedule and legal replay
checks and establish Linux timing before later parts launch. Five later parts
have 38 games each. M1 is on AC power but busy with another task; preserve it.
Keep at most five active account notebooks and each below nine hours. Check
only at expected completion times. Final match results and backup receipt are
pending until the campaign completes.

## Support limits

The contract accepts explicit default and balanced profiles, standard promotion,
1–6 uses for the six stateful king powers, 0–6 uses for March/Leap, hands of at
most eight dealt/drawn cards and explicit piles of at most 64. Unsupported lab
or workshop signatures are rejected. Unlimited stateful powers need another
history design before support. The reference repetition identity ignores move
number; the native repetition identity matches it, while the search key also
separates delayed-card availability.

No training, browser build, phone validation, production plugin adapter or AI
replacement is included. A later product decision needs the completed match,
measured latency and the existing GPL/source distribution assessment. This port
is a rules and search prototype.
