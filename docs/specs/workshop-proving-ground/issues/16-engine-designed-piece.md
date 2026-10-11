# 16 · Engine: the designed-piece case (later)

Status: done
Size: M
Blocked by: none
Later: not needed for v1; A works on the Try board with `movesOf`, and a design in real games is a separate owner choice (spec, open decision 1).

## Scope

- One designed piece per game plays by the engine (`REVIEW.md` §6 item 4).
- The design uses the type slot of the Templar (`T` = 15, `src/rules/engine.ts:19`) only while a new rule, `RULES.design`, is set. The Templar is paused and rejected (`docs/MATRIX.md:69-84`), so a game never needs both. With `RULES.design` null, nothing changes.
- One move interpreter: the body of `movesOf` moves into the engine; the Workshop calls it.
- Why the slot and not a type 16: the 4 type bits are full; a fifth bit moves the colour and `SPENT` bits and touches FEN, Zobrist (`SLOTS`, `src/ai/zobrist.ts:39`), the NNUE input (`src/ai/nnue/net.ts:103`), the reserve index and the value tables.

## Plan

1. [x] **`src/rules/design.ts` (new):** `DesignSpec` (the canonical squares, lines and rules; the types move from `src/workshop/model.ts`, which re-exports them; "moves like" expands when the spec is made). `genDesigned(board, from, mode, out, spec, refused?)`: the body of `movesOf` (`src/workshop/moves.ts:48-134`) with the modes (`attacks`: first-level takes and shots only; `captures`: no quiet moves) and `canCapture` (`engine.ts:406-433`) in place of `takes()`. History Whens read `SPENT` on the byte.
2. [x] **`src/rules/rules.ts`:** `design: DesignSpec | null` (default null); `parseRule('design=…')`; `setRules` (`:820-832`) refuses a spec that breaks `limit()`. The balance schema holds the rule keys: add a `design` entry to `RULE_DIMENSIONS` (`src/balance/schema.ts:96`), or `src/balance/schema.test.ts:22` and `:109` fail; `sourceContract` (`src/balance/design.ts:301`) reads the new `Rules` field from the source, so `npm run balance:check` must pass too.
3. [x] **`src/rules/engine.ts`:**
   - `case T` in `genPieceRaw` (`:827`): `if (RULES.design) return genDesigned(...)`.
   - `canCapture` (`:406-433`): a design attacker with an "always" `cannotTake`; a design victim with an "always" `cannotBeTaken`.
   - The shelter seam (`:455-486`): a design victim whose `cannotBeTaken` When reads its square becomes a shelter level; `isAttacked` mirrors it.
   - `isAttacked` (`:1141-1227`): turn off the two Templar terms (`:1161`, `:1217`) while `RULES.design` is set; add a forward test with `genDesigned(..., 'attacks')`.
   - `landed` (`:965-969`): set `SPENT` when a design takes and a rule reads it (`afterFirstCapture`, `firstTake`).
4. [x] **`src/rules/setup.ts`** `toFen` (`:92`), `fromFen` (`:167`): a letter for a spent design (`H` is the spent guard).
5. [x] **`src/ai/eval.ts`:** `VAL[T]` and `VALUES[T]` from the judge worth through `setPieceValues({ T })` (`:130`) in the worker after `setRules`; turn off `TEMPLAR_ON_CAPITAL` (`:513`) for a design.
6. [x] **`src/workshop/moves.ts`:** `movesOf` becomes a thin call of `genDesigned`; `moves.test.ts` keeps it equal to the pool pieces.
7. [x] **Version 1 limits:** one design per game; `fromMove`, `beforeMove` and `afterCard` are refused with a reason.

## Verification

- [x] `npm test` passes, with no change in: the balance schema tests (`src/balance/schema.test.ts`) other than the new `design` key; `npm run balance:check` passes; perft 20, 400, 8902 (`src/rules/rules.test.ts:22-28`); `crossCheckAttacks` (`:228-255`); the Templar tests; `src/ai/legality.test.ts`; `src/ai/search.test.ts`; the power and card tests.
- [x] New tests: with `RULES.design` set to each preset, `genPiece` of `T` equals the pool piece in all three modes on 500 random boards; perft parity with the queen as `T`; `crossCheckAttacks` with seeded random designs; `legality.test.ts` with a design; a design gives mate, and a design that cannot take a king never gives check; a FEN round trip with a spent design.
- [x] `npm run check:browser plugin-ui` and `plugin-ui-http` pass (by name); the plugin page size before and after (`engine.ts` and `rules.ts` are in the plugin page, web-redesign spec rule 5). Stop and ask at 4,350,000 bytes.
- [x] No game run without the owner's go.

