# Run available simulator and host release checks in parallel

Status: simulator and host lanes complete; physical after-fix view and Codex account switch remain open. Parent: U09 and U11. Follows ticket 52.

## Plan and pass criteria

1. Use the installed iOS simulator and supported controls. Verify the staging website's local turn, background or reload recovery, and relevant narrow-screen controls. Record the actual runtime and device. Preserve unrelated data and close test screens. Do not install large runtimes or claim simulator input proves physical finger use.
2. In a separate read-only lane, compare the current Codex trusted-tool-scope refusal with the app contract and official host documentation. Produce a bounded, actionable result. Do not expose app-only tools to the model, weaken auth or repeat the completed ChatGPT check as a Codex pass.
3. Independently review the phone layout commit and its regression change. Reuse passing checks; rerun only for a demonstrated change or unresolved concern. Any parallel code writer must use a separate worktree.
4. The integration lane verifies the new staging artifact and actual desktop ChatGPT, records evidence and limits, and updates the backlog. Keep production untouched. A missing simulator ChatGPT app must not become an invented native-host pass.

## Ownership

The simulator lane owns only `evidence/staging-release-checks/simulator/` in the parent workspace. The host and independent-review lane owns only `evidence/staging-release-checks/codex-scope-investigation/`. The integration lane owns the tickets and release report. No concurrent worker writes the product checkout.

## Evidence

Reuse ticket 51's physical iPhone journey, ticket 52's staged source `d161231f`, the 64 passing phone geometry cases and the existing full WebKit HTTP journey. Record each additional check against its actual source and surface. Simulator Safari, browser WebKit, native iPhone ChatGPT and desktop ChatGPT remain separate evidence classes.

## Result

### Simulator lane

Device: iPhone 18 Pro simulator (`iPhone19,2`), iOS 27.0 runtime 24A434, Xcode 27.1 (27A9275), on the same Mac. Staging website only; no account sign-in. Input is simulator pointer taps, not finger use.

- Local turn and computer reply pass on the narrow screen (`01-local-turn-ai-reply.png`).
- The retained local game survives a full simulator shutdown and reboot: Home shows Continue at move 2 with the last move (`02-after-reboot-retained-home.png`).
- Continue opens the full-width board. d2-d4 commits, Safari goes to the Home screen while the computer thinks, and on return the reply Nd6-c8 is present. A page reload keeps the position and the four-action Moves history (`03-turn-reply-home-return-reload.png`).
- Menu, New game and Change setup fit the screen. A Kings' powers game (Frost against Shadow) starts. Freeze shows its count, Use marks only enemy pieces, the frozen mark appears on d8, e2-e4 completes the turn and the computer answers with a fairy move, paladin h8-h6 (`04-powers-freeze-turn-fairy-reply.png`).

Not covered: account play (needs a provider sign-in on the device), native ChatGPT (no App Store on the simulator), cellular or offline phone behaviour, latency and finger reach. Simulator Safari does not close the ticket 52 native after-fix view.

### Host lane

`codex-scope-investigation/host-scope-report.md` now records the root cause of the Codex refusal. A second linked staging account (ticket 47) sets `requires_explicit_link_id` on the connector. The Codex host's widget scope check reads only the primary link in each tool's `resource_uri` and ignores `link_accounts`. A view bound to the second link is refused for every tool. `host-scope-repro.cjs` runs the host's own functions from the installed app and reproduces the exact message; views bound to the primary link pass. This is a host defect. No product, account or connection change follows.

### Independent review lane

`codex-scope-investigation/phone-layout-review.md`: ship `d161231f`; no regression or test gap. Physical native acceptance stays open.

### Open

- Physical native ChatGPT after-fix view (ticket 52). It needs the owner's Mac authentication for iPhone Mirroring, or the owner's own phone check.
- Codex in-place account switch: blocked by the host defect while two staging links exist.
