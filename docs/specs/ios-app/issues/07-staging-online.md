# Deploy the app origin to staging and play online in the app

Type: task
Status: resolved
Blocked by: 02
Parent: [iOS app map](../map.md)
Labels: wayfinder:task

## Question

Does online play work in the app against staging once the `/api` change is deployed there?

## Steps

1. Owner: give the word to merge the ios-app pull request and deploy it to staging (AGENTS.md: a deploy needs the owner's word).
2. Agent: `npm run ios:sync`, run the app in the simulator, sign in with a staging test account, open `/play/`, start a game against the computer on the server and against a second test account, and play moves on both sides.
3. Agent: send the app to the background for two minutes and bring it back; the game view must refresh.
4. Record the result here. On a fault, add a bounded ticket.

## Done when

Two staging accounts play a full online game with one side in the app, and the background return refreshes the view.

## Progress

2026-11-08: step 1 is done. The owner gave the word ("Yes, merge and deploy"). PR 313 merged as `d49875e8a`. Release 17 then took it to staging (PR 316, `30a69074`) and to kingdown.dev.

- **Server check, staging and live.** The preflight from `capacitor://localhost` answers 204 with the exact origin, `Authorization, Content-Type` and `Vary: Origin`. `/api/status` answers 200 with the origin header. A bearer call with a bad token answers 401 with the origin header. Another origin answers 403. The site's own call answers 200.
- **In the app (WKWebView, iOS 27 simulator).** A probe page in the app calls staging. Before the deploy, both calls fail with `TypeError: Load failed` (CORS). After it, `/api/status` answers 200, and the bearer call passes its preflight and answers 401, which the page can read.
- **The real staging app.** It keeps its local saved game across a reinstall. "Log in" opens the sign-in page from staging: the email code and the staging test-account form show, and Google and GitHub do not.

The owner signed in to the staging test account P3 (`playtest-p3@kingdown.example`) in the app on 2026-11-08. Test player P2 played the other side in its saved staging browser session (`playtest/driver/kd.mjs p2`).

## Answer

Yes. Online play works in the app against staging (iOS 27 simulator, staging build, 2026-11-08):

- **Invite.** In the app, Menu > A friend > Start game makes the invite. Its link is `https://kingdown-staging.vercel.app/j#<key>` (the site, not the app origin), and Copy puts it on the pasteboard. P2 opens it, sees `playtest-p3-bot` as the opponent and joins as Black. The app's invite page shows the board without a tap, 20 to 40 seconds after the join.
- **Moves both ways.** White e2-e4, Black e7-e5, White d2-d4, Black e5xd4. Each move reaches the other side within seconds, with its animation and the painted figures.
- **Background return.** The app goes to the Home Screen after its move. P2 captures 46 seconds later. After 2 minutes 7 seconds in the background, the app comes back in the same process (no restart), and within about 2 seconds it shows the capture and "Your move."
- **End.** The app resigns (Menu > Resign > Resign). The app shows "You lose · Casual · You resigned." P2 shows "Black wins · Resignation" and the full move list.

Seen on the way, for the redesign (no ticket): the page zooms in when the staging test-account Email field gets focus. iOS does this for a field with a font smaller than 16 px. See "Touch and layout polish" in the map.