## Risks

- Low for the shipped game: each new path is behind `RULES.design !== null`. Medium inside design games: the attack mirror, chain branching, the evaluation.

## Does not do

- No UI to play a design (17). No second design slot. No ranged lines.

## Comments

### 2026-10-11 · built on `claude/pg-design`

Evidence (the logs are outside Git, in `/tmp`):

- `npm test` through the shared lock: run 1 (`/tmp/pg16-test1.log`) had 3 failures: 2 new tests had bad inputs (changes 9 and 10), and `src/match/match.test.ts` found change 8. Run 2 (`/tmp/pg16-test2.log`, the final code): exit 0; 117 test files pass (1 skipped), 1,901 tests pass (21 skipped); the node tests, 50 of 50.
- `npm run balance:check`: 98 rule axes, 0 errors.
- `npm run check:browser plugin-ui`: pass (`/tmp/pg16-plugin-ui.log`). `plugin-ui-http`: run 1 stopped at once, because `PLUGIN_TEST_DATABASE_URL` was not set (`/tmp/pg16-plugin-ui-http.log`). With the local test database of `docs/plugin-preparation.md`, after `npm run plugin:db:init-test`, it passes (`/tmp/pg16-plugin-ui-http2.log`). On the final code both pass in one run (`/tmp/pg16-checks3.log`, `pg-design-1oZvgt`).
- The plugin page (`node tools/plugin-ui-build.mjs`): 4,298,020 bytes before, 4,306,624 bytes after (+8,604), below the 4,350,000-byte line. Most of the increase is `src/workshop/model.ts`, `vocab.ts` and `figures.ts`, which `rules.ts` now imports for `limit()` and the share code.
- No game ran.

Changes from the plan, each with its reason:

1. `genDesigned` has one more optional parameter, `st` (the Try state). The Try board still needs "from move N" and "after a card". In a game, `st` comes from the byte: `SPENT` is "after its first capture", and the move and card Whens never reach it (`setRules` refuses them).
2. `DesignSpec` is `{ squares, lines, rules, like }`: `like` holds the squares and lines of the "moves like" piece, expanded by `specOf` (`src/workshop/model.ts`). The engine thus needs no preset table.
3. The attacker byte that `genDesigned` gives `canCapture` has the type `T`, also on the Try board. Thus a design with a guard body does not get the guard's capture rules. The refusal sink names every `canCapture` refusal "guardImmune"; on the Try board that is the only one.
4. The shelter seam: a new level 4 ("only a king takes it") beside 1 ("no pawn takes it"). `isAttacked` answers level 4 with the king's own attack list. With a king power's shelter too, both levels hold (Reviews, item 3).
5. `isAttacked` tests a design forward (`designHits`). An empty target counts as an enemy king on that square, so a design that cannot take a king does not attack an empty square either.
6. `src/ai/search.ts`: the fast legality path tests every move while `RULES.design` is set. A design's Whens read the squares next to it, so a move anywhere near it can wake a rule that attacks the king.
7. The spent design's FEN letter is `U` (`H` is the spent guard).
8. `src/match/worker.ts` hashes `src/workshop` too, and `match.test.ts` copies it: `rules.ts` now imports the workshop model, so a change there changes the engine.
9. The new legality test is in `src/rules/design.test.ts`, not in `src/ai/legality.test.ts`, so that file stays unchanged, as Verification asks. The same applies to the cross-check: `crossCheckAttacks` is unchanged, and the design file has its own copy with random designs and spent bytes.
10. The values: `src/ai/worker.ts` sets `T` to the judge's worth × 100 after `setRules`. `src/sim/game.ts` and the main-thread fallback in `src/game.ts` do not do this yet. A simulation run, or a page that plays a design (17), needs that line first.
11. With the limit H12 (only a king takes it, so it cannot take), a design with "cannot be taken by anything but a king" never takes. The shelter test thus uses a king's step with no take.

