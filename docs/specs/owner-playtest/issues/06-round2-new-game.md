# Round 2: New game panel

Status: resolved

Decision 124 and the owner's round 2 brief set this change.
Branch: `owner-playtest-2a`. Base: `59843005f`.

## Changes

- Remove the next army block and the red replacement line. Show Player.
- Use one slider part for level and side. Keep both accessible names. Read stored Random as Light.
- Split each double piece into x1 and 2nd. Link both choices. Count selected pieces for the seven-piece limit and the local deal.
- Keep the old online kind list in `onlinePanelOptions`. Decision 124 item 3 waits for the lead.
- Open an option section when its checkbox goes on. Keep one section open.
- Check all cards when cards go on. Keep at least four. Name the four in catalog order.
- Keep the king power rules. Player shows light pieces.

## Checks

- Full `npm test`: 7,334 pass and 387 skip in the unit suite. The 114 rendering tests pass. No failure.
- Focused model, side, menu and text tests: 42 pass.
- Documentation: 197 pass and one existing skip. Both type checks pass. Build passes.
- Chromium: 19 panel cases pass at 360x640, 390x844, 430x932, 768x1024, 844x390 and 1440x900.
- WebKit: 11 panel cases pass, with both 390x844 and 430x932.
- The ten selected menu refresh and history cases pass. The old-page New game check passes all 31 subchecks.
- The design check reports no findings. The screenshots check whole words, text of at least 14 px and panel width.

The last-four refusal stays in the fixed footer, including a refusal on the last card below the fold.
The deleted army block leaves no empty divider. Each single-knight start deals one knight.

## Handoff

The lane report is `runs/launch/owner-playtest/round2/build/lane-a.md` outside the repository.
Its folder holds the 98 screenshots and all final command logs.
The lead owns the pending online count schema and the king power decision.
The rename lane applies its king display names to the power buttons and summaries in `home.ts`.
The old-page check stays on its old words: the owner requires that page to keep its behaviour.
No live account, invite, push, pull request or deploy is used.
