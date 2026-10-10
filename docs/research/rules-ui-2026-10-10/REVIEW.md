# Review: the Codex rules framework and its visualization (2026-10-10)

Scope: Codex session `01a12161` (2026-10-09 15:57 to 2026-10-10 12:39 UTC), branch `codex/balance-framework` (worktree `.claude/worktrees/balance-framework`), and the concepts in `sim/out/rules-playground-20261010/`.
Method: six review and research agents, a panel of five design directions with three judges, and two mockups with an art and a UX critique each. Raw results are in this folder.

## 1. Verdict

| Part | Verdict |
|---|---|
| Balance framework | Careful and honest work, with real evidence. It is a **balance ledger**, not a rules framework. It is too heavy. |
| Rules framework (beyond balance) | **Not built.** The session wrote a spec and a glossary. It did not write types, code or an engine link. |
| Visualization | **Weak.** It has good interaction ideas, but it uses a generic look and ignores your art and your own move legend. It shows only one rook. |
| Runs | Solid. 10,000 worth games and 12,000 activity games are done and checked. The powers and four-card runs continue on Kaggle. |

## 2. The framework

### What it is
- A typed catalog of design points (`src/balance/schema.ts`: 27 dimension families, 97 engine-flag axes).
- Band and gate checks (`criteria.ts`) and a small interpolation model (`effects.ts`).
- A large provenance pipeline: `measurements.json` is 36 MB, `status.json` is 2 MB, `coverage.md` is 0.96 MB, and `FRAMEWORK.md` is 185 KB.

### What is good (keep)
- Honest uncertainty. A pass needs the full interval inside the band. The models do not extrapolate.
- One typed index of all engine flags.
- `CONTEXT.md` separates state, event, effect, action, ruleset, scenario and version. This is the correct base for a rule model.
- The playground spec has correct principles. Keep "while" (state) apart from "after" (event). Inspecting never changes the board. The first edit makes a private copy. The engine is the one authority. Conflicts stay visible.

### Problems
1. **High: it cannot execute rules.** Nothing in `src/rules` or `src/workshop` imports it. A piece is one movement label (`step1`, `rook`) plus flags. It cannot hold a painted pattern.
2. **High: conditions are not bound to effects.** The balance schema keeps one condition list for each element. The Workshop model already binds one When to one Does (`src/workshop/model.ts`). That is the correct unit.
3. **High: there are too many vocabularies.** The repo has four rule languages with no shared ids: MATRIX rows, engine flags, Workshop blocks and balance dimensions. The spec proposes a fifth (`src/rule-design/`). The concept HTML adds a sixth move interpreter.
4. **High: custom pieces cannot play.** The engine has one hand-coded case for each piece type. Workshop "Try it" has no check test, and the other side never moves. The spec does not plan the one step that matters: a generic "designed piece" case in the engine.
5. **High: too much process.** SHA pins on document sections, hand copies of engine types, and committed generated data add friction to every rule edit.
6. **Medium:** the schema copies engine choices by hand and drifts already (`shotPattern 'over23'`). The spec has no data model. The demo needs "slides up to N squares", which does not exist in the model or the engine.

### Recommended direction
- Rename the work to **balance ledger**. Keep `criteria.ts` and `effects.ts`. Move generated data out of git. Derive axes from `rules.ts`.
- Make the **Workshop rule (When + Does) the one rule unit**, and make `vocab.ts` the one catalog. The matrix view, the balance ledger and the UI read it by stable id.
- Add **one engine case for a designed piece** (`genPiece`, `canCapture`). This turns the Workshop into a playground.
- Add a **why-trace**: version 1 runs the move code again with each rule removed and compares the squares.
- Show powers and cards as data (targets, cost, uses, duration, condition) from MATRIX C.1. Do not make a second rule language for them.
- Show board, setup, turn and victory rules as a read-only outline first. Make a part editable only when the engine reads it as data.

## 3. The visualization

### Keep
- Edit by sentences with inline values (this matches the Workshop pills).
- Inspect and try are separate steps.
- "Why?" names the rule that decides.
- A live status shows whether a conditional rule is on now.
- Compare against the original in the same position.
- Start from a familiar piece. The first edit makes a private copy.

### Problems
1. **High: off-brand.** It has system fonts, a sage-green palette, a flat board and Unicode pieces. It does not use parchment, Cinzel, the stone board or the painted figures.
2. **High: a third mark language.** It uses hollow circles and red double rings. These conflict with the game's Workshop marks and with your physical legend (green tile = move, red X = take).
3. **High: no combinations.** The board shows only the net result. Nothing links a mark to the rule that made it.
4. **High: no scale.** One rook preset is the whole concept. "Add a rule" opens two fixed toggles. Nothing is drawn for cards, powers or table rules.
5. **Medium:** it drops the pattern view (move-only and take-only squares). It hides things in disclosure triangles. It shows status as developer text. Conditions, triggers, limits and timing have no visual form.
6. **Process:** its "validation" checks layout and keyboard use only. It does not check whether the design is clear or good. The tickets say "resolved", but you did not approve them.

