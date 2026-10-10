# 02 · `render-compare.mjs --against <revision>`, and the stale selectors of samples 00 and 01

Status: in-review (branch `claude/retro-tools`)

## Scope

- `docs/specs/web-ux/render-compare.mjs` gets a second form, `--against <revision> [--samples …] [--out …] [--threshold n]`: it builds the revision in a scratch worktree outside the checkout and this checkout in place, serves both builds, renders each sample three times (the revision, this checkout, the revision again), and prints only the stable changes (a differing render in a state that is the same in the two renders of the revision), the unstable renders, and each fault of this checkout's build. Exit 1 on a stable change or a fault of this checkout's build.
- The two-folder form stays as it is.
- Samples 00 and 01: the `controls` selector `#panel .menu button, #panel .actions button` matched nothing since the redesign, so every render of both samples had a fault. It becomes `#menu-btn, #undo, #end-turn`; sample 00's settings state uses `#menu-back, #menu-close`.
- `samples/README.md` and spec §4.4 of the after-redesign spec name the new form.

## Done when

- [x] `--against main --samples 00,01` on this branch: 36 pairs, 0 stable changes, 0 unstable, 0 faults, exit 0 (sample 00 had 20 faults of 20 renders before the selector fix).
- [ ] `--against main` with every sample on this branch (docs and tools only, so the two builds have the same `src/`): 0 stable changes, 0 faults; the unstable states match the lists of tickets 02 to 04 of the after-redesign spec.
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
