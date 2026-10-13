# Saved studies

Use a saved study to inspect and test one position with fixed rules. A constructed
study starts at a stated position. It does not prove that a game can reach that
position. A test result does not show piece value, balance, or fun.

Run each command in a new process. This keeps one study's rules separate from the
next study's rules.

## Examples and checks

Create the examples in a new folder:

```sh
npm run study -- examples --out /tmp/kingdown-studies
npm run study -- inspect /tmp/kingdown-studies/EXAMPLE.json
npm run study -- check /tmp/kingdown-studies/EXAMPLE.json
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
