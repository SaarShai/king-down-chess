# Effects review lab

Status: ready-for-review
Type: prototype

## Scope

Owner: "prepare a full list of animations you think we should develop, then launch subagents to develop them in parallel. show me early results as they come in for my feedback."

## Work

- Read the character-animation chat. Its latest work uses fixed painted body parts and an articulated lance test. No changes to that work.
- Inspect engine, render and card fixtures. Frozen marks and several indication animations already exist; new work must build on that baseline.
- Create the inventory in `../spec.md`.
- Parallel sample ownership: signals, cards and GUI in separate worktrees. Integration worktree: `codex/effects-lab`.

## Checks

- Review actual playback of hero samples and verify all sample selectors.
- Check phone layout, pause/replay/scrub, reduced motion, flip and errors.
- Confirm all released cards have fixture-backed samples; record any limit.
- Independent review before final handoff.

## Evidence

- `npm run check:browser effects-animation` passes after the full revision. The standard runner builds the game first. The browser check covers 51 studies and 255 exact state/frame checks, all 21 final card boards, replay, pause, board flip, 643 px and 390 px widths, live OS reduced motion, manual reduced motion, inventory and group navigation. No browser errors.
- Run evidence: `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/effects-lab-hPadYl/`. The `effects-animation/` folder holds the report, desktop/phone screenshots, action/contact sheets for all cards and three hero playback recordings.
- Direct browser inspection covers the revised Burn impact, Sky Lift flight and Check danger burst. The combined contact sheets cover every revised card.
- Independent review found stale capture marks, lost Firewall material during a continuation, a live reduced-motion update gap and a partly completed transformation at its first crossfade frame. All four are fixed. The final independent review reports no actionable findings in the integrated renderer, transitions, material layers or supplied proof. Transformation actors now live beside travel actors; their visibility and fade both use `.35–.62`.
- All eight rejected board animations are removed from the active selector. GUI, Shove and Hint retain the accepted direction. Cards, ice/fire materials, Swap and dramatic Check remain open for visual review.
- No production source or game rule changes. The only tracked change outside this spec folder registers the browser check. Main and the character-animation work remain unchanged. No full unit suite or production integration is claimed.
