# Signature mechanics across web and ChatGPT

Verified on 20 October 2026. This record supplements the local HTTP/MCP browser check with the actual ChatGPT host.

## Artifact

- Product source: `01cbe379`; staging deployment: `dpl_FtPtUzjWoYNbtzvMLXUgRhrGVW3E`.
- [Saved staging game](https://kingdown-staging.vercel.app/g/0e42a02f-bf77-854e-ba43-11e66269a091).
- [ChatGPT staging app](https://chatgpt.com/mcp-app/asdk_app_6ad777853ecc8191820df5a18fcb9e5f/kingdown_open).
- White plays the computer at Beginner. Fairy pool: Archer, Guard, Maester, Beast and Ogre. Cards: Vault, Ice Wall, Freeze and Morph. White king: Mud/March. Black king: Shadow/Darkness.

Cards permit always-on king powers. This proof uses the approved March behavior; it does not combine Cards with a forbidden limited-use king power.

## Accepted journey

| Turn | Surface | Accepted effect |
|---|---|---|
| White 1 | Website | Pawn `e2-e3` |
| Black 1 | Computer | Pawn `a7-b6` with Darkness |
| White 2 | ChatGPT | Pawn `e3-e5`: March works away from the home rank |
| Black 2 | Computer | Pawn `b6-a5` |
| White 3 | Website | Maester `Mc1<>c2`: Maester and friendly pawn exchange squares |
| Black 3 | Computer | Morph turns the f7 pawn into a bishop |
| White 4 | ChatGPT | Morph `!IP:b2=N`: the b2 pawn becomes a knight |
| Black 4 | Computer | Pawn `b7-c6` |

The website reload and ChatGPT's Refresh the board command read the same saved game. The extracted visible histories match all eight actions. Both interfaces show White to move, March still always on, both Morph cards spent and the other three cards available. The final boards retain the pawn on e5, Maester on c2, pawn on c1, knight on b2 and black bishop on f7.

The game remains active for inspection. Verification uses explicit refresh/reopen when changing surfaces; it does not claim instant live mirroring between two idle tabs.

## Evidence and limits

Workspace evidence: `evidence/staging-signature-mechanics/`, next to the `app/` repository. It includes setup, both final boards, both move sheets, matching extracted histories, the deterministic browser report and the isolation reports.

The automated friend-game check separately tests exact revisions, authoritative positions, spent-card bits, command surfaces, reload and shared result. Its MCP calls are not actual ChatGPT-host tests; the journey above is.

This is representative proof of the three feature families, not exhaustive coverage of every fairy piece, card, king power or interaction. U05 retains that coverage obligation. No product source changes or deployment are part of this baseline ticket. Production and the original project remain unchanged.
