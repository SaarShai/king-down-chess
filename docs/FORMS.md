# The four forms

King Down has four forms. All four build from this repository and one rules engine.

| Form | What it is | How a change goes live |
|---|---|---|
| Web app | The site at kingdown.dev (`src/interface`) | The publish (`tools/deploy.sh`) |
| ChatGPT plugin | The server at `/mcp` and the board screen (`src/plugin`) | The publish, then the rules of OpenAI below |
| Muse connector | The server at `/muse/mcp` (`src/muse`) | The publish |
| iOS app | The web build, frozen into a binary ([IOS.md](IOS.md)) | A new build, then App Review |

One publish puts the web app and the two servers live together. The iOS app changes only with a new build.

## A run of changes

1. Make one pull request for the run. It changes each form that the run touches.
2. Put the forms list below in the pull request text.
3. Publish one time for the run.
4. Make one iOS build for the run, not one for each change.

## The forms list

Copy these lines into the pull request text. Write `changed`, `no change` or `later: <ticket>` on each line.

- Web game screen (`src/interface/play`):
- Plugin board screen (`src/plugin`): the two screens are separate code, so a change to one does not reach the other. The account pages of the website (`/play`, `/g/<id>`) run the plugin screens (`src/online/entry.ts` loads them with the browser host of `src/online/runtime.ts`), so a change to a plugin screen reaches these pages too.
- Tool text (`src/plugin/server.ts`, `src/muse/tools.ts`): written by hand.
- iOS app: does the run need a new build or new App Store screenshots?
- ChatGPT listing (`docs/submission/package`): the text, the skills and the pictures.

## When each change goes live

- Rules, server behaviour and the text that a tool returns: at the publish, in the web app and the two servers.
- A ChatGPT tool description: at the daily scan of OpenAI, or when the owner selects Rescan in the portal. The scan must pass its checks; until then, the old description stays live.
- A new or renamed ChatGPT tool: after the review of OpenAI, with no publish step. Add no tool and rename no tool unless the run needs it, and keep the live tools in operation during the review.
- A change to the listing ZIP: after the review of OpenAI. The owner then publishes the new version.
- The iOS app: after App Review.
- A Muse tool or its text after approval: Meta reviews the tools of a connector, and the project records hold no rule for a later change. Ask Meta before the first such change.

## Old iOS builds

The server does not refuse an old iOS build. Each game stores the fingerprint of its engine, and the server checks each turn when the player sends it.

The game screen makes its list of moves with the engine of the installed build (`src/interface/play/turn.ts`). Thus, when newer rules permit a move that the old engine does not have, a player with an old build cannot select that move. Only the old board (`src/plugin/screens/board.ts`) gets its previews from the server. See item 4 of "Where the decision cannot hold as written" in [the people-controller spec](specs/people-controller/spec.md).

- Before a rule change goes live, do an old-app check: play an online game on the build that is in the App Store.
- A solo game keeps the rules of its build.
- `src/api/ios-build-8-replies.test.ts` fails when a server reply type loses a field that the App Store build reads, `/api/status` included (top-level fields and list items only). The routes in `src/api/http.ts` return these types, so the type check fails when a route drops a field. Keep the old fields until the old builds are gone.

## The check

`tools/forms-drift.test.ts` runs in `npm test`. It fails when a released piece has no web name equal to its engine name or no Guide note, when a king power or a dealt card has no short line with text in the web game, or when the plugin tool text states a hand size or a switch count that the code does not have.