## 4. Session state and open items
- Branch `codex/balance-framework`: 12 commits on top of the merge base. One local commit (`a4ae81c2`) is not pushed. PR #30 is open. Main is 227 commits ahead.
- Uncommitted: balance data and the run log in the worktree; `CONTEXT.md` and `docs/specs/rules-playground/` (untracked); `docs/QUEUE.md` and `docs/DELEGATION.md` in the main checkout; the concepts in `sim/out/`.
- The Codex automation `orchestrate-target-balance-runs` is active (daily at 06:00 PT).
- **Security:** you pasted an Anthropic API key into the Codex chat. It is in plain text in the Codex session log. Rotate it.
- Decisions for you: merge PR #30, review the MATRIX.md diff, choose the rules-UI direction, choose the final deck.

## 5. Design panel

Five directions were scored 1 to 10 by an art director, a UX researcher and a systems engineer:

| Direction | Art | UX | Systems | Mean |
|---|---|---|---|---|
| Proving Ground (the board is the editor) | 8.5 | 8.5 | 7.5 | 8.2 |
| Binder and Table (every rule is a card or a seal) | 8.0 | 7.0 | 8.0 | 7.7 |
| War Table (diorama) | 8.0 | 7.5 | 7.0 | 7.5 |
| Tile Table (rules as snap tiles) | 6.0 | 7.0 | 8.0 | 7.0 |
| The Codex (illuminated rule book) | 7.0 | 6.5 | 6.5 | 6.7 |

All three judges chose the same pair: **Proving Ground** and **Binder and Table**. All three also chose **your physical legend** as the one mark language. Both mockups use one shared grammar. See `mockups/grammar.html`.

## 6. Mockups

Open the files in a browser. They are plain HTML with no build step. While `npm run dev` runs, they are also at `http://localhost:5173/docs/research/rules-ui-2026-10-10/mockups/<file>`. Add `?state=<id>` to jump to a state, or press **M** for a menu of states.

| File | What it is |
|---|---|
| `mockups/proving-ground.html` | **A. Proving Ground.** The stone board is the editor. One piece stands on d4. Its rules are wax seals with one sentence each. You paint tiles with three brushes (Move, Take, Both). Tap a square, and a "Why" tag adds up the rules that made the mark. The library is a ledge of figures with tabs: Pieces, Kings, Cards (LAB), Rules. |
| `mockups/binder-and-table.html` | **B. Binder and Table.** Every piece is a card in a binder. The card holds the art, a 7x7 diagram and up to three seals. Open a card, and a test table opens beside it. Kings are cards with two power coins. LAB cards are a hand. Table rules are cards with a switch. |
| `compare.html` | **A and B side by side:** four matched screens and an "At a glance" table. |
| `mockups/grammar.html` | **The shared visual framework.** A specimen sheet of every mark, seal, When chip, coin and status, with the scenes. |
| `screens/` | Key screenshots, and the rejected Codex concept for comparison. |

### The shared grammar (both mockups)
- **Your legend is the base:** a green tile means move, a red target means take, and a green tile with a red target means move or take. Shape carries the meaning, so the marks pass a colour-blind check.
- **A target with an arrow** means it takes from where it stands (shot). **A rail** is a slide. **An arch** means it passes over a piece.
- **A dashed frame** means "only sometimes". A moon means "asleep now".
- **Grey with a bar** means a rule refuses this target. Red never means failure.
- **One rule = one wax seal** (Does) plus one chip (When). A plate is a state ("while"). A flag is an event ("when it takes").
- **Each mark carries a small stamp** of the seal, coin or card that made it. Hover or tap a seal to see only its marks.
- **A gold knot** joins rules that work together. A cracked knot means one rule cancels another.
- Powers are the game's coins with use notches. Cards carry a LAB label.

### Recommendation
**A (Proving Ground).** It is the simplest form: one board holds the cause and the effect, so the player never maps a diagram onto a board. Take two parts of B into A: the binder grid as the "See all" page, and the card face as the thing that a player shares.

### What the framework must add for either UI
1. One rule unit (Workshop When + Does) and one catalog (`vocab.ts`), with stable ids.
2. A why-trace: run the move code again with each rule removed, and compare the squares.
3. Refused targets returned with the rule that refused them (for the grey barred marks).
4. A designed-piece case in the engine, so custom pieces play real games.
5. Power and card descriptors as data (targets, cost, uses, duration, condition).
6. Not in version 1: ranged lines ("up to N squares") and offsets beyond ±3.

Judges: the art and UX judges ranked A first (8.5 each). The systems judge ranked B a little higher (8 against 7.5), because B maps one to one to the code (seal = vocab block, 3 sockets = MAX_RULES). All three chose the same pair and the same legend.

### Decisions (owner, 2026-10-10)
- Direction: **A, Proving Ground.** Final (owner, 2026-10-10: "the final choice is A, so implement that"). Build plan: `docs/specs/workshop-proving-ground/`.
- A piece keeps **at most 3 rules**.
- **The owner's legend is the one mark language, in the game too, with a red target in place of the red X.** A shot is the target with an arrow. Ticket: `docs/specs/move-legend/issues/01-game-marks.md`.
- Card art: **Rescue** uses the hands art (`assets/cards/rescue.jpg`). **Salvation** uses the graveyard art (`assets/cards/salvation.jpg`, cropped from the Drive card).
