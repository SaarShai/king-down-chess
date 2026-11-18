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
- Plugin board screen (`src/plugin`): the two screens are separate code, so a change to one does not reach the other.
- Tool text (`src/plugin/server.ts`, `src/muse/tools.ts`): written by hand.
- iOS app: does the run need a new build or new App Store screenshots?
- ChatGPT listing (`docs/submission/package`): the text, the skills and the pictures.

## When each change goes live

- Rules, server behaviour and the text that a tool returns: at the publish, in the web app and the two servers.
- A ChatGPT tool description: at the daily scan of OpenAI, or when the owner selects Rescan in the portal.
- A new or renamed ChatGPT tool, and a change to the listing ZIP: after the review of OpenAI. Add no tool and rename no tool unless the run needs it.
- The iOS app: after App Review.
- A Muse tool or its text after approval: Meta states no rule. Ask Meta before the first such change.

## Old iOS builds

The server does not refuse an old iOS build. Each game stores the fingerprint of its engine. When the engine of a game is not the engine of the page, the page gets its previews and moves from the server. Thus an online game with newer rules still plays in an installed app. A solo game in that app keeps the rules of its build. No test covers a change to the shape of a server reply: keep the old fields until the old builds are gone.

## The check

`tools/forms-drift.test.ts` runs in `npm test`. It fails when the web piece names differ from the engine names, when a king power or a dealt card has no short line in the web game, or when the plugin tool text states a hand size or a switch count that the code does not have.
