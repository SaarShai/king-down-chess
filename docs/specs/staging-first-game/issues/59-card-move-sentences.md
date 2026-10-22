# Name each released card in the move sentence

Status: complete on branch `staging/lane-cardtext`; review fixes done; merge open. Parent: U09. Branch from `73387e66`.

## What

`describeMove` (`src/move-text.ts`) gives one sentence for a move. The screen-reader announcement, the move list, the end card, Home and the ChatGPT move-chooser buttons show it. Make it name the card for each of the 21 released cards (`RELEASED_CARDS`).

## Why

Card games are a released mode. Before this change, 12 of the 21 card moves read as a plain piece move, or as broken text. A player who uses a screen reader, or chooses a move from the ChatGPT buttons, cannot tell that the move plays a card.

Sentences at `73387e66`, from a real legal move of each card (a probe script outside the repository, card mode with the card in White's hand):

| Card | Move | Sentence before |
|---|---|---|
| March | `a3-a5!M` | White pawn a3 to a5. |
| Leap | `Ra1-a3!L` | White rook a1 to a3. |
| Vault | `Ra1-f1!V` | White rook a1 to f1. |
| Mimic | `Nb1-a1!X` | White knight b1 to a1. |
| Control | `Nb1-a1!O` | White knight b1 to a1. |
| Burn | `Nd1xd4!N` | White knight d1 to d4, taking the pawn on d4. |
| Fire Starter | `Nd1xd8!T` | White knight d1 to d8, taking the rook on d8. |
| Curse | `!C:d5-e5` | White knight d5 to e5. (The knight is Black's.) |
| Sky Lift | `!K:b1<>c1` | White knight on b1 swaps places with the bishop on c1. |
| Earth Quake | `!Q:c4` | `White  c4 to c4.` (no piece name) |
| Salvation | `Q@a1!R` | `White  a1 to a1.` (no piece name) |
| Mirror | `!F:d5!Z` | White freezes the black knight on d5. (no Mirror) |

Freeze, Ice Wall, Strike, Flight, Sacrifice, Firewall and Morph already named the card (Freeze, Flight, Sacrifice and Morph by their verb). Haste and Rally named the card only when `final` is false; the end card (`final` true) did not name them. See Review fixes.

## Scope

`src/move-text.ts` and `src/move-text.test.ts` only. No engine, card, UI or plugin file changes.

Decisions:
- A card that moves one piece in its own way (March, Leap, Vault, Mimic, Control, Burn, Fire Starter) keeps the piece sentence and adds `with <card>`, as Strike already did. One set, `WITH_CARD`, now holds Strike and these seven.
- A card that moves no piece of the mover's own, or two pieces, says `<side> uses <card> to …`, as Firewall already did: Curse, Sky Lift, Salvation and Earth Quake.
- Earth Quake names each pushed piece when it pushes one or two. For three or more it gives the count, so the chooser button stays short.
- A Mirror move puts `With Mirror, ` before the copied card's sentence, so every copied sentence stays as it is.
- Card names come from `cardName` (`src/powers-ui.ts`, which reads `src/content/cards.ts`). MirrorB reads as Mirror and MorphP as Morph.
- The Earth Quake branch also serves Earth Quake B (lab card, same move shape); its text was broken in the same way. Other lab tags (MorphS, Rage, RageB, FirewallB, Growth, Rescue) keep their sentences: `src/rules/morph-soft.test.ts` pins the MorphS swap sentence and passes unchanged.

Not in scope, seen during the work:
- `shortMove` writes `White Earth Quake ·  c4` (two spaces, no piece name) for an Earth Quake. A follow-up can fix it in the same file.
- A waiting-guard drop with no card (`guardReserve`) still reads `White  a1 to a1.`.

## Acceptance

- One test case per released card (all 21 in `RELEASED_CARDS`) asserts the exact sentence of a real legal move, and that it names the card (its display name, or for the four unchanged king-power sentences their verb). A guard test fails when a released card has no case.
- Existing expected strings stay unchanged.
- The match `worker.mjs` bytes do not change.

## Result

After the change, each card names itself:

| Card | Sentence after |
|---|---|
| March | White pawn a3 to a5 with March. |
| Leap | White rook a1 to a3 with Leap. |
| Vault | White rook a1 to a3 with Vault. |
| Mimic | White knight b1 to b5 with Mimic. |
| Control | White knight b1 to b5 with Control. |
| Burn | White knight d1 to d4, taking the pawn on d4 with Burn. |
| Fire Starter | White knight d1 to d8, taking the rook on d8 with Fire Starter. |
| Curse | White uses Curse to move the black knight on d5 to e5. |
| Sky Lift | White uses Sky Lift to swap the knight on b1 and the bishop on c1. |
| Earth Quake | White uses Earth Quake on c4 and pushes the black pawn on d5 to e6. |
| Salvation | White uses Salvation to bring back a queen on d1. |
| Mirror | With Mirror, White freezes the black knight on d5. |

Checks:
- `KINGDOWN_TEST_FILE=src/move-text.test.ts npm test`: `Test Files  1 passed (1)`, `Tests  51 passed (51)`.
- Other tests that pin move text, each with `KINGDOWN_TEST_FILE`: `src/read.test.ts` `Tests  73 passed (73)`; `src/presentation-ownership.test.ts` `Tests  4 passed (4)`; `src/rules/spawn.test.ts` `Tests  19 passed (19)`; `src/rules/classic-chess.test.ts` `Tests  26 passed (26)`; `src/rules/morph.test.ts` `Tests  14 passed (14)`; `src/rules/morph-soft.test.ts` `Tests  18 passed (18)`; `src/previously.test.ts` `Tests  43 passed (43)`; `src/plugin/screens/board-model.test.ts` `Tests  50 passed (50)`; `tools/plugin-board.test.ts` `Tests  196 passed (196)`. No expected string changed.
- `npm run typecheck`: `tsc --noEmit`, exit 0.
- `npm run test:docs`: `Test Files  13 passed (13)`, `Tests  161 passed (161)`.
- Engine bytes: `npm run plugin:build:runtime` at `73387e66` and after the change. All 14 emitted `.mjs` files have the same sha256. `worker.mjs` is `677b4eeaa35113f0cf2b677f1e3650ae512de72485f0ce2c6617383c3af83f0b` both times; `index.mjs` and `search-worker.mjs` also do not change. `move-text.ts` is UI code and is not in the runtime.
- `npm run check:browser turn powers special-moves`: `ok   powers`; `ok   special-moves` (on the second run; the first run reported `changed in the checkout: src/move-text.test.ts, src/move-text.ts` because I committed during it); `FAIL turn  locator.click: Timeout 30000ms exceeded.` (waits for `.player-strip.is-turn .coin`).
- `npm run check:browser plugin-ui`: `FAIL plugin-ui  locator.click: Timeout 10000ms exceeded.` (waits for the `Use` button of the Earth Quake card sheet in `checkAndroidFixes`).
- Baseline: in a clean worktree at `73387e66` (`tools/wt.sh add baseline/lane-cardtext-73387e66 73387e66`, removed after), `npm run check:browser turn plugin-ui` fails the same two ways: `FAIL turn  locator.click: Timeout 30000ms exceeded.` and `FAIL plugin-ui  locator.click: Timeout 10000ms exceeded.`, with the same waiting locators. These two failures come before this change; this ticket does not fix them.
- Full `npm test` with `PLUGIN_TEST_DATABASE_URL` set: `Test Files  5 failed | 249 passed (254)`, `Tests  12 failed | 4652 passed | 8 skipped (4672)`. All 12 failures are in plugin UI files (`tools/plugin-app`, `plugin-lobby`, `plugin-profile`, `plugin-real-host`, `plugin-screen-lifecycle`), and 11 of them are timeouts or wait-for-tick checks. None reads move text.
- Those five files again, with `KINGDOWN_TEST_FILE='tools/plugin-{app,lobby,profile,real-host,screen-lifecycle}.test.ts'`, on this branch (`84d77baa`) and in the baseline worktree (`73387e66`): both give `Test Files  4 failed | 1 passed (5)`, `Tests  11 failed | 208 passed (219)`, with the same 11 case names. These failures come before this change. The `plugin-real-host` case ("says it cannot connect after three failed polls offline…") fails only in the full run and passes on both reruns, so it is unstable under load.

## Review fixes

A three-lens review found no blocker and four nits. Fixes:

1. Earth Quake: each pushed piece now carries its colour, in the form Curse, Freeze and Ice Wall use (`the white pawn on c5`). Probe `4k3/8/8/2PpP3/8/8/8/4K3 w - - 0 1`, `!Q:c4`: `White uses Earth Quake on c4 and pushes the white pawn on c5 to c6 and the black pawn on d5 to e6.` The Earth Quake case now expects `the black pawn on d5`. A new test pushes pieces of both colours.
2. End card: with `final` true, Haste and Rally now add ` with Haste` or ` with Rally` (`White rook a1 to a5 with Haste.`). The `may move again` text stays for `final` false. The existing final test now expects the card name. No other expected string changed.
3. Salvation, Curse and Sky Lift take their names from `cardName(TAG_POWER[m.power])`, as the other branches do. Haste and Rally do the same.
4. This ticket: status line, the Haste and Rally line in Why, and the Earth Quake row in Result are corrected.

Checks after the fixes:
- `KINGDOWN_TEST_FILE=src/move-text.test.ts npm test`: `Test Files  1 passed (1)`, `Tests  52 passed (52)`.
- Other readers (`src/read`, `src/presentation-ownership`, `src/previously`, `src/rules/{spawn,classic-chess,morph,morph-soft}`, `src/plugin/screens/board-model`, `src/screen/moments`, `tools/plugin-board`): `Test Files  10 passed (10)`, `Tests  454 passed (454)`.
- `npm run typecheck`: exit 0. `npm run test:docs`: `Test Files  13 passed (13)`, `Tests  161 passed (161)`.
- `npm run plugin:build:runtime`: `worker.mjs` sha256 `677b4eeaa35113f0cf2b677f1e3650ae512de72485f0ce2c6617383c3af83f0b`, unchanged.
