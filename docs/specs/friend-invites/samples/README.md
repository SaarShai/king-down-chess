# Friend invitation samples

These are static samples for owner approval. They use fake people, games, codes and times.
They do not sign in, call a game API, copy a code or open a share sheet.
Controls move between fixed samples. Product behaviour still needs the build tickets.

## Source and look

The page imports `src/style.css` through the actual plugin CSS.
It also imports the shared account content CSS and the existing setup and friend styles.
It uses the current Cinzel and Alegreya Sans fonts, colour tokens and painted assets.
The old friend-code sample confirms the visual family. Current CSS takes precedence over that older sample.
New game keeps the current level slider, design choice and Army section.
The online setup keeps Game options and Join with a code. It adds no time selector.
The sample CSS adds layout only. The product files stay unchanged.

## Serve and capture

Run from this worktree. Use the installed packages and browser. Do not install anything.

```sh
nohup python3 -u docs/specs/friend-invites/samples/serve.py > /tmp/friend-invites-server.log 2>&1 &
echo $! > /tmp/friend-invites-server.pid
node docs/specs/friend-invites/samples/capture.mjs /tmp/friend-invites-output
kill "$(cat /tmp/friend-invites-server.pid)"
```

The server uses only `127.0.0.1:4322`. Stop only the PID that this command starts.
If that port is in use, stop this task. Do not stop another server.
Open `http://127.0.0.1:4322/docs/specs/friend-invites/samples/index.html`.
Add `?screen=` with one of the IDs below.

| ID | Screen |
| --- | --- |
| `new-game` | New game with the online A friend entry |
| `friend-setup` | Online setup before the friend choice |
| `friend-picker` | Recent opponents, follows, handle field and open-link choice |
| `picker-named-only` | The named-only alternative |
| `sender-games` | The sender's invitation row |
| `recipient-games` | The friend's invitation row |
| `game-limit-send` | Five games at send |
| `game-limit-accept` | Five games at Accept; the invitation stays open |
| `invite-limit` | Two pending named invitations |
| `open-link-limit` | Two open link invitations |
| `link-share` | An open link for a person with no account |
| `named-share` | A link that only rowan can accept |
| `sign-in` | A static sign-in entry; no sign-in runs |

The capture writes `manifest.json`, `sample-checks.txt` and `shots/` to its output folder.
It makes 375×812 and 1280×800 PNGs for each screen.
Both picker choices also get 320×568 captures at the top and after scroll.
The first 320×568 view keeps Send invitation in view. Scroll the body to reach the handle field and link choice.

## Evidence and limits

The capture checks fonts, images, page errors, horizontal overflow, Back width and footer bounds.
It blocks all non-local requests. It checks the local route, fake handle lookup and selection.
The fake exact handle `finch` returns one result. Other typed handles show Player not found.
The render pass produces 13 screens and 30 PNGs. All capture checks pass.
A visual pass checks the phone, small picker and desktop sheets. The design detector reports no findings.

This is render evidence. It is not evidence for authentication, storage, races or limits on a server.
It does not render an actual ChatGPT host, a native share sheet or a live sign-in provider.
The shared game screens appear as a website page. The app build must also check composer space.
