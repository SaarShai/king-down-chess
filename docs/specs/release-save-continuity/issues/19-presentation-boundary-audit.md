# Remaining presentation dependency audit

Status: claimed; investigation only

## Plan and verification

At exact source e92871fd7ef8aed2c2c14cc6e15cc7dfc4fc851f, map the remaining GameRules presentation methods and all product callers. Confirm whether enforcement uses any of them. Do not change product implementation, archives, runtime loading or gameplay.

Temporarily extend the existing real worker-builder test with three independent wording mutations: the cursor target phrase, the Guard guide sentence and the Firewall move description. Each mutation must preserve emitted enforcement bytes under the required boundary. Keep every existing control, especially the mechanical negative control. Use only `KINGDOWN_TEST_FILE=tools/plugin-worker-boundary.test.ts npm test`. Record the expected red, then restore the temporary test edit. No build or browser run beyond the builds inside this registered unit test.

The coordinator grants this focused CPU lane on 2026-10-20 (this is not an owner quote): “If a minimal actual wording mutation proof can run through existing npm test in isolated worktree without root edits, CPU lane is yours now.”

## Proposed outcome

Investigation only. A separate implementation ticket must remove the remaining presentation dependency as one complete boundary cut, without a public ambient-rules callback or a second class/framework. Existing tests and explicit owned inputs must preserve all words, custom design names, move semantics and UI behavior. Publish no archive in this investigation.

## Evidence

Exact base: `e92871fd7ef8aed2c2c14cc6e15cc7dfc4fc851f`. Isolated branch: `staging/u08-presentation-boundary-audit`.

Command: `KINGDOWN_TEST_FILE=tools/plugin-worker-boundary.test.ts npm test`.
Log: `/tmp/kingdown-u08-remaining-presentation-red.log`. Typecheck passes. The one selected real-builder test fails exactly three new assertions in 3.259 seconds; no other assertion fails. The existing catalog, ceremony, previous-turn, Beginner and evaluator invariance controls, mechanical negative control and compiled helper load/apply/reload probe complete. The 54 art checks do not run after the expected unit failure. This is a focused expected red, not a full-suite result.

Baseline: `sha256:8d6283617db3a5f4157225b8b1864810213f7e50d878393f391619756ef2e316`.

| Independent temporary edit | Mutated enforcement hash |
| --- | --- |
| `src/cursor-text.ts`: `, can go here` → `, may go here` | `sha256:2fd986edf9c9e14a8a88558e1ac74dbaff0a2dc68516c34e71b572c7f777232a` |
| `src/read.ts`: `Only a king can take a guard.` → `A guard can only be taken by a king.` | `sha256:5a312e66b3a76422492499d2d63f8869b58512bdf09636a7958b4b0c764ca8a5` |
| `src/move-text.ts`: `uses Firewall to protect all its pieces until its next turn.` → `uses Firewall to protect each of its pieces until its next turn.` | `sha256:97899284c739d2db87fa6e139799cf030f46e29b334309a255efa724da0a37b5` |

Only the temporary builder test was edited. It mutates copied sources in its existing temporary build fixture and restores each edit before the next probe. The test patch is retained at `/tmp/kingdown-u08-remaining-presentation-test.patch`; the worktree test is restored byte-for-byte to HEAD. Product files and archives are unchanged. No standalone build, browser check, database query or deployment runs.

## Caller map

None of these 16 GameRules methods is used by `Game`, `src/match/worker.ts` or `src/match/search-worker.ts` for enforcement.

| Existing import/methods | Actual product consumers |
| --- | --- |
| `read`: `pieceTitle`, `reachOf`, `pieceGuide`, `readText`, `readTap`, `unmarkedTap`, `guideTypes` | Shared plugin board, local play, Guide, Collection and table UI. `pieceStates` and `whyNot` have no direct product method caller, but their read-module functions remain used internally. |
| `move-text`: `checkCause`, `checkersOf`, `describeMove`, `threatsIn` | Local/shared board HUD, move history, choices, announcements and board-model readable descriptors. Check/threat geometry is computed for display; enforcement already uses engine check/status/legal operations. |
| `marks-model`: `railsOf` | Local play and shared board highlights only. |
| `cursor-text`: `cursorText` | Local keyboard speech and shared board cursor speech only. |
| `render/frost`: `frozenPieces` | PaintedView overlays only. |

Entry points: `src/game-rules.ts:5–9,57–72`; `src/game.ts:63–108` uses the mechanical methods; `src/match/worker.ts:77–113` uses snapshots/legal/apply; `src/plugin/screens/board-model.ts:46,102,118` uses descriptions only to attach words.

## Smallest complete next implementation

Remove the five presentation imports and all 16 methods from GameRules in one source slice. Keep existing helper modules; do not add a class, factory, wrapper, public scope or callback hook. UI modules import the existing helpers directly. Require an explicit owned context only where a helper needs it (a type-only GameRules/Pick input), and route legal/pseudo/attack generation, names, mark semantics and design lookup through that context. Preserve method receivers. Helpers that are already pure (`readTap`, `guideTypes`) need no owner argument. Remove the two unused public wrappers without removing their internally used functions.

Specific inputs: read helpers use owned `rules`, `legalMoves`, `pseudoMoves`, names, `playedDesign` and `markKind`; move-text uses owned names/`genPiece`/`pseudoMoves`; rails use the explicit owned design and existing pure `patternOf`; frozen overlays use owned `markKind`; cursor wording uses owned `nameOf`. The pool in `rules/setup.ts` is already a constant; do not invent per-game pool state. No new rule calculations or shared text catalog is needed.

Remove the obsolete ambient-helper classifications and these five modules' private-owner exemptions after their imports are pure or owned. Keep the real-builder wording controls above as permanent regression checks. Reuse read/move-text/marks/cursor/frost tests, previous-turn owned-name tests and existing GameRules boundary tests; add conflicting-owner cases for custom names, marks, generated attacks and designed rails. Preserve the exact eight Beginner sentences, keyboard text, guide words, refusal precedence, threat/check paths, last-move descriptors and overlay shapes. Root can run the affected shared UI regressions and compact archived differential corpus before one archive publication/recovery cycle.

This cut removes all five identified presentation edges at once. It does not promise that every English identifier in the rules core is cosmetic: the existing canonical piece names and stored design fields remain a separate, explicit boundary. Do not mix their storage/identity semantics into this ticket without separate proof.

The original Guard probe changes the first matching sentence, in the King guide. Ticket 20 targets the full refusal return statement to prove that edge separately.
