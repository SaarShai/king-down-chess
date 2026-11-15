# Repair the launch platform after two checks

Status: ready-for-human
Type: task

Spec: [Platform](../spec.md). Part [02](02-merge.md) brought the platform work into this tree. Two independent checks then found one blocker, four major faults and twelve minor faults. This part repairs the blocker, the major faults and the small minor faults. The design project's carry list keeps the other minor faults.

## Scope and plan

### The local server with website settings serves the ChatGPT connector again (blocker)

- `tools/plugin-server.mjs`: in local mode, `config` stays unset, as before the platform work. The consent page uses `consentConfig(env)` in a `try`. A fault there turns off only the connector.
- Without this, `plugin:server:check` and `check:vercel` fail with the option off: the start check reads OAuth client rows that a test database does not have.
- Test: `tools/plugin-server-config.test.ts`, local mode with website settings: the connector serves `/mcp`, the consent page names the client, and no client check runs.

### The hand-off dialog is not part of the request (major)

- `src/online/launch.ts`: a solo start, resume, computer turn or Play again ends its request at once with a refusal. The dialog stays open until the player chooses. Before, the 10 s request limit closed the dialog and showed a false connection error. Play again then did nothing, because the timed-out receipt stayed.
- A new game has no online game, so its refusal has no text, and Cancel shows no line. Resume and Play again keep "Your online game stays saved."
- The dialog has a name (its heading) and a description (its text). A second hand-off while a dialog is open shows nothing new.
- Test: `src/online/launch.test.ts`, with the real web transport and fake timers.

### The hand-off keeps the local games (major)

- The hand-off writes through `writeSave`, so the shared owner check applies.
- When the local data belongs to another account, the dialog says so and has no Open control.
- When a local game is in progress, the dialog offers "Continue local game" and writes nothing. This includes the same server game opened a second time.
- The hand-off replaces only no game, an empty game or a finished game. It checks again at the tap, because another tab can start a game.
- Test: `src/online/launch.test.ts`.

### The checks test the default build again (two major faults)

- `tools/privacy-policy.docs.test.ts` checks both privacy pages: `public/privacy.html` (default build) and the launch copy. Each page keeps its own sentences where the two differ.
- `tools/plugin-server-check.mjs`: with the option off, the check again plays a web solo game, a move and a computer turn with real PostgreSQL. `tools/vercel-check.mjs`: with the option off, it again plays the first move of a web solo game.
- The first real PostgreSQL run of these checks after part 02 found three stale expectations. Each now follows the decided behaviour:
  - `tools/plugin-server-check.mjs`: production without OAuth readiness turns off only the connector (M6), so the check expects the website settings refusal, not the old OAuth refusal.
  - `tools/plugin-server-check.mjs`: the friend game of the parked branch gives each player a handle first, as `tools/vercel-check.mjs` does.
  - `tools/vercel-check.mjs`: on the launch tree, the API route check reads only the routes before `handle: filesystem`, and the parked Muse paths are answered by the static 404 page. The 404 status stays asserted.
- Runs: `plugin:server:check` on the default artifact and on a parked artifact, and `check:vercel` on the default tree and on the launch tree, all with a disposable loopback PostgreSQL 17 database.

### Small minor faults

- The hand-off opens `/index.html` with a tab mark for the title skip. The launch worker serves this address offline; it does not serve `/index.html?title=0`.
- Launch legal pages: each top link is 44 px high, the page background is light, and the deletion list reads "ratings and rating history".
- Message headings that the script focuses show no focus frame. A keyboard control keeps its frame.
- `tools/solo-launch.mjs`: the off build stops when the recorder route line changes, so the route cannot stay in the off build by accident.
- Tests: `tools/platform.test.ts`, `src/interface/platform.test.ts` (also the notice mark for a fresh player).

## Verification

Each new or changed test fails on the code before this part (the design project's stage report, Repair). The full suite, the documentation checks and the build pass. The off build equals the off build of part 02, file for file. A browser run on a launch build checks the hand-off after 12 s, Cancel, Play again, resume, the local-save guards, the offline local board, the legal pages and the message headings, at 360 by 640, 390 by 844 and 1440 by 900.

## Comments

No commit, push, pull request or deploy occurs. An independent review remains. The deletion list sentence goes on the counsel list.
