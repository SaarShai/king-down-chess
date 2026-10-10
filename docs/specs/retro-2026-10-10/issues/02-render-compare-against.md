# 02 · `render-compare.mjs --against <revision>`, and the stale selectors of samples 00 and 01

Status: in-review (branch `claude/retro-tools`)

## Scope

- `docs/specs/web-ux/render-compare.mjs` gets a second form, `--against <revision> [--samples …] [--out …] [--threshold n]`: it builds the revision in a scratch worktree outside the checkout and this checkout in place, serves both builds, renders each sample three times (the revision, this checkout, the revision again), and prints only the stable changes (a differing render in a state that is the same in the two renders of the revision), the unstable renders, and each fault of this checkout's build. Exit 1 on a stable change or a fault of this checkout's build.
- The two-folder form keeps its output and exit codes, except that a folder that does not exist now exits 2 with a message (main threw a stack trace).
- Samples 00 and 01: the `controls` selector `#panel .menu button, #panel .actions button` matched nothing since the redesign, so every render that used it had a fault (20 of 20 in sample 00). It becomes `#menu-btn, #undo, #end-turn`; sample 00's settings state uses `#menu-back, #menu-close`.
- `samples/README.md` and spec §4.4 of the after-redesign spec name the new form.

## Done when

- [x] `--against main --samples 00,01` on this branch: 36 pairs, 0 stable changes, 0 unstable, 0 faults, exit 0 (sample 00 had 20 faults of 20 renders before the selector fix).
- [ ] `--against main` with every sample on this branch (docs and tools only, so the two builds have the same `src/`): 0 stable changes, 0 faults, 0 not compared; every unstable state is in the lists of tickets 02 to 04 of the after-redesign spec, or is named here with its pixel count.
- [ ] A review by a reader that did not write the diff; its findings fixed and recorded here.

## Comments

- 2026-10-10, branch `claude/retro-tools` on main 10fa1bc8. The first run of the new form stopped on a `ReferenceError`: two `const` helpers stood below the top-level `await`, so a hoisted function read them before their line ran. They now stand above the dispatch.
- **Review 1** (GPT via Codex, read-only, run inside the worktree with `-C`, so it read the neighbours itself): merge after fixes; six should-fix items, two notes; no fault in `push-main.sh`. What changed:
  - A capture that cannot start left the promise open and the cleanup unreached; a SIGINT left the capture child running. Now the child's `error` event ends the capture with exit 1 and a log line, and the cleanup kills a running child.
  - A reused `--out` folder passed off stale renders and a stale report; a non-zero capture exit with a report of no faults went unseen. Now each capture gets a fresh folder, and such an exit counts as a fault.
  - The second render of the revision gave only its pixel differences: a missing render or a fault in that pass did not mark the state unstable. Now a state is unstable when the two renders of the revision differ, one lacks it, or their faults differ.
  - The two-folder form passed two folders that do not exist with "0 pairs" (main threw). Now it exits 2 and names the folder.
  - `--out` equal to the checkout (or a symbolic link to it) passed the guard. Now the shared `isInside` of `tools/lib/checks.mjs` decides, on real paths.
  - The README and spec §4.4 said "the whole proof"; the command is the render part (the build compare stays a separate step). The retro spec's status said done while ticket 01 waits for the merge.
  - Declined: a fault on the revision only stays a change. A check result that differs between the two builds (a control outside the screen, a page error) is a difference the proof must show, even with the same pixels.
- **Review 2** (a three-lens panel, each should-fix checked by a second reader): merge after fixes in every lens. Confirmed and changed:
  - Two renders of the revision do not catch every unstable state: the after-redesign tickets record states that flip between two looks at random (00 `move-laptop`, two pixels), so a run could print a CHANGE there with no code change (about one run in four for such a state). Now a candidate change gets one more render of each build, and it stays a change only when each build is the same in that state (about one run in sixteen for such a state; the header says a CHANGE in a state the tickets name deserves one more run).
  - A pass with no `report.json` (a crash, a stop) marked the states it did not reach as unstable, so the run could exit 0 without a comparison of them. Now such a sample is NOT COMPARED, named with its log, and fails the run. Each capture has a time limit of 15 minutes.
  - The build of this checkout wrote `dist/` in place, with no run lock, while a check run in the same worktree may serve it. Now it builds into `<out>/dist-tree` and serves that folder; `dist/` stays as it is.
  - Only SIGINT ran the cleanup; a SIGTERM or SIGHUP (the usual stops of a detached run) left the scratch worktree, and vite's own listener calls `process.exit()`, which skips a `finally`. Now the synchronous cleanup runs on `exit`, and SIGINT, SIGTERM and SIGHUP exit with 130, 143 and 129, as `tools/check.mjs` does.
  - The `capture` fault text held the log path of its pass, so the same failure never matched between passes. The texts hold no path now; the log path prints on the line.
  - The README example wrote `compare.log` into the checkout, which fails every check of a check run there (the runner hashes the untracked files). The example writes outside the checkout, and the tool writes `<out>/compare.log` itself.
  - The header said "the whole proof" where the README and the spec say the render part.
  - Notes taken: the build starts with `process.execPath` and the vite script (no PATH); `build.error` goes to the build log; a threshold that is not a number of 0 or more, or an empty `--samples`, exits 2; the `--out` guard runs before the folder is made; the header names exit 2 and that every pass uses this checkout's `capture.mjs` and tables; this record's wording (above).
  - Declined: a tree fault in an unstable state still fails the run (the header says every fault of this checkout's build does); sample 00's three ids can hide one stale id (a note for the sample format, not this ticket).
