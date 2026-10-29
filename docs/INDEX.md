# Docs index

One line for each entry of `docs/`: the path, then the question that it answers. Find your question, then open the path. **Source of truth** marks the doc that wins where two docs hold the same facts.

Open work is in [TASKS.md](../TASKS.md). The rules for agents are in [AGENTS.md](../AGENTS.md).

When you add, move or remove an entry at the top of `docs/`, change its line here. `npm run test:docs` fails when an entry has no line or a link names no file.

## Rules and game design

- [RULES.md](RULES.md): What are the rules now, and when and why did each rule change? **Source of truth for the rules.**
- [MATRIX.md](MATRIX.md): Which abilities, conditions, powers and cards exist, and where does a new one go? Start here to design a piece, a power, a card or a rule. **Source of truth for the ability schema and for the status of each piece outside the pool (§A.3).**
- [PIECES-PROPOSED.md](PIECES-PROPOSED.md): Why did we propose the five fairy pieces, and what did each test find? For the status of a piece, MATRIX.md §A.3 wins.
- [KINGS-POWERS-PLAN.md](KINGS-POWERS-PLAN.md): How did we plan each king power in the engine (plan of 2026-09-14)? For the power rules, RULES.md §4 wins.
- [PROGRESSION.md](PROGRESSION.md): How can a player unlock the pieces one at a time (proposal of 2026-09-27)?
- [WORKSHOP.md](WORKSHOP.md): What does the Workshop do now, screen by screen? **Source of truth for its behaviour.** The reasons for each choice are in [the Proving Ground spec](specs/workshop-proving-ground/spec.md).
- [PARKED.md](PARKED.md): Which features are parked out of the web build, and how does old data load? **Source of truth for the parked features.**

## Look, motion and sound

- [painted-game/](painted-game/): What does the painted 2D game look like, and what did each change add? The painted look is the only look since 2026-10-11.
- [2d-first-pieces/](2d-first-pieces/): How did we make each painted piece and the board? The game imports [the board scene](2d-first-pieces/board/scene.mjs) from this folder, so its paths are code paths.
- [painted-motion/](painted-motion/): How does each piece move, and how does the board look in light (2026-10-02)?
- [visual-design/](visual-design/): What did the design and UX pass change, and do its contrast checks pass (2026-10-02)?
- [special-moves/](special-moves/): How does a player choose between two special moves, for example the Ogre's capture and push (2026-09-25)?
- [king-effects/](king-effects/): What do the board effects of the kings look like? A live preview page; `tools/king-effects-preview.mjs` records it.
- [kings-powers/](kings-powers/): How do the kings' powers look on the new-game screen and on a phone? Two screenshots.
- [styleboard/](styleboard/): Which art styles did we compare in rounds 1 and 2? A static page.
- [sounds/](sounds/): What do the board sounds sound like? One WAV file that `tools/render-sounds.mjs` writes.
- [trailer/](trailer/): How do we plan, animate and score the trailer? [PLAN.md](trailer/PLAN.md), [MOTION.md](trailer/MOTION.md), [AUDIO.md](trailer/AUDIO.md).
- [perf/](perf/): How did the first load get faster, and how does the game install and run offline (2026-10-02)?
- [PLAYABLE-CLAY.md](PLAYABLE-CLAY.md): What was the clay build, and why is it parked? History: the clay look is parked since 2026-10-11. **Source of truth for the clay build.**
- [playable-clay/](playable-clay/): Which screenshots and check logs prove the clay build of 2026-09-22? Evidence only; PLAYABLE-CLAY.md wins.

## Specs, tickets and status

