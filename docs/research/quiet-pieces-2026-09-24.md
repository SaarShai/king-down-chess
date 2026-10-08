# Quiet pieces: guard captures and beast chains (2026-09-24)

> Recovery status, 2026-09-24: Historical traffic definitions; zero Guard captures follows its rule. Activity counts alone do not justify evaluation bonuses. Catalog and qualifications (`dd34fa5:docs/cursor-recovery/2026-09-24-0213b442/RESEARCH.md`) · Adoption record (`dd34fa5:docs/cursor-recovery/2026-09-24-0213b442/EXECUTED.md`).

Context only: the 24-game depth-2 sketch in
`docs/research/shipped-balance-2026-09-24.md` saw **0 guard captures** and
**0.50 beast chains per game**, against common archer shots and ogre shoves.
That sketch is traffic colour, not an adoption case (including its one-draw
sample). This note answers two “is that expected?” questions from the shipped
rules and `src/ai/eval.ts`. It does not change the pool, propose a rule, or
retune the computer.

## 1. Guard captures: is 0 expected?

Yes. Zero is the shipped rule, not a measurement miss. The guard is a wall that
never captures: it may step onto empty squares only (`docs/RULES.md` piece table
and Decision 9; `guardCaptures: 'none'` in code, enforced in `canCapture` in
`src/rules/engine.ts`).

## 2. Beast chains: capture every step, and does eval prefer them?

A chain is only legal when every hop takes something: the beast may keep
capturing from the square it just landed on, and a continuation that is not a
capture simply does not exist (`src/rules/engine.ts` beast `chain` loop;
`docs/RULES.md` beast row). `src/ai/eval.ts` does not score “chain length” as
its own term — it only adds a small bonus for enemies sitting next to a beast —
so the computer has no special reason to set up multi-hops beyond ordinary
material when several takes already line up; rarity is the rule geometry, not a
blind evaluator.

## What a player should expect

In a normal game under today’s pool, expect archer shots and the odd ogre shove;
expect the guard never to take a piece; expect a beast multi-capture only when
enemies sit adjacent in a hoppable path (flavour, not the main beast verb).
What must stay unchanged: the immortal non-capturing guard (Decision 9) and
beast chains left on — turning them off did not reshape the game
(`docs/research/sim-beast-chains-2026-09-17.md`, kept in the shipped-balance
note). Do not treat the 24-game draw rate as a balance case.
