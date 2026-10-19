# 48 Plugin check: give Vault a move

Status: resolved
Branch: claude/rc-vault
Base: b3f0ab5d

## Scope

Remove the random failure at `The dealt Vault has a move`. Change only the card game's options in the check. Keep all assertions and time limits.

## Plan and pass criteria

1. Check the Vault rule, the deal, and the card move filter.
2. Use `fairy:false` if each possible army gives Vault a legal move. Check that the nearby coin checks keep their purpose.
3. Pass the syntax check and a script with 200 seeds. Pass `tools/test-lock.sh node tools/check.mjs plugin-ui` once.
4. Check the diff and commit the fix with both required trailers. Do not push or merge.

## Cause and change

Vault moves only a rook, bishop, or queen. A random fairy army can have none of them. The hand still has all four cards. `cardCoins` selects the legal moves with the card's power tag; it cannot give Vault a move when the engine has none.

Set `fairy:false` for this card game in `tools/plugin-ui-check.mjs`. The army order can still change, but it always has two rooks, two bishops, and a queen. A rook can pass over its pawn on rank 2 and land on the empty square on rank 3. The king stays safe behind its full pawn rank. King powers and arrangement stay off.

`checkOwnerPicks` checks coin rows, player names, and Resume text. `measureCardCoins` checks coin contrast and letters. These checks need the same four cards, not fairy pieces. No product fault is found.

## Checks

`node --check tools/plugin-ui-check.mjs` passes. `git diff --check` passes.

A small script runs with `node --input-type=module` and `register()` from `tsx/esm/api`. For seeds 1 to 200, it calls `draw`, `defaultChoice`, and `buildSetup`. It sets the match rules with no king powers and the dealt hands, then calls `startPosition`, `legalMoves`, and `cardCoins`. Each new deal has four cards and 30 Vault moves. Each deal includes a rook move from rank 1 to rank 3 with the Vault tag. All 200 pass.

The same script checks the old options with the same 200 seeds. Two deals have no Vault move. Seed 32 gives army `NLKSMNMO`, which has no rook, bishop, or queen. This confirms the cause.

`tools/test-lock.sh node tools/check.mjs plugin-ui` passes once in 198.6 s and exits with code 0. The command waits for the shared test lock before it starts. The full check includes `checkOwnerPicks`, `measureCardCoins`, the Vault sheet, the armed status, and the spent card. All pass.

Log: `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/rc-vault-FOLZ5g/plugin-ui.log`. The run record has `ok:true` and no fault.

The final check change is one added option. All assertions stay as they are. No source, time limit, STEP factor, workflow, or dependency changes. No retry loop is needed. The fixed piece set gives a legal Vault move for every order, so no fixture seed is needed.

`npm test`, HTTP mode, and WebKit are not run. No push or merge.
