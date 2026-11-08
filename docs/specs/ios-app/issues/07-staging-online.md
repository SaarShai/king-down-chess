# Deploy the app origin to staging and play online in the app

Type: task
Status: open
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

Open: steps 2 and 3 need a staging test-account sign-in. The owner types the test password in the simulator (or gives it in chat for the local app), then an agent plays the two-account game and the background return.
