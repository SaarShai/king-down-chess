# Saved studies

Use a saved study to inspect and test one position with fixed rules. A constructed
study starts at a stated position. It does not prove that a game can reach that
position. A test result does not show piece value, balance, or fun.

## Browser controls

Open **Menu → Extra → Workshop → More → Studies**. The first study is the Rook
control at its starting position. The Study board uses the full game engine.
It does not change the Workshop Try board or the active game.

- Select a marked square to play. Use **Legal actions** for complete actions,
  including cards, powers and end turn. Arrow keys and Enter also select squares.
- **Undo** removes the last action. Remove checks at that action first. A test
  keeps at least one check; add its replacement before removing the last check.
- **Test** adds a legal or refused action at the current position. **Run checks**
  runs all declared facts. **Results** shows pass/fail, coverage and state changes.
- **Save study** sets the title and question. It saves on this device. An edit
  creates a new version. Saving unchanged content keeps the current version.
- **More → Open study** shows saved versions and five worked examples. A current
  draft is saved before another study opens. A save failure leaves that draft open.
- **More → New study** puts the selected Workshop piece in a constructed board.
  Import a file to set a different board, cards, powers or game rules.
- **More → Import file** validates the full document before it replaces the open
  study. **Export copy** downloads JSON. A draft export has a new ID; a saved
  export retains its ID and version. Export still works if local saving fails.

Keep exported copies. Browser storage holds up to 50 versions and can be cleared
by the browser. Bad stored data is kept and reported. A source mismatch is refused.
A browser worker keeps study execution separate from the active game's rules.

## Command line

Run each command in a new process. This keeps one study's rules separate from the
next study's rules.

## Examples and checks

Create the examples in a new folder:

```sh
npm run study -- examples --out /tmp/kingdown-studies
npm run study -- inspect /tmp/kingdown-studies/rook-control.json
npm run study -- check /tmp/kingdown-studies/rook-control.json
```

Replace `EXAMPLE.json` with a file from the folder. Inspect shows the saved study,
position, status, history, and legal LAN actions. Check reads one test file. Its
report says `passed`, `failed`, or `invalid`. Failed and invalid reports return a
nonzero exit code.

## Play, save, and undo

Use a plain `kingdown-study/1` file for edits. Inspect accepts a plain study or a
`kingdown-test/1` test file. Play and undo refuse a test file: its checks can refer
to action numbers, so an edit can change their meaning. To start a separate plain
study, extract its study object to a new file. Keep the test file. Extract keeps
the study version because it does not change its actions.

```sh
npm run study -- extract /tmp/kingdown-studies/EXAMPLE.json --out /tmp/study.json
npm run study -- inspect /tmp/study.json
npm run study -- play /tmp/study.json LAN --out /tmp/study-2.json
npm run study -- undo /tmp/study-2.json --out /tmp/study-3.json
```

Replace `LAN` with a legal action from inspect. Each save adds one to `version`
and sets `parentVersion` to the input version. Undo removes the last recorded
action. It refuses when there is no action to remove. It does not remove the
saved game prefix.

Output paths must be new. No command overwrites a file. The examples folder must
also be new. Input files must be regular files no larger than 1 MiB. Bad input,
unknown commands, illegal actions, and file errors return a nonzero exit code.

## Source match

The study stores a SHA-256 source fingerprint. It covers the rules, AI, game,
design model, study code, their local imports, and dependency lock file. Tests
and examples do not change the fingerprint. The source root comes from the
script path, so a different current folder does not change the result.

Inspect, play, undo, and check refuse a source mismatch. Keep the matching source
with a saved study. Do not replace its fingerprint to make an old study pass.

## Write an interaction test

Copy an example to a new file. Set its title and question. Keep the complete
rules and design code. The `start` object stores all position fields; FEN is a
display format only. `prefix` is the legal line from that start to the scenario.
`actions` is the line under test. Every action must match one legal LAN action.
An illegal or terminal action makes the whole test invalid.

Each check has a unique `id`, a short `label`, an action index `after`, and an
expected fact. Index 0 is the scenario after the prefix. Index 1 is after the
first test action. Use these four kinds:

| Kind | Fields | Expected fact |
|---|---|---|
| `legal` | `lan`, `expected` | The action is present or absent in the legal set |
| `piece` | `square`, `expected` | The square holds this exact engine byte, including side and spent flag |
| `state` | `field`, `expected` | The position field equals the JSON value; `null` means absent |
| `status` | `expected` | The game has this engine status |

Squares run from a1 = 0 to h8 = 63. For example:

```json
{"id":"blocked","label":"The pawn blocks the line","after":0,"kind":"legal","lan":"Td4-g4","expected":false}
```

The parser refuses empty checks, duplicate IDs, unknown fields and checks past
the last action. Coverage cells name their items and reason. A `tested` cell
must name checks from this file. Its report shows passed or failed. `unsupported`
and `untested` cells contain no check IDs and retain those states in the report.
A passing report covers only its declared checks.

The trace contains observed state changes for each legal action. It does not
claim which rule causes each change. It is separate from the Workshop's rule
influence view. A square or reserve count is not an entity ID.

A challenge stores a goal, action horizon and alternate solution lines.
Each line starts at the scenario and must be legal within the horizon. The
runner checks legality; it does not prove the goal, force or uniqueness. The
claim stays `suggested`, and difficulty stays `unmeasured`.

## Select the next case

Use shared state to choose interactions. These first cases are small controls.

| Item | Reads | Changes | Existing case |
|---|---|---|---|
| My Rook | Occupancy, side, king safety | Occupancy, captured state | `rook-control` |
| Haste | Legal moves, spent cards | Side to act, extra-action square, spent cards | `rook-haste` |
| Frost Freeze | Enemy targets, spent power | Mark and power count | `rook-power` |
| Free and two-turn marks | Both marks, side to act | Mark duration and free action | `marks-and-haste` |
| Second player's first turn | Action count | Side to act, move count | `second-player-turn` |

Add the reverse action order when it changes a shared field. Keep a refusal
case and a boundary case beside a positive case. The attack parity control
compares legal moves, generated attacks, and attack lookup on enemy or empty
squares. Friendly-square defense lookup has no shared contract.

## Current support

| Operation | Support |
|---|---|
| Save, inspect, legal play, undo, reload | Browser controls and local JSON files |
| Existing piece design | One design slot; the engine's three-rule limit |
| Existing cards, powers and rule settings | Full rules, within the engine's supported combinations |
| New behavior | Add engine support and tests first; files cannot define executable effects |
| Full game origin | Refused in version 1; all current studies are constructed |
| Event cycles or unknown rule language | Refused as unknown input; no event interpreter is present |
| Entity IDs and causal events | Unsupported; exact state and legal action traces are present |
| Browser assertion editing | Legal/refused action checks; import files for piece, state and status checks |
| Balance, strategy strength, human enjoyment | Untested by this first layer |

Study IDs and version numbers label saved records. Keep one version chain per ID;
use a new ID for a separate design question. The browser library is local to one
device. There is no shared study registry.
