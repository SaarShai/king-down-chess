# Faster first load, installable, offline, ready for a public host

Work of 2026-10-02 (branch `claude/perf-installable`). What changed, how it was measured, and the
owner's one-time steps to put the game on GitHub Pages.

## In plain words

- **The painted game starts sooner on a phone.** Before, every visitor downloaded the whole 3D clay
  engine too, even though the painted look never uses it. Now the clay engine downloads only when a
  player picks the clay look in Settings.
- **The game installs and works offline.** On a phone, "Add to Home Screen" (or the browser's
  Install button) puts King Down on the home screen with the painted ivory king as its icon. After
  one visit, the game opens and plays with no connection.
- **Updates reach players on their next visit.** Each build carries a version made from its files.
  When a new version is published, a returning player gets it on that same visit; the old copy is
  only used when there is no connection.
- **The published game is 15 MB instead of 47 MB.** Graphics-study models that no game page loads are
  no longer published. They still work in development (`npm run graphics:study`).
- **It is ready for GitHub Pages**, at `https://saarshai.github.io/king-down-chess/`, by one manual
  button press after the one-time setup below. Nothing has been published.

## Before and after

Measured with `tools/measure-load.mjs`: a fresh browser profile each time (nothing cached), a
390×844 phone screen, the processor slowed 4×, and a slow mobile connection (1.6 Mbps down,
150 ms round trip). Median of three runs. "Board ready" is when the pieces are drawn; "first move" is
when a tap on a pawn and its target, made right then, shows in the move list.

| | Before (main) | After |
|---|---|---|
| Painted: board ready | 15.2 s | **12.9 s** |
| Painted: first move made | 16.4 s | **14.1 s** |
| Painted: downloaded before the first move | 2.45 MB | **2.06 MB** |
| Clay: board ready | 32.4 s | 27.5 s (30.4 s without the offline cache) |
| Clay: downloaded before the first move | 5.18 MB | 4.2–4.8 MB |
| Script the browser must run before the board (uncompressed) | 1,004 kB | **220 kB** |
| Second visit, painted: board ready | 2.8 s | 2.5 s |
| Reload with no connection | fails ("no internet") | **works** (painted 2.8 s, clay 8.8 s) |
| Size of the published build | 47 MB | **15 MB** |

Raw numbers: [before.json](before.json), [after.json](after.json).

What the numbers mean:
- Painted is 2.3 s faster to the first move on a slow phone. The clay engine (about 200 kB
  compressed) no longer competes with the painted art, and the phone no longer has to read and start
  a 1 MB script.
- The remaining 2 MB is almost all the painted figure art (twelve 1536×1024 sheets plus the stone
  board). At this connection speed that alone takes about 10 s. See "Next steps".
- Clay varies a lot from run to run (20–33 s in both builds) because each random army needs a
  different set of sculpts. Its difference is within that spread: clay downloads about the same code
  as before, now in two pieces. Clay was never the goal; it must simply keep working.
- The measurement tool switches the offline cache off for one extra run of each look, because the
  browser's simulated slow network does not apply to the cache's own downloads. Those runs agree
  with the normal ones (painted: 12.9 s, 2.06 MB, the same as the normal runs).

## What changed, technically

- `src/render/clay.ts` gathers the clay look (three.js, the clay figures and the voxel fallback models).
  `src/main.ts` imports it dynamically, only when the look is clay. Painted is unchanged and stays the
  default. The voxel model files (`models/*.json`) now load only for clay too.
- `vite.config.ts`:
  - `base: './'`: every address in the build is relative, so the same build works at a site root,
    under `/king-down-chess/` and in `vite preview`. Local dev and the browser tools are unchanged.
  - The build publishes only what the game uses from `public/`: `models/`, the clay sculpts
    `prototype/models/board-*.glb`, the manifest, the icons and the service worker. The study models,
    source guides, atlases and sprite sets (37 MB) stay in `public/` for dev only.
  - It writes `dist/sw.js` from `public/sw.js` with a version (a hash of every published file) and the
    list of files the painted game needs. It adds a small script to the page that registers the
    service worker once the board is drawn. Dev never registers it.
- `public/sw.js` (the service worker): the page is asked from the network first (falling back to the
  cached copy after 4 s or when offline), so a new version shows on the next load. Other files come
  from the cache. A new version installs at once and deletes the old cache. Clay files (about 11 MB)
  are not downloaded in advance: they are cached the first time a player opens the clay look, and
  then that look works offline too.
- `public/manifest.webmanifest` and `public/icons/`: name, colours, and icons cut from the painted ivory
  Frost King (`docs/2d-first-pieces/king-frost/king.webp`, the game's own art; made by
  [make-icons.mjs](make-icons.mjs)). `index.html` gained four head tags (description, theme colour,
  manifest, Apple touch icon).
- `.github/workflows/pages.yml`: builds and publishes to GitHub Pages, **only when started by hand**.

## Putting the game on GitHub Pages (owner, one time)

Nothing is published until you do this.

1. Merge this branch into `main`.
2. On GitHub, open the repository's **Settings → Pages**. Under **Build and deployment → Source**,
   choose **GitHub Actions**. (Pages on a private repository needs a paid GitHub plan; on a public
   repository it is free.)
3. Open **Actions → Publish to GitHub Pages → Run workflow**, keep the branch `main`, and press
   **Run workflow**. After about two minutes the game is at
   `https://saarshai.github.io/king-down-chess/`.
4. To publish a later version, run the workflow again. Players get it on their next visit.

To take it down: **Settings → Pages → Unpublish site** (or turn the source off).

## Checking it yourself

```sh
npm run build && npx vite preview --host 127.0.0.1 --port 5189 --strictPort &
PLAYABLE_URL=http://127.0.0.1:5189/ PLAYABLE_BROWSER=chromium node tools/measure-load.mjs --runs 3
# Updates and offline: a new deployment shows on the next load, and offline works right after it
PLAYABLE_BROWSER=chromium node docs/perf/check-update.mjs
# The same build under a sub-path, as GitHub Pages serves it:
npx vite preview --host 127.0.0.1 --port 5193 --strictPort --base /king-down-chess/ &
PLAYABLE_URL=http://127.0.0.1:5193/king-down-chess/ PLAYABLE_BROWSER=chromium node tools/measure-load.mjs --runs 1
```

## Limits and next steps

- **The painted art is now the slow part.** The figure sheets are drawn at 1536×1024 for every
  screen, and all twelve load even when the army uses eight kinds of piece. Two changes in the shared
  painted scene (`docs/2d-first-pieces/board/scene.mjs`, outside this track) would roughly halve the
  first load on a phone: load only the army's pieces, and a half-size copy of each sheet for small
  boards. Both need a look check, because the art must stay identical.
- The AI's built-in evaluation weights (about 120 kB of source) still load at start through
  `src/ai/` (not changed here: the AI is out of this track's scope).
- The offline cache starts only after a first visit has drawn the board. A player who loses the
  connection in the first seconds of a first visit is not covered yet.
- Tested in headless Chromium only. Installing to a home screen has not been tried on a real phone.
  iPhones support offline play and the home-screen icon but show no Install prompt (use Share → Add to
  Home Screen).