- [specs/](specs/): What is planned or in progress for a feature? One folder per feature: `spec.md`, then one `issues/NN-<slug>.md` per ticket. [The issue tracker](agents/issue-tracker.md) gives the conventions. **TASKS.md is the source of truth for open items**; the ticket holds the detail.
- [tasks-archive/](tasks-archive/): What did the old task sections, the old handoffs and the dated snapshots say? One file per month, the handoffs, and three snapshots: [STATUS-2026-09-13.md](tasks-archive/STATUS-2026-09-13.md), [TAKEOVER-REVIEW-2026-09-14.md](tasks-archive/TAKEOVER-REVIEW-2026-09-14.md), [RELEASE-REVIEW-2026-09-16.md](tasks-archive/RELEASE-REVIEW-2026-09-16.md).
- [STATUS.md](STATUS.md): What was the state of the game after the takeover (2026-09-16)? History; for open work, TASKS.md wins.
- [status/](status/): What did the old status reports say? A page of 2026-09-13 ([index.html](status/index.html)) and a workbook of 2026-10-09 ([king-down-status-2026-10-09.xlsx](status/king-down-status-2026-10-09.xlsx)).
- [TAKEOVER-PLAN.md](TAKEOVER-PLAN.md): What was the plan to take over the v0.7 game (2026-09-14)? History.
- [takeover/](takeover/): What was the state at the start of the takeover ([BASELINE.md](takeover/BASELINE.md), 2026-09-16)? History.

## Release, hosting and the plugin

- [HOSTING.md](HOSTING.md): Where is the site, how does a deploy work, and where are the secret files? **Source of truth for the site, the deploy and DNS.**
- [plugin-preparation.md](plugin-preparation.md): How do I set up and check the private plugin and its match service on this Mac?
- [match-foundation.md](match-foundation.md): How do I use the match module for validated moves, saves and replays?
- [plugin-beta-support.md](plugin-beta-support.md): What must a private beta prove, and how do I support its players?
- [staging-support-operator.md](staging-support-operator.md): How do I run the support commands against staging, and never against production?
- [submission/](submission/): What goes in the plugin review packet? Drafts; the owner submits. Start at [checklist.md](submission/checklist.md).
- [safety/](safety/): Which terms, contact, safety and UK risk documents do we have? Drafts for the owner and a lawyer.
- [qa/](qa/): How does a QA agent test the plugin and review its UX, and what did the rounds of 2026-10-15 find?

## Research and runs

- [research/](research/): What did a study or a run find? One report per topic, `<topic>-<date>.md`: `sim-*` for simulation results, `piece-runs-*` for piece-value runs. A large study has its own folder, for example [web-adaptation-2026-10-18/](research/web-adaptation-2026-10-18/) and [multiplayer-2026-10-10/](research/multiplayer-2026-10-10/).
  - [piece-balance-criteria-2026-10-03.md](research/piece-balance-criteria-2026-10-03.md): How do we judge a piece of the pool? **Source of truth for the six criteria.**
  - [claims/](research/claims/): Which claims of a report does Jev check? One spec per report.
  - [sim-methodology.md](research/sim-methodology.md): Which statistics and test designs does the simulation use, and why?
- [QUEUE.md](QUEUE.md): Which runs are queued, running or done? **Source of truth for the runs.** AGENTS.md sets when a run may start.
- [RUNS.md](RUNS.md): What did run batch 2 test (2026-09-13)? History; record a new run in QUEUE.md.
- [SIM-PLAN.md](SIM-PLAN.md): How does the simulation measure balance and interest (method v2, 2026-09-13)?
- [balance/](balance/): Does each balance number come from a source, and does the game meet its declared target? Read [FRAMEWORK.md](balance/FRAMEWORK.md) first; the JSON files are the workbook and the evidence.
- [dashboard/](dashboard/): What do all the balance-lab runs show on one page? `npm run dashboard` writes it.

## Agents and machines

- [agents/](agents/): How do agents use the tracker and the domain docs? [issue-tracker.md](agents/issue-tracker.md) is the **source of truth for tickets**; then [triage-labels.md](agents/triage-labels.md) and [domain.md](agents/domain.md).
- [lessons/](lessons/): What went wrong before, by topic? Six topic files. [LESSONS.md](../LESSONS.md) holds the Always section and the index.
- [COMPUTE.md](COMPUTE.md): Which machine runs what, and how do I start a run? **Source of truth for the machine facts and the run recipes.**
- [DELEGATION.md](DELEGATION.md): Which work suits the M1 and its local models, and how do I prompt them? For policy, AGENTS.md wins.
- [LOCAL-AI-MACBOOK.md](LOCAL-AI-MACBOOK.md): How do I reach the M1 and check that it is the right device? **Source of truth for M1 access.**
