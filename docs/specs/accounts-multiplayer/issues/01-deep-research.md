# 01 — Deep research: accounts, multiplayer, ranking, technical options

Type: research
Status: resolved

Owner request (2026-10-10): research the most common and best user journey for online multiplayer chess and similar games (live and asynchronous), the ranking, scoring, profile, award and leaderboard systems, and the best technical implementation for the website and the ChatGPT plugin.

## Plan

- [x] Read the current code and docs: accounts (`src/account/`, `supabase/`), the plugin match service (`src/match/`, `src/plugin/`), the web menus, `docs/PROGRESSION.md`.
- [x] A multi-agent workflow researches 15 topics in parallel: 6 on user journeys, 4 on ranking and profiles, 5 on technical options.
- [x] Independent agents check the load-bearing claims against primary sources (every technical topic has its own checker).
- [x] Three architecture proposals (reuse the stack, real-time first, a game backend) and one judge.
- [x] One synthesis per area, a completeness critic, gap research, revision, and a summary with the open decisions.
- [x] Review the report myself; fix errors; commit.

## Verification

- Each recommendation cites a source or names its evidence; each technical limit or price has a primary source and a date.
- Checkers mark each load-bearing claim confirmed, corrected, refuted or unverifiable; the report uses only the confirmed or corrected form.
- The report covers live and asynchronous play, both surfaces, and the current code.
- The text follows ASD-STE100.

## Answer

The report is in [docs/research/multiplayer-2026-10-10/](../../../research/multiplayer-2026-10-10/README.md): a front page with 12 recommendations, a phased roadmap and 8 decisions for the owner; three parts (user journeys, ranking and profiles, technical); four appendices with every finding.

Verification (2026-10-10):
- 15 research topics, each with an independent checker: 550 findings kept; 373 confirmed, 98 corrected (the parts use the corrected form), 72 added by checkers, 6 unverifiable, 1 unchecked, 0 refuted.
- 6 gap studies from a completeness critic: 100 findings, then a second checker pass: 71 confirmed, 26 corrected, 3 unverifiable, 0 refuted, 23 added.
- 3 architecture proposals and a judge: P1 (Supabase Postgres + one Node game service on Vercel; Realtime pings on the website, polling in ChatGPT) 44/50, Cloudflare Durable Objects 36, Nakama 32.
- The three parts use one phase plan; the stale cross-section notes are gone. Internal links and anchors resolve (0 bad). The model-name scan (`tools/lib/model-names.mjs`) finds none. `npm run test:docs` passes (74 tests).
- Limits: the report lists what nobody measured or tested (ChatGPT tool-call limits, sockets in a published board, Realtime latency from players' regions) and which facts change soon (prices, platform rules, law). Not legal advice.

Next: the owner answers the 8 decisions; then a spec for phase 0 and phase 1.

## Comments
