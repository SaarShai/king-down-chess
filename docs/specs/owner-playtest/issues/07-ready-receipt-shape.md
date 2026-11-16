# Save a Ready receipt in the old page's shape

Status: ready-for-agent
Type: task
Severity: Low

## Problem

The receipt uses the old page's key and must keep its argument shape, so each page can resend the other's command (`src/interface/people/receipt.ts:3`). For `kingdown_choose`, the old page builds top-level `king`, `order` and `ready` (`src/plugin/screens/seat-model.ts:27`). `createWebTransport` serializes `{ name, args }` and writes those arguments unchanged (`src/online/runtime.ts:40`, line 48). The tool schema and the old decoder use the same shape (`src/plugin/server.ts:180`, `src/online/runtime.ts:113`).

`receiptOf` (`src/interface/people/receipt.ts:23` at `c76f0493f`) saves Ready with nested `choice: { king, order }` and top-level `ready`. `actionOf` (line 35) reads only top-level `king` and `order`. If Check again reads no higher server revision, it resends this action with `choice: {}` (`src/interface/people/controller.ts:282`, line 299). The server refuses it with HTTP 400, `INVALID_INPUT`; it does not choose a default king (`src/match/service.ts:406`, `src/match/setup-schema.ts:13`). The controller clears the receipt and shows the refusal. The game does not change, and a new Ready works.

Other paths reach the same decoder:

- A new controller settles receipts on open (`controller.ts:376`), and also after sign-in, when the browser comes back online, and when a new command finds a saved receipt (`:455`, `:496`, `:333`). On open, `view` is not set, so it clears the refused receipt with no notice (`:309`, `:313`).
- The old page restores a saved receipt as pending (`src/online/runtime.ts:131`, line 143) and sends it on mount and on Retry (`src/account-game/runtime.ts:475`, line 360). Its decoder has the same fault for a nested receipt. It has no revision read before a resend (`runtime.ts:54`), so it can send the broken body even after the first Ready went in. The server then refuses only the broken resend.
- A read with a higher revision clears the receipt with no resend (`controller.ts:291`, `:166`). This is why the accepted-command tests do not reach the fault.

The receipt writer and decoder are the same on main at `b53b99760`; that controller also resends the decoded receipt. PR 367 does not add this fault. The re-review of r11 names it (`runs/launch/release/review367r2/checks.md`).

Evidence: an independent check of this ticket (`runs/launch/owner-playtest/followups/verify07.md`) runs eight focused tests on the current code, all pass (`verify07.test.ts`, `verify07-test.log`, `verify07-bodies.log`). The first send carries the king and order; the Check again body is `{"type":"choose","choice":{},"ready":true}`. A candidate repair is in `candidate-receipt.ts` in the same folder.

## Repair

- In `receiptOf`, save a `choose` action as the old page does: `king`, `order` and `ready` at the top level.
- In `actionOf` and in the old page's `commandAction` (`src/online/runtime.ts:113`), read each field from the top level when it is present. Otherwise read it from `args.choice`. Keep an explicit `king: null`; it means powers are off (`src/match/setup.ts:55`). Both readers must accept old flat receipts and the nested receipts that the new page saves before the repair.

## Checks

- First a failing test: a Ready whose send fails with no known answer, then Check again. The resent command has the same king, order, ready and command ID as the first send.
- Both decoders read a new flat receipt and an existing nested receipt with no loss. Check a king with a power and `king: null`. Top-level fields come first, `king: null` included.
- Recovery on open resends an unaccepted Ready with the original fields and ID. An accepted Ready with a lost reply settles by revision with no resend.
- Add `choose` to the receipt compatibility test (`src/interface/people/receipt.test.ts:10`).
- `npm test`, `npm run test:docs`, `npm run typecheck` and `npm run build` pass.
