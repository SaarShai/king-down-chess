# Rules version as the game identity

Status: examined 2026-11-05; recommendation: do not build it. No code is written. The owner decides. Source: the 2026-11-01 code audit, item 5 ("A rules version, not a bundle hash, as the game's identity").

## Result

The audit proposed to tie each stored game to a rules version number in place of the hash of the compiled engine file. The reason given: a change that keeps the rules still makes a new engine archive.

That cost is much smaller in the code today. The tested display and evaluation edits no longer require a new engine archive; other changes that keep the rules (a refactor of the rules code, a build tool update) can still require one:

- The enforcement bundle excludes the tested page display and evaluation paths. `tools/plugin-worker-boundary.test.ts` builds the real bundle and confirms equal bytes for its sample edits to card text, ceremony, narration, teaching text, move text, evaluation, skill and weights. The bundle still holds the text of rule checks.
- `engines/` held 5 pairs at the 2026-10-20 release (`cc1081b2`) and 15 pairs at release 5 (`70e569bc`, 2026-10-30). It holds the same 15 pairs at release 9 (`ffa35671`, 2026-11-05). Releases 5 to 9 added no archive.

The price of the change is high (see "What the change needs"). The recommendation is to keep the hash identity and to watch the archive count.

## How it works today

Facts from the code at `2480779b`:

- A compiled worker gets its identity from the build: the build hashes the minified enforcement bundle while it holds a placeholder stamp, then writes `sha256:<hex>` in its place (`tools/plugin-runtime-build.mjs`, `buildWorker`). A tsx run uses a hash of the source tree: `src/rules/`, `src/workshop/`, `src/game.ts`, `src/game-rules.ts` and the worker (`src/match/worker.ts`).
- An account save (`MatchSave`, `src/match/index.ts`) holds the identity, the setup, the initial position, the complete rules object, and each accepted engine action with its resulting position, ply and status.
- `loadMatch` runs a save on the archived bundle with the same identity (`engines/<hex>.mjs`). A save with no archive goes to the current worker, which accepts only its own identity. The selected worker creates the setup again with its own code, compares the initial position and the rules object, then replays each action and compares each result (`load`, `src/match/worker.ts`).
- A Node runtime build stops when the current bundle has no archive pair. An agent then runs `npm run plugin:archive:runtime` and commits two files (the current pair is about 100 KB).
- `engines/` holds 15 pairs (2.95 MB).
- The page compares its own engine identity with the identity of the game. When they are equal, the page computes draft moves with its own rules; when they differ, it asks the server for a preview (`src/account-game/engine-identity.ts`).
- Local games in the browser (`kingdown.save`, shared links) hold no identity and replay on current code. That is a different contract; it is no proof for account games.

From the read-only production report of 2026-11-05 (release 9 log): 5 unfinished account games on 3 of the 15 engines.

## What the change needs

An independent review of the first draft of this design found that it was not sound. The main points, each checked in the code by the reviewer:

1. **The proposed checks do not prove that all future play stays equal.** The proposed guards (a signature over the perft positions, a corpus of recorded games, a replay of production games before a publish, the replay check at load) compare past actions and short move trees. They do not prove that all later moves of an open game stay equal. Example: a lower history limit can pass these checks when all checked histories stay below it, and then stop an open game later.
2. **Rollback.** A release that is older than a game's rules version cannot load that game. A return to hash identities helps only later games. Each release would need a tested recovery artifact for each identity it creates.
3. **Two server builds during a deploy.** The engine work for a command runs before the row lock. The checks before a publish use one database snapshot. Games that an old server writes after that snapshot are not covered.
4. **The page.** With a rules number, "equal identity" becomes a claim of compatibility, not of equal code. A missed version change lets an old page compute drafts with other rules than the server.
5. **Setup and limits are outside the worker.** Army draw, card deal, king choices, pending setups, turn limits, history draws and deadlines run in current service code. A rules number for the worker does not freeze them.
6. **The computer player on an archived engine.** Archives that return a search context use the current search worker and must supply the current rules keys. A new required key breaks that path for old contexts, with or without a version number. Older archives keep their built-in search.
7. **Many places test the identity text.** Archive routing and pins (`src/match/index.ts`), the worker stamp, the preview schemas for HTTP and MCP, the runtime build and its tests, `tools/engines-check.mjs`, `tools/engines.test.ts`, the runtime smoke check, the server check, the shared mechanics check, the card detail check and a setup database test. The database column itself is free text and needs no migration.
8. **The version number needs its own protection.** A test of the code against a ledger in the same branch passes when the ledger line is edited. The check must compare with `main`, and must refuse a changed old line, a reused number and a lowered number.

## Decision for the owner

Recommended: **keep the hash identity. Do not build the rules version.**

- The cost that the audit named is much smaller since the boundary work of October.
- What stays: one archive step when the enforcement bytes change (a rules change, a refactor of the rules code, or a build tool update that changes the output). No such step was necessary in releases 5 to 9.
- The change would replace an exact guarantee with tests that cannot be complete, and it touches the save path of each account game.

Watch rule: when a new archive pair appears, the release entry in `evidence/production-release/LOG.md` says what caused it. If rule-neutral changes cause more than two new pairs in a month, examine the smaller alternative below first.

## Alternatives, if the archive count grows again

- **A rules number as a name, not as the identity.** Keep the hash in each save. Publish one fixed enforcement artifact for each rules release and give it a number for people and release records. Its bytes never change under a stored identity. This keeps exact continuation.
- **Pin the build tools of the enforcement bundle**, so that a tool update does not change its bytes without intent.
- **No archives, old rules as switches in current code.** Rejected: each past rule stays in the engine for all time.

## Related

- The perft tables (`docs/specs/perft-variants/`) stay useful without this change: they catch an unintended change of move generation in each PR.
- The fault of the computer player under `secondPlayerDoubleFirstTurn` is recorded there.
- Retirement of old archives follows `engines/README.md`.
