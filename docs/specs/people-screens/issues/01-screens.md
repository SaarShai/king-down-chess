# Part 01: the people screens

Status: ready-for-human

Spec: [People 2: the people screens that stand alone](../spec.md). Blocked by: none.

## Scope and plan

All code is new, in `src/interface/people/screens/`, with the test page `people.html`. One line of `vite.config.ts` adds the page only when `KINGDOWN_TEST_PAGES=1`.

### `sheet.ts`: the frame

- `peopleSheet(source, onClose)`: one modal `<dialog>` with a head (Back when a view has one, the title, Close) and a body that scrolls inside. `show(view)` opens it at the first view and changes the view in place (sign-in, then the name, then the task). Close, a tap on the scrim and Escape close it; the focus goes back to `source` (a tap on a phone does not focus a button, so the caller names it). The title takes the focus at each view.
- Layout (`people.css`): a sheet from the bottom with the safe areas below 600 px; a centred panel, 560 px wide at most, from 600 px (decision 37). 90 percent of the height at most, internal scroll. The kit's sheet motion (Exact), and a fade with reduced motion.
- Parts: `picture(icon)` (the game's pictures, `ICONS`), `statusLine()` (a live line for the result of the view), `plain(label)` (a third action: text, 44 px high).
- A long sheet keeps its main action in view: on a short screen (a small phone, a phone on the side), the main action and its status line stay at the foot of the sheet and the rows above them scroll (`position: sticky`). With room, they stay in their place, in the order of the lab.

### `sign-in.ts`: S1, S2, S3, S11

- `signInSheet(sheet, host, purpose, done, note?)`. Titles: "Sign in to play a person", "Sign in to join {inviter}'s game" (or "your friend's"), "Sign in again" (with its own line). The ways that `host.ways()` reports, in the order Google, Facebook, GitHub, email; The sheet opens after the ways load. At 1.5 seconds, it shows the service fault. A service way shows "Opening Google…" and leaves the page. Notes on the return: "Sign-in did not finish. Try again.", "Sign-in took too long. Try again.", the suspended line. "Not now" closes with no change. "Other players never see your email.", with Privacy and Terms on a line below (each link is a 44 px target).
- No way loads (or none is on): "Sign-in does not work now" with "Play the computer", "Try again" and "Cancel"; with no connection, its line is "No connection. Your games on this device still work."
- S2: "Continue with email" (Email, Send code, Back), then "Enter the code" (one field for the code, 6 to 10 digits (decision 109), Continue, "Send a new code"; Back changes the address). The code step lives 1 hour in the old form's record (`kingdown.email-code`, `{ address, at }`), so a reload on either page keeps it. The fault lines are the old form's (`src/account/email-code.ts`).
- S3 `nameSheet(sheet, host, done)`: the picture, the ready name, "Play as {name}" after the check; the busy state keeps space for the name and picture, "Change name or picture" (the host). A name that another player takes before the save gives the next name and a new save, with no message. A lost connection: "Could not save your name. Check your connection and try again."

### `names.ts`

- `readyName(random)`: adjective-picture-number (10 to 99), for example "brave-ogre-42" with the Ogre. 20 adjectives and the 17 pictures of `ICONS`.
- `freeName(check, random, first)`: the shown name, or the next one when the check says that it is taken (5 names at most). A failed check does not stop the sheet: the save checks again.
- `saveName(save, first, random)`: on `HANDLE_TAKEN`, the next name and a new save (5 tries at most). Any other fault goes to the sheet at once.

### `person.ts`: P2

- `playPerson(host, source)`: signed out → S1 ("Sign in to play a person"); no name → S3; then the sheet.
- `personSheet(sheet, host)`: the game choice ("Pieces only", "With powers", "With powers and cards"; a change also changes Play's choice through `host.setRules`), "Each player has 3 days for each move. You play White.", Play again (3 rows at most: picture, name, "{result}, {when}", Invite), "Send a link" with "For WhatsApp, Messages or Mail.", "Invite by name" (a new player) or the quiet "Invite another player by name" (a returning player).
- Send a link: "Making your game…" (busy: a second tap does nothing), then the share list with "{you} invites you to a game of King Down." and the link on a touch device that has one, else a copy and the toast "Link copied.". After the share list: the toast "Link sent. We tell you when your friend joins." The sheet closes. A closed share list keeps the sheet; a new tap shares the same link. When the copy fails, the link field gets the focus and scrolls into view. Its line says "Copy this link and send it to your friend."
- `nameSearch(sheet, host, rules, back)`: the field "Game name", "Players you know", the search from 2 letters (after 250 ms; an older answer does not replace a newer one), "No player has this name.", Invite on each row. After an invite: the toast "Invite sent to {name}. {name} sees it in Play." and the sheet closes.
- Lines (`problems.ts`, `inviteProblem`): `OPEN_INVITE_LIMIT`, `FRIEND_INVITE_LIMIT`, `FRIEND_GAME_LIMIT` (with the count), `FORBIDDEN` ("{name} does not take invites now."), `NOT_FOUND`, `RATE_LIMITED`, no connection, no answer.

### `landing.ts`: P6

- `landingState(key, me, answer, known)` (no DOM): `bad` (no link token: a game code is parked), `plain` (no preview with no sign-in), `own`, `valid` (with the facts: the rules, "3 days for each move", the side), `ended`, `limit`, and `bad` for an invite that is "not available". Spec section 2, items 3 and 4.
- `landingPage(host, fragment)`: "King Down", the inviter's picture, the title, the line, the facts, the status line, one main action and the quiet one. Join: signed out → S1 ("Sign in to join …"), no name → S3, then `host.join(key)`. A refused join shows its state; `HANDLE_NEEDED` opens S3; a 401 opens S1; no connection, no answer and too many tries show their line. "Invite {inviter} to a new game" (signed in, the inviter known) sends an invite by name with the same rules: toast "Invite sent to {inviter}.". "Send the link again" on your own link shares or copies the page's link.
- The landing column is 30rem; the safe areas add to its limit, so on a phone on the side they do not make the text column narrow.

### `recovery.ts`

`recoveryPanel('gone' | 'account' | 'down', host, name)`: "This game is not here" with "Back to Play"; "This game is for another account" with "Switch account" (one check: "We sign out {name} on this device. Then you sign in with the other account.") and "Back to Play"; the service line with "Try again". `signInAgain(host, done)`: "Sign in again" over the game; `done` is the controller's `signedIn()`, and the join shows "Signed in. Turn sent.".

### The test page

`people.html#<state>`: `person`, `person-new`, `person-signed-out`, `person-no-name`, `by-name`, `sign-in`, `sign-in-retry`, `sign-in-expired`, `sign-in-down`, `code`, `name`, `again`, `landing-valid`, `landing-plain`, `landing-own`, `landing-ended`, `landing-ended-known`, `landing-limit`, `landing-blocked`, `landing-bad`, `landing-service`, `account`, `gone`, `down`. Query: `touch` (a touch device with a share list), `share=cancel`, `copy=fail`, `ways=<list>`, `wait` and `make` (the fixture's delays). `window.peopleDemo` gives the calls, the toasts, the copies and shares, and `fail(call, fault)`.

### Tests

`rules.test.ts` (no page):

- every ready name passes `handleProblem` and has 20 characters at most; the noun is the picture;
- a taken name gives the next one, and a failed check does not stop the sheet;
- `HANDLE_TAKEN` gives the next name with no message, 5 tries at most; a lost connection stops at once;
- one line for each refusal of a link or an invite, and the count of a game limit;
- the email code faults say what the old form says;
- the code step lives 1 hour in the old form's record (the old form's clean-up removes it);
- the share list only on a touch device that has one;
- "{result}, {when}";
- one landing state for each server answer.

`pages.test.ts` (Chromium on a Vite dev server, the test page):

- Send a link: one game for two taps, busy, a copy on a computer, the toast, the sheet closes, the focus goes back;
- the share list on a touch device, a closed share list keeps the sheet and the same game, the "Link sent" toast;
- Play again: 3 rows, Invite with the chosen game, the quiet name search; a new player has "Invite by name";
- Invite by name: Players you know, no search under 2 letters, no result, a refused invite, Back;
- a refused link: the limit line, the line of no answer;
- S1: only the reported ways, in the fixed order; Not now, Escape and the scrim close with no call;
- signed out: sign-in, the ready name (the taken one is not shown), then the sheet;
- S3: a taken name on save gives the next one with no message; a lost connection has its line;
- S2: the code step after a reload, a wrong code, the right code, the record goes;
- S11: "Sign-in does not work now" with its three actions; the suspended line;
- "Sign in again": the sign-in sends the kept turn ("Signed in. Turn sent."); the two return notes; the service line with "Try again";
- the landing: signed out, Join → sign-in → name → join; an ended invite offers "Invite {inviter} to a new game";
- the landing states: your own link, a refused invite, a broken link, an ended invite, a game limit, no answer;
- recovery: another account (one check), a gone game;
- at 320 x 568: no side scroll, controls of 44 px or more, no text under 14 px, the main action whole in view.
- the safe areas: at 390 x 844 the sheet and the landing keep their content out of them; on a phone on the side (844 x 390, 59 px at the left and the right) the landing column keeps its 30rem.

A rule test fails without its rule: the record of the runs that remove a rule is in the report (design project, `parallel/people/run/report.md`, section "people2").

## Verification

See the report, section "people2", in the design project: test counts and logs, the build, and the browser run with its screenshots.

## Known limits

- The screens are not on Play, on `/j` or on the game screen: the join puts them there (the report lists what it needs).
- The landing shows three causes as one state (spec section 2, item 3).
- No name editor (S4), no waiting sheet (P3), no invites on Play: not in decision 50.

## Repair

[Issue 02](02-repair.md) records the repairs after the two independent checks. The final state and evidence are in the design project, `parallel/people/run/report.md`, section Repair.