### 2026-10-11 · Reviews

Two reviewers read c10714a5..368347fb (`review-16a.md`, `review-16b.md`, outside Git). A finding is confirmed only with a failure that we can show. The two new tests in `src/rules/design.test.ts` failed before the fixes and pass after them.

1. **A design's push and `ogreShoveFriends`** (16a.1, should-fix): confirmed. The filter dropped every move with `shove`, also a design's push. Test: `ogreShoveFriends: 'enemies'` removed a design's push of a friend. Fix: the filter applies only when the mover is an Ogre (`genPiece`); the two comments are correct now.
2. **A design's swap with a guard** (16a.2, nit): confirmed. With `guardNoCapital`, a design on d4 swapped with its guard on c3, and the guard landed in the capital. Fix: `guardMayLand` is exported, and the swap asks it, as the Maester's swap does.
3. **A king power's shelter replaced the design's level** (16a.3 nit, 16b.1 should-fix): confirmed. Mercy's balanced shelter (3, only a pawn takes) and a design "next to its king: no pawn takes it" (1): an enemy pawn took the design. Fix: `sheltered` combines the two levels: 1 and 3, or 4 and 3, give 2 (nothing takes); 1 and 4 give 4. This replaces change 4's "the king power takes precedence". Test: the pawn cannot take, and `isAttacked` agrees.
4. **The source stamp of a run did not hash `src/workshop`** (16b.2, should-fix): confirmed. `rules.ts` imports `src/workshop/model.ts`, so an edit to `vocab.ts` changes which design `setRules` accepts, but `sourceId` stayed the same. Fix: `src/sim/identity.ts` adds `src/workshop` to `SRC_ROOTS`, as change 8 did for `src/match/worker.ts`.
5. **The `design` key re-keyed every stored run** (16b.3, should-fix): confirmed. `stampOf` hashed `design: null`, so the `rulesKey` of a run with the default rules changed, against the file's rule "keys added later count only when set". Fix: `src/sim/run.ts` deletes `design` from the key when it is null.
6. **`designHits` puts a king on an empty target** (16a.4, 16b.4 part 2, nit): refuted as a defect. This is change 5, on purpose: a design that cannot take a king does not make a king's step there unsafe. Other pieces give a larger answer on an empty square (they skip `canCapture`); that is safe for legality, and the threat marks are ticket 17's work. No change.
7. **A test assertion that cannot fail** (16a.5, 16b.4, nit): confirmed (`designs` went up once in each pass, so `toBe(400)` was always true). Fix: the test counts the random designs that have a "cannot be taken" rule with a When, and expects more than 0.
8. **The balance check threw on a malformed design** (16a.6, 16b.5, nit): confirmed by the code: `limit({})` reads `rules.length` of undefined. Fix: `src/balance/versions.ts` first asks that `squares`, `lines` and `rules` are arrays. Not done: the history Whens in that check (more than one line; `setRules` refuses them before a run).
9. **The Try board reads `RULES.design`'s "always" rules** (16a.7, 16b.6, latent): refuted for now. The browser main thread never calls `setRules`, so `RULES.design` is null where the Try board runs. Ticket 17 must solve this when a page plays a design.
10. **The main-thread search fallback does not set `VAL[T]`** (16a.8, latent): refuted for now, for the same reason: with no worker, the main thread plays with its own `RULES`, where the design is null. Ticket 17 must set the rules and the worth there too. Change 10 now names `src/game.ts` beside `src/sim/game.ts`.

Evidence after the fixes (the logs are outside Git, in `/tmp`):

- `npm test` through the shared lock (`/tmp/pg16r-test1.log`): exit 0; 117 test files pass (1 skipped), 1,903 tests pass (21 skipped); the node tests, 50 of 50.
- `npm run balance:check` (`/tmp/pg16r-balance.log`): 98 rule axes, 0 errors.
- `npm run check:browser plugin-ui` and `plugin-ui-http` (with the local test database): both pass (`/tmp/pg16r-checks.log`).
- One process error: before the fixes, the agent ran `src/rules/design.test.ts` once with bare vitest to see the two new tests fail. The rule permits only the lock script. The final run above used the lock script.
