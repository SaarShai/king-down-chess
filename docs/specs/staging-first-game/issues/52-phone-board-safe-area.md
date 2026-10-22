# Remove the unused space above the embedded phone board

Status: deployed in staging; physical-host visual acceptance open. Parent: U09. Follows ticket 51.

## Plan and pass criteria

1. Preserve the native phone screenshot from ticket 51. Reproduce its empty top space in the existing compiled phone geometry test. Simulate the browser's nonzero CSS safe-area environment separately from the host's safe-area context; normal desktop WebKit does not supply the physical device environment.
2. Assert that the opponent strip starts at the table's usable top, that host header/composer gaps remain, and that the board still fits. Observe the failure before changing product CSS. Check the shared local table, embedded frame, online frame and existing layout tests for affected consumers.
3. Fix the cause once in the embedded layout. Preserve local Safari's device-inset handling, card targets, short-screen scrolling and desktop arrangement. Do not add a new layout system or change art, rules or host permissions.
4. Run the focused geometry test and the relevant existing checks. Publish only through the existing staging guard. Compare the same retained game on the physical phone, verify card draft/Undo and Settings, then close test screens. Keep an explicit limitation if the physical host cannot load the new resource.

## Evidence

The parent workspace's `evidence/staging-release-checks/` holds the before screen and subsequent diagnostic receipts. Product starts at `64205cdf`. No cause is accepted from the screenshot alone.

## Diagnosis and change

The compiled regression fails before the fix. Host insets stay at 102/118 px. Giving the browser matching nonzero CSS environment values adds 102 px above the opponent and shrinks the canvas from 303 to 208 px. The frame does not move. This reproduces the physical screen's empty space. The local table's top device padding is counted again inside the already-inset account frame.

The portrait account table now has zero top padding; the frame still owns the host/device insets. Local Safari keeps its existing table padding. The build maps this rule to both setup and live tables; the result table uses the same rule. Desktop and landscape layout are unchanged. The exact regression passes after the two-line CSS change.

Both full existing phone geometry selections pass: 32 cases in Chromium and 32 in WebKit, with typecheck and 54 artwork checks per run. The initial Chromium run finds an unrelated high-zoom result assertion. It also fails against unchanged `7a1e5e28`. Its screenshot shows a complete second action and a partly visible third action, with a valid scroll cue. The test now requires a partly visible later action, not specifically the second one; the 12 px cue, first-action fit, every-action reachability and Back checks remain. No timeout or accessibility threshold changes. Temporary diagnostic output is removed.

## Staging acceptance

Source `d161231f` passes the existing registered WebKit HTTP journey in 282.0 seconds, the combined build, artifact check and staging deploy guard. Preview `dpl_5rhvinFGfcpNWzMxzu3VLwxWFHod` is ready and has the staging alias. All eleven saved-engine archives stay unchanged. Server, consent and runtime bytes match the prior product release.

The first launcher attempt passes staging variables to the isolated plugin fixture and stops at its build guard before UI work. The corrected launcher keeps the fixture and staging environments separate. No product guard changes. The final launcher publishes successfully, but its immediate service-worker equality check fails after alias assignment. A later public fetch matches the home page, account page and worker without another deploy. Both failed receipts remain; `phone-layout-release/accepted-alias.json` records the final match.

Actual desktop ChatGPT opens the retained seven-action game and Settings. A separate fresh tab reaches enabled Play controls under one continuous startup wait, then opens Settings. It needs no Try again and shows no Internal error. The fresh sandbox ID is `16aa994e-02ce-451a-8974-d807167de0ef`. No account turn or setting changes. Both owned Chrome tabs close. See `phone-layout-release/chatgpt-acceptance.json` and its screenshots in the parent evidence folder.

iPhone Mirroring requires the owner's protected Mac login again before the deployed visual check. The owner asks to use a simulator and parallel agents instead. Continue the available simulator check under [ticket 53](53-simulator-and-host-release-follow-up.md). Simulator Safari cannot establish native ChatGPT safe-area acceptance; the physical after-fix check remains explicit.
