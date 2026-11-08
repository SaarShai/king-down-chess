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
