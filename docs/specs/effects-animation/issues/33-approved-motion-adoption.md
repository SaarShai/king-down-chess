# Adopt approved motion at live events

Status: in progress
Type: task

## Scope

Adopt the approved Freeze ending and banked interface object motion. Keep current art, rules, static marks, Ice Wall release, Holy Light release and original magic. Card refill and the seconds clock stay in previews. No deployment.

## Plan and checks

1. Compare HEAD with the approved source. Find real events and current lifecycle guards.
2. Use the current interface motion helper for live draw replies, opponent arrival, confirmed Ready and successful invite copy. Keep the existing Freeze and Firewall coin release.
3. Replace only the Freeze ending with the approved 620 ms patch retreat and grains. Keep state loss and unit guards.
4. Run focused tests with the shared lock. Run registered browser checks for event onset, no replay, reduced motion, cancellation, phone layout and board directions. Record evidence and limits.

## Baseline

- HEAD already has `castRelease` at the live unspent-to-spent event for Freeze and Firewall. Other cards have a spent settle. Event timestamps survive row rebuilds and clear on game changes. Keep this accepted code.
- `wait.ts` opens Opponent found only after a real waiting game joins. `seat.ts` reads confirmed Ready flags. `sendInvite` knows clipboard success. `board.ts` reads real draw offers.
- Freeze uses `.28 * 4800 = 1344` ms of residue. Current state code removes the active badge at loss and rejects absent or replaced unit codes.
- Read-only approval sources: tickets 16, 17 and 25, `preview/gui/{objects,arrivals}.js`, and `preview/comparisons/release/{STATUS.md,release.js}` in the effects integration worktree.

## Verification

Implementation is present. Runtime verification is blocked by shared locks. Do not mark this ticket done until the checks below pass.

- `npm run typecheck` passes.
- `git diff --check` passes. Both changed browser scripts pass `node --check`.
- The focused `npm test` command waits on the shared test lock. After the bounded wait, the queued process is stopped. A second attempt with `KINGDOWN_TEST_LOCK_WAIT=1` exits 75. No unit case runs.
- The focused interface browser test attempt also exits 75 at the shared test lock. No case runs.
- `npm run check:browser effects-states plugin-ui` waits for the browser slots. The slot record names a live exclusive check in another worktree. The queued runner is stopped with SIGINT before build or checks start. No browser pass or visual result is claimed.
- Approval source `preview/comparisons/release/release.js` matches the read-only source byte for byte. Production imports use no worktree path. Artwork, scene, board view, runtime selection, exporter and shared catalogs stay unchanged.

## Implemented hooks

- Coin spend: keep the current live spent-event path and accepted local Freeze/Firewall material release.
- Draw reply: a live server offer change starts one paper impression. Confirmed loss of an offer in a playing game gives the stone settle and a readable decline line. Accepted draws keep the current result path.
- Opponent found: a known waiting game joins while the computer board is open. Recovery and repeated notice opening stay quiet.
- Setup Ready: confirmed false-to-true flags stamp the corresponding portrait. Initial reads and screen reentry keep still seals. The setup-to-playing handoff stamps the final ready side once.
- Invite copy: only clipboard success starts tile sweeps and the copy receipt. Failure, Share, expiry, replacement and old screen callbacks do not start copy motion.
- Freeze release: use the approved patch retreat and grains for 620 ms, with the current Fast rate. A board guard rejects absent or replaced units. Ice Wall, Holy Light and other magic keep their current endings.

## Rerun after the locks clear

```sh
KINGDOWN_TEST_FILE='src/{ui/motion,plugin/invite,plugin/screens/lifecycle,render/effects/states,render/effects/board-effects}.test.ts' npm test
KINGDOWN_TEST_FILE='tools/plugin-motion.test.ts' KINGDOWN_TEST_NAME='adopts confirmed' npm test
npm run check:browser effects-states plugin-ui
```

The added checks cover Freeze duration, row order, unit guards, unchanged Ice Wall timing, ten exact approved material frames, a real king move that expires Freeze, confirmed copy/Ready/draw events, hidden cancellation, reduced motion, no replay, phone bounds and both board directions. These checks are added but not executed.

Evidence and the complete handoff are outside the repo at `/Users/za/Documents/king down chess (new)/app/.codex-runs/review-85/adoption/`. No shared boundary change is needed. The parent now owns verification and pull-request integration. No deployment.

Independent read-only review found no confirmed should-fix issue in the event guards, screen lifecycle, reduced-motion cutoff or approved Freeze rendering. The parent requeued the required tests and browser checks after the worker handoff.

## Check repair

The first executed checks found two check-boundary faults. Ice Wall's `.28 * 4800` has a binary rounding residue at 1344 ms. Compute the same 28 percent with integer multiplication before division, so the frame ends at its stated time. The real Freeze check tried Black's move before White completed the ordinary move and turn press after a free Freeze. Use the shared `endTurn` action before Black's move. A state probe confirmed the board stayed at ply 2 with the mark active because Black's input occurred before White pressed End turn.

Rerun the focused shared-lock tests, the confirmed-event browser tests and the registered `effects-states` check. Accept only exact 620 ms Freeze expiry, unchanged 1344 ms Ice Wall expiry, the ten approved release frames and no page errors. The first `plugin-ui` run passes in 339.7 s; its log is in `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/approved-motion-adoption-57Hn2N/plugin-ui.log`.

The focused `npm test` repair run is queued on the shared test lock, with its log at `/tmp/animation-adoption-repair-unit.log`. The registered Freeze check is rerun after the turn-press correction. No pass is claimed for either pending result.
