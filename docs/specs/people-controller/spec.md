# People 1: the online controller

Status: ready-for-human

Branch: `redesign`, in the people lane's copy of the tree. No commit, push, pull request or deploy until the owner says so. This stage is the first stage of the People release. It does not go into the launch build.

## 1. Source

The lead's decision 49 for the stage "people1" (design project, `runs/launch/decisions.md`). Its sources: `docs/LAUNCH.md` section "People release" (the rows marked People: online controller, receipt lock M12, engine identity M3), `runs/people/people-spec.md`, `runs/people/functions.md`, `runs/people/decisions.md`, `runs/account/account-spec.md` (S11 recovery) and `runs/audit/code-audit.md` (M3, M9, M11, M12, M14), all in the design project. The existing parts: [accounts and multiplayer](../accounts-multiplayer/spec.md), [match foundation](../match-foundation/spec.md), [Send your turn](../send-turn/spec.md) and [friend invites](../friend-invites/README.md).

## 2. The plan

### Goal

One online game controller with no DOM, on the solo turn source (`DraftTurn` on a `Game`, `src/interface/play/turn.ts`). A later stage puts the people screens on it. It replaces the role of the old controller (`src/account-game/runtime.ts` with `src/plugin/screens/board.ts`, audit M11 and M14) for the new page only.

### Scope

[Issue 01](issues/01-controller.md): the new files under `src/interface/people/`.

- `server.ts`: the adapter to the existing REST client (`src/online/client.ts`, unchanged) and one fault kind for each server answer.
- `receipt.ts`: the durable command receipt in the old page's key and shape, so each page sends the other page's saved command again with the same ID.
- `replica.ts`: the local copy of the game from the server view, the moves of new commands, the opponent's last turn, and the actions of one turn.
- `controller.ts`: join, load, Send, receive, offers (draw, rematch), resign, end with no result, claim, the receipt with the M12 fix, the engine identity (M3), the poll, reconnect and the recovery states.
- `words.ts`: the time words of the people spec.
- `fake-server.ts`: test support. The website's REST paths in front of the protocol fixture (`tools/plugin-protocol-fixture.ts`). No app code imports it.

### Where the decision cannot hold as written

Each item names the decision, the reason, and the plan's choice. The lead can reverse each one.

1. **Hidden setup.** A game with king powers or the arrangement on starts in `setup`: each seat sends a hidden choice (`src/match/setup.ts` `seatChoicesNeeded`). Decision 49 does not list setup, and the people decision 7 needs the server change S1 (kings drawn at the join). Plan: the controller shows the phase `setup` and sends no choice. The tests use "Pieces only" games. Carry item for a later stage.
2. **Draw offers left.** The view has no count of the offers that a seat made (the server keeps `draw_offers`). Plan: the controller counts the player's own offers in the commands that it reads. A page that opens a long game can show more offers than the server allows; the server then refuses (`NOT_ALLOWED`) and the controller shows the refusal. Carry item: a view field.
3. **M12, "Discard after two retries".** The old page compares the receipt bytes before each command, so a new field in the receipt locks the old page. Plan: the count of failed checks is in the memory of the page, and the receipt keeps the old bytes. Each open of a game counts one check. A receipt that is not readable, or a start of the old page (create, find) that this controller cannot send, can go at once.
4. **M3 with a second engine.** The old board asks the server for a preview at each step. Plan: the local engine draws the choices, and the server checks the whole turn once before it goes (`POST /api/games/:id/preview`, then the command). With the same engine (the normal case: each build injects its engine identity), no preview goes.
5. **Copy.** Decision 49 gives no screens. Plan: no product text except the time words of the people spec. The new state "the check cannot finish" (M12) has no line in the copy table; the next stage needs one.
6. **The browser run.** The controller draws nothing, and no page imports it yet, so the build output does not hold it. Plan: the browser run shows (a) the new page and the old page at each size of the size matrix in Chromium and WebKit, with no console error (no change), and (b) the controller in both browsers on the Vite dev server with the real `fetch`, Web Locks, local storage, cache rule, `online` and `offline` events and the page visibility, against the fake server through Playwright's network routes.
7. **Audit C9.** The audit's table names C9 beside M12, but the audit gives no text for C9. Not done.

### What does not change for the old screens

No file outside `src/interface/people/` and this ticket changes. The old online page (`/play`, `/g/...`, `/j`), the REST client, the poll, the receipt code of the old page, the protocol and the server stay as they are. The controller imports `src/online/client.ts`, `src/plugin/poll.ts`, `src/plugin/screens/board-model.ts` (`boardActions`), `src/account-game/engine-identity.ts` and the solo turn source; it changes none of them.

### Checks

- `npm test` and `npm run test:docs` pass. No test is removed or weakened.
- `npm run build` passes.
- The browser run of item 6, with its logs and screenshots in the design project, `parallel/people/run/people1/`.
- Report: `parallel/people/run/report.md`, section "people1", in the design project.

## 3. Verification

[Issue 01](issues/01-controller.md), section "Verification".

## 4. Reviews

- Approval: the owner gave the build decisions of the People release to the lead (design project, `runs/launch/decisions.md`, "The People build"). The lead's decision 49 is the approval of this scope.
- An independent review comes before a pull request.
