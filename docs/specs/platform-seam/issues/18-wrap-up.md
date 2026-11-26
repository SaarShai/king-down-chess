# 18. Wrap-up: fast Class A route, share and search files, weekly count, public text

Status: built (2026-11-26). The owner stopped the staging-polish loop; this is the last PR of that work.

## What changed

1. Frame checks. `tools/release/frame-checks.sh` has a path list. When a commit changes no path of that list after a commit with a pass record, `release.sh` and `deploy.sh` use that record again. The list leaves out the lead-read files (`riskyPaths` in `tools/lib/ci-paths.mjs`), so a Class A change does not run `painted-game`.
2. `KINGDOWN_TEST_WEB_ONLY=1 npm run test:changed` drops the plugin test files on a developer machine. PR CI refuses the variable and runs all files.
3. `docs/CHANGES.md` has the section "A 10-minute Class A batch" with the commands.
4. Share tags (Open Graph and Twitter card) and a canonical link on `next.html`, `index.html` and the join page. The picture is `public/share-1200x630.jpg`.
5. `public/robots.txt`, `public/sitemap.xml`, a 308 redirect of the page addresses from `www.kingdown.dev`, and no-index for staging.
6. `tools/release/live.sh games` prints the count of online games for each week. It only reads. It cannot count games against the computer.
7. Public text: the legal pages, the support page and the sign-in line now describe the new Home (`Play a friend`, `Account & settings`, the sign-in picture).

## Left for counsel

- `privacy.html`: "You choose a handle and a preset picture" is out of date for the new page.
- `privacy.html`: the text does not say that a block hides the picture.
- `privacy.html` and `terms.html` do not name Apple sign-in.
- `privacy.html` "Changes": is the new picture text a large change?
- `support.html` says "handle" in three places, not "game name".

## Not proved before release

- That `www.kingdown.dev` is a domain of the host project. If it is not, the redirect does nothing.
- The weekly count ran only on an empty test database.

## Low items, no work planned

- `KINGDOWN_TEST_FILE` with one file in braces, for example `'{tools/platform.test.ts}'`, finds no test files.
- The legal and support pages have no canonical link and no description tag.
