# Owned games across web and ChatGPT

Verified on 20 October 2026. This record covers the integrated product, after the separate baseline in [staging-proof.md](staging-proof.md).

## Artifact

- Source: `be0786da`; engine: `sha256:3e743b131b5e89b9a78a2e80f20f6c12331db0dd10449619d6d0cadb110611fc`.
- Staging preview: `dpl_Tx6SkvtZnmT7R15NumP1Srp8owM6`, on project `kingdown-staging`, target preview, state READY.
- [Website game](https://kingdown-staging.vercel.app/g/9269ad2f-efd7-81da-874d-5375f668956b).
- [ChatGPT staging app](https://chatgpt.com/mcp-app/asdk_app_6ad777853ecc8191820df5a18fcb9e5f/kingdown_open).
- The public staging page matches the built HTML byte for byte. An unauthenticated MCP initialize request returns 401.

The new game uses the updated engine. White plays the Beginner computer with fairy pieces, four cards, Mud/March and Shadow/Darkness. The drawn army contains Guard, Maester, Beast, Archer and Ogre. Cards are Freeze, Morph, Vault and Ice Wall. Cards allow always-on king powers; no rule is changed for this test.

## Accepted journey

| Turn | Surface | Accepted effect |
|---|---|---|
| White 1 | Website | Pawn `e2-e3` |
| Black 1 | Computer | Pawn `a7-a5` |
| White 2 | ChatGPT | Pawn `e3-e5`: March works away from the home rank |
| Black 2 | Computer | Pawn `b7-c6` with Darkness |
| White 3 | Website | Maester `Mc1<>c2`: it exchanges squares with the friendly pawn |
| Black 3 | Computer | Pawn `a5-a4` |
| White 4 | ChatGPT | Morph `!IP:b2=N`: the pawn becomes a knight |
| Black 4 | Computer | Morph changes the c6 pawn to a knight |

Website reload and ChatGPT's **Refresh the board** read the same accepted state. The two visible histories match all eight actions. Both show White to move, March always on, both Morph cards spent and the other cards available. The boards retain the pawn on e5, Maester on c2, pawn on c1, White knight on b2 and Black knight on c6.

The older game `0e42a02f-bf77-854e-ba43-11e66269a091` also opens after deployment with all eight prior actions. The archive tests separately cover replay and continuation with retained engines.

## Evidence and limits

Evidence is in `evidence/staging-game-ownership/` beside the application repository. `artifact.json` records source, engine, deployment, sizes, hashes and public checks. `host-proof.json` records the matching histories. Both board screenshots and move sheets are saved.

This is representative proof of fairy pieces, cards and king powers, with actual actions on both interfaces. It is not exhaustive coverage of every item or interaction. U05 retains that work. Surface changes use explicit refresh/reload; this is not a claim of instant live mirroring.

The browser-control debugger again interferes with website startup: the cache-policy check times out while attached, then native reload after detachment succeeds. The security check stays intact. One native ChatGPT mount shows an `Internal error` after the game list loads. Selecting the game opens it without using **Try again**, and the full journey above succeeds. No matching server tool error appears in the inspected deployment logs; the error's origin is not established.

Three later native direct-URL opens reach enabled controls with distinct frame IDs and no error or **Try again**. The second and fourth mounts also resume the saved board. Before the fourth mount, **Refresh tools** runs on the existing staging connection. That mount shows all eight actions, March always on and both Morph cards spent. Evidence: `startup-matrix.json`, `fresh-open-2.txt`, `fresh-open-3.txt`, `fresh-open-4.txt`, `fresh-open-4-board.txt` and `fresh-open-4-history.txt`. The profile has a warm cache. These checks do not prove cold-cache or general startup reliability; the unexplained error remains open in the first-load record.

Changes are limited to the staging preview, its alias and the existing staging tool definitions. Production, the original project, authentication settings and gameplay rules stay unchanged.
