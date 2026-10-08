# Hosting

The facts for the live site, its domain and the secret files. Every deploy publishes to the world: deploy only what the owner asked to put online.

## Site

- The game is public at https://kingdown.vercel.app and https://kingdown.dev.
- Vercel project `kingdown`, team "Saar's projects", Hobby plan. The Vercel CLI on this Mac is signed in.

## Deploy

- `tools/deploy.sh` is the only deploy path. Do not run the Vercel CLI yourself.
- `tools/deploy.sh` with no flag tests a fresh `origin/main` in a temporary worktree (`npm test`, then `npm run check:browser`) and publishes nothing.
- `tools/deploy.sh --publish` does the same tests, then publishes the tested build with the pinned Vercel CLI and checks the live site: the bundle name and the privacy, terms and delete-data pages.
- The script takes no branch or commit. A commit that is not on `origin/main` cannot go live.
- The tool gate asks before a `vercel` command, a Porkbun API call or a browser visit to the live site or the Vercel dashboard.

## Domain and DNS

- The domain `kingdown.dev` is at Porkbun. Two A records, for `@` and `www`, point to `76.76.21.21`.
- On 2026-10-03 these two A records replaced the parking ALIAS and the `*` CNAME. https://kingdown.dev answered the same day.
- DNS changes go through Porkbun's API (`https://api.porkbun.com/api/json/v3/`, `dns/retrieve|create|delete/kingdown.dev`).
- A DNS change needs the owner's go.

## Secret files

- The folder `.secrets/` in the main checkout holds three files: `kaggle_api_token` (the Kaggle token), `oauth.json` (the OAuth keys) and `porkbun_api.json` (the Porkbun API keys).
- Git ignores the folder. Each file has mode 600. Never print, paste or commit a value.
- `tools/save-secret.sh NAME` stores the clipboard text as a new file in that folder and does not print the value.
