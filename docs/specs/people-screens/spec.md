# People 2: the people screens that stand alone

Status: ready-for-human

Branch: `redesign`, in the people lane's copy of the tree. No commit, push, pull request or deploy until the owner says so. This stage is the second stage of the People release. It does not go into the launch build.

## 1. Source

The lead's decision 50 for the stage "people2" (design project, `runs/launch/decisions.md`): the sign-in sheet (account spec S1 to S3, without Apple), the link landing (join by link), the "Play a person" sheet (send a link, invite by name, play again) and the recovery sheets, with the kit and the lab `labs/people/` as the visual reference, in new files under `src/interface/people/`, each shown by a test page or a hidden route. The home, the bar and the game screen do not change: the lead joins the parts after the merge. Sources of the screens and the texts, all in the design project: `runs/people/people-spec.md` (P2, P6, sections 4 and 5), `runs/account/account-spec.md` (S1, S2, S3, S11), `runs/people/decisions.md`, `runs/account/decisions.md`. The first stage: [People 1: the online controller](../people-controller/spec.md).

## 2. The plan

### Goal

The people screens work on their own, on a test page with a fixture in place of the server and the sign-in service. A later join puts them on Play, on the route `/j#{token}` and on the game screen.

### Scope

[Issue 01](issues/01-screens.md): new files under `src/interface/people/screens/`, the test page `people.html`, and one opt-in entry in the build's page list.

- `sheet.ts`: the frame of the sheets (one modal `<dialog>`: a sheet from the bottom on a phone, a centred panel of 560 px at most from 600 px) and the shared parts.
- `sign-in.ts`: S1 (the ways that the service reports, in a fixed order; the return notes), S2 (the email code, with the code step kept for 1 hour in the old form's record), S3 (the ready name, checked before it shows; a taken name gives the next one with no message), and "Sign-in does not work now" (S11).
- `person.ts`: P2: the game choice, Play again (3 rows at most), Send a link (the share list on a touch device, else a copy), Invite by name (Players you know, the search from 2 letters), the lines of each refusal. A signed-out player signs in first; a player with no name takes the ready name.
- `landing.ts`: P6: one state for each server answer, each with one main action. Join signs in, takes the name, then joins.
- `recovery.ts`: "This game is for another account" (with one check before the sign-out), "This game is not here", the service line with "Try again", and "Sign in again".
- `copy.ts`, `names.ts`, `problems.ts`: the texts, the ready names, the line of each failed call. No DOM in `names.ts` and `problems.ts`.
- `people.css`: the layout, with the kit's tokens and parts.
- `demo.ts` and `people.html`: the test page. Each state has an address: `people.html#<state>`.

### Where the decision cannot hold as written

Each item names the reason and the plan's choice. The lead can reverse each one.

1. **The folder.** The people1 test "has no DOM" lists the exact files of `src/interface/people/`. Plan: the screens go into `src/interface/people/screens/`, so that test does not change and stays true for the controller modules.
2. **No server adapter in this stage.** The screens take a host object (the calls they need). The website client has no call for `GET /api/friends`, and `src/parked.test.ts` forbids that path in `src/online/client.ts`: named invitations are parked in the code base (`docs/PARKED.md`, "Named invitations and the invitation inbox"), but the People release has them in scope (`docs/LAUNCH.md` of the design project: "named invites are in scope"). The sign-in return accepts only `/play/` and only Google and GitHub (`src/online/sign-in.ts`, `src/account/client.ts`). Plan: the screens stand alone; the report lists what the join needs, with the parked rule as a decision for the lead.
3. **The landing states "Seat taken", "Cancelled" and "Blocked".** The server gives one answer (`INVITE_UNAVAILABLE`, with the text "no longer open" or "past its end time") for a taken seat, a cancelled and a replaced invite, and one answer ("not available") for a block and an invite for another player. Plan: the first group shows "This invite has ended" (its line, "Invites last 7 days. {inviter} can send you a new one.", is true for each cause); the second group shows "This link does not open a game" ("Part of the link may be missing. Ask your friend to send it again."). The three other states need a cause in the server's answer.
4. **The inviter's name on an error.** The server gives the inviter only in a good preview, and today only to a signed-in player (S2 of the people spec: no public preview yet). Plan: a signed-out player sees "A friend invites you to a game"; an error after a good preview names the inviter; an error with no preview says "Your friend". The sign-in title is then "Sign in to join your friend's game" (a new text).
5. **The count of a game limit.** The website client drops the details of a refusal. Plan: the count comes from the server's own text (`INVITE_NOTICES.gameLimit`), else the server's limit (5).
6. **Six boxes for the code.** Plan: one field of six digits (`one-time-code`, `inputmode="numeric"`), which the phone fills from the mail. Six fields break the fill and the paste.
7. **"Change name or picture".** It opens S4, which is not in this stage. Plan: the button calls the host; the join wires S4.
8. **New texts.** The copy tables have no text for: the field label "Code", the field label "Link" (the link shows in a field when the copy fails), "Type 2 letters to find any player." (from the lab `q2b.html`), "Sign in to join your friend's game", and "Your friend" in the ended line. "Signed in. Turn sent." follows the people spec (section 5), not the account spec ("Move sent").
9. **A closed share list.** The spec does not say. Plan: the sheet stays open with "Send a link"; the game exists, and a second tap shares the same link (no second game).
10. **The test page in the build.** The repair requires `KINGDOWN_TEST_PAGES=1`. The default build has no fixture page. Plan: `people.html` is a page of the build (as `moments.html` in the moments lane), so a check can use `vite preview`. It says `noindex`. The lead removes it, or keeps it out of a deploy, at the join.

### What does not change for the old screens

`index.html`, `next.html`, `src/interface/play/**`, `src/interface/ui/**`, the people1 files, the online client, the account modules, the routes and the server. The only base file that changes is `vite.config.ts`: one opt-in page in `rollupOptions.input` (`KINGDOWN_TEST_PAGES=1`).

### Checks

- `npm test` and `npm run test:docs` pass. No test is removed or weakened.
- `npm run build` passes.
- The browser run on `vite preview`: each state of the test page, the two flows, and the new and old pages, at each size of the size matrix in Chromium and WebKit, with the safe areas; logs and screenshots in the design project, `parallel/people/run/people2/`.
- Report: `parallel/people/run/report.md`, section "people2", in the design project.

## 3. Verification

[Issue 01](issues/01-screens.md), section "Verification".

## 4. Reviews

- Approval: the owner gave the build decisions of the People release to the lead (design project, `runs/launch/decisions.md`, "The People build"). The lead's decision 50 is the approval of this scope.
- An independent review comes before a pull request.
