# 01: the animation recipe and the animation rules are short and current

**What to build:** The owner asked for one short animation recipe at the top of the art lessons, and for the new animation rules of the main checkout to join the committed art lessons. Both files must pass the docs lint, and the branch opens a pull request into main.

**Status:** resolved

- [x] `docs/lessons/art-and-motion.md` holds the section "Animation recipe and gates" after the intro line: seven numbered steps from the locked source art to the promoted bank, then the gates.
- [x] The gates name genuine transparency at all times, the 384×384 canvas, judgement at game size and normal speed, the interpolation method per frame, one owner go per batch with one queue row, art outputs outside the git worktrees, RIFE on the M1 or this Mac, and the process lookup with `ps -o pid=,command= -p <pid>`.
- [x] The new rules of the main checkout join the lesson: arm ownership across facing drawings, registration to the foot pivot, canvas size, transparency of every delivered frame, asymmetric topology, parallel batches, reuse of the existing tools, immutable published files, and separate projectile lifetimes.
- [x] No lesson is deleted. Duplicates merge. No lesson bullet holds more than 120 words.
- [x] `AGENTS.md` holds the section "Character animation": transparency for every frame and export, the recipe before any animation work, one owner go per batch.
- [x] `AGENTS.md` keeps the committed "Runs and compute" rules and adds the animation line. The section holds 120 words or less, so the Commits pointer and the supersession note of the old run gate merge away; the merge rule stays in "Commits and branches".
- [x] The steering lint counts twelve `AGENTS.md` sections and holds the phrases of the two new rules.
- [x] `LESSONS.md` Index holds the new lesson heading.
- [x] `npm run test:docs` passes; `npm test` passes.

**Owns:** `docs/lessons/art-and-motion.md`, `AGENTS.md`, `LESSONS.md`, `tools/steering.docs.test.ts`, this ticket

**Verify:** `npm run test:docs`; `npm test`.

## Comments

**2026-10-30, builder (branch `anim/art-rules-1030`).** The source of the new rules is the uncommitted copy of `docs/lessons/art-and-motion.md` in the main checkout. Its "Runs and compute" edit of `AGENTS.md` dropped Kaggle from the run rule and covered all compute, so this branch does not take it. Each long transparency bullet splits into two or three short bullets under its own lesson heading, with every rule kept.
