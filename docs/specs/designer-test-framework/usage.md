# Studies, plans and evidence

Use a saved study to inspect and test one position with fixed rules. A constructed
study starts at a stated position. It does not prove that a game can reach that
position. An interaction test checks the declared behavior at that position.
A measurement plan fixes the population and search settings before games run.
Linked evidence retains the original measurement, uncertainty and source.
These are separate answers. A passing interaction test does not show balance or fun.

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
- **Results → Plan a measurement** chooses worth, activity, a power field,
  two-factor interaction or power cross-play. Set the army pool, pairs and search
  depth. **More settings** sets the seed, game cap and opening settings.
  **Preview plan** shows the exact game count, settings and support limits.
  **Save plan** adds it to the saved study. It starts no games. Time and money
  have no measured estimate. A changed setting needs a new preview.
- **Results → Link results** opens a local balance JSON export of up to 64 MiB.
  Choose a run, optionally filter by exact element name, and select measurements.
  Use the page buttons to reach other runs and rows. Selections stay across pages;
  the limit is 500. **Link measurements** saves them with the study. Original
  context, validity, intervals and file hashes stay attached. The file stays on
  this device. Cancel or a failed import changes no saved record.
- **Results** shows the saved measurement plan and linked balance evidence.
  Open a measurement to read its run, method, original rules and source hash.
  A changed study or check makes its plan stale. Old measurements remain visible.

Keep exported copies. Browser storage holds up to 50 versions and can be cleared
by the browser. Bad stored data is kept and reported. A source mismatch is refused.
A browser worker keeps study execution separate from the active game's rules.

## Run a saved plan

The local studio connects the browser to M1 and Kaggle. The existing development
server includes it. For the built app, start it once with `npm run build`, then
`npm run study:serve`. Open `http://127.0.0.1:4174`. Keep the service and results
card available while runs finish. Browser storage belongs to its address; use
export/import to move a saved study from a different address.

In **Results**, choose **Run saved plan**. Choose M1, Kaggle, or both, then
**Prepare saved plan**. Preparation freezes the source, exact settings and full
work assignment. It needs a clean source commit and a current saved plan.
Read the game count, machine split, depth, pool, seed and time limit. Only
**Approve and start** starts that exact run. A saved file is not run approval.
Each new run needs this action. Real machine transport remains **unverified**
until a separately approved live proof passes.

The service records the approval before it sends work. Closing the page does
not stop it. **Refresh stored status** reads the last saved observation. It does
not poll a worker or repeat a launch. The page shows each machine's next check
and deadline. An unknown game count stays unknown. An uncertain launch needs
inspection; there is no automatic launch retry.

When results return, **Review results** checks the file hash and opens the normal
measurement picker. Select rows and **Link measurements** to save a new study
version. **Open run's original study** recovers the exact study the run measured.
Old results do not become evidence for changed rules. Collection, validation and
backup have separate states. A backup error keeps checked local results intact.
A complete measurement run does not approve a rule or establish that it is fun.

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

## Connect balance measurements

Prepare plans from an exported study or interaction test. The command preserves
all checks and the saved study. It writes a `kingdown-research/1` file that the
browser can import through **More → Import file**.

For the Rook example, use the included activity request:

```sh
npm run study -- plan /tmp/kingdown-studies/rook-control.json docs/specs/designer-test-framework/sample/activity-request.json --out /tmp/rook-plan.json
npm run study -- preview /tmp/rook-plan.json --out /tmp/rook-jobs.json
```

Plan reports game and block counts, seed, depth, policy and limits. Preview writes
the exact jobs for review. Both commands launch zero games. Preview regenerates
the plan and refuses changed source, settings, metadata or study content. A run
still needs the owner's go and the existing launcher checks. A preview file is
not a launch authorization.

| Recipe | Comparison | Current limit |
|---|---|---|
| `worth` | Piece swaps with pawn calibration | Set distinct `pieces`; optional `vs` is N, B, R or Q |
| `activity` | Participation under the saved rules | Uses new armies from `pool` |
| `field` | Named king powers against each other | Set distinct `entrants`, including `none` if needed |
| `cross-play` | The same power schedule with both colors | Named powers only; no arbitrary strategy plug-in |
| `four-cell` | Two named piece or card factors, alone and together | No custom T, plain kings, fixed supported search policy |

Every request states `start: "population"`, `seed`, `pairs`, `depth` and `pool`.
The pool has at least seven piece letters. T needs the study's saved design.
Recipes refuse unknown fields, missing inputs, duplicate entrants or pieces and
more than 10,000 preview games. A saved-state population start is unsupported:
existing jobs cannot preserve all board history. Use interaction tests for that
exact position. Plan files stay within the study's 1 MiB limit. Large job previews
have a separate 32 MiB limit.

Link rows from the existing balance dataset by exact run and optional element:

```sh
npm run study -- evidence /tmp/rook-plan.json docs/balance/measurements.json --run ab-2021.var --element run --out /tmp/rook-evidence.json
npm run study -- check /tmp/rook-evidence.json
```

This example links three historical run measurements. It does not measure the
new Rook. Import `/tmp/rook-evidence.json` in Studies, save it, then open Results.
The plan stays separate from the declared checks. A measurement retains its
value, interval or error, sample unit, validity, reasons, method and full context.
The export records a SHA-256 hash of the exact dataset bytes. No match, duplicate
measurement ID, malformed row or oversize file produces an output. Input datasets
can be at most 64 MiB; select at most 500 rows per link and 20 links per document.

Plan status in Results compares the saved study and checks. Open **Plan a
measurement** to verify an imported plan against the shared planner and current
source. Its counts and contexts stay unverified until that preview or the
command-line preview passes. The browser can compare imported context keys, but
cannot certify that a result answers this plan. An old source or different settings makes evidence
historical. Even matching context keys still need result review.

The browser does not audit raw games, certify complete coverage or adopt a
design. Use the balance campaign validator for raw hashes, schedules and legal
replay. Missing data stays missing. After a study or check changes, create a new
plan. The old plan and evidence stay attached for inspection. Save version
numbers alone do not make a plan stale. The original plan snapshot and
fingerprint stay intact when only the save version changes.
Plain study edits preserve attached evidence. Command-line edits to a test still
require `extract` to protect its indexed checks.

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
| Balance measurements | Plan five supported recipes; link existing measurements with their original context |
| Strategy strength | Named power comparisons; arbitrary policies and proof of best play are unsupported |
| Human enjoyment | Unmeasured; requires observed playtests |

Study IDs and version numbers label saved records. Keep one version chain per ID;
use a new ID for a separate design question. The browser library is local to one
device. There is no shared study registry.
