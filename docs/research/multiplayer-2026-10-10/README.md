# Accounts and multiplayer: research (2026-10-10)

**Status:** Research. Not an approved plan or spec.

Ticket: [01 — Deep research](../../specs/accounts-multiplayer/issues/01-deep-research.md). Spec: [Accounts and multiplayer](../../specs/accounts-multiplayer/spec.md). No build starts before you approve a spec.

## Contents

| File | What it covers |
|---|---|
| [01 · User journeys and UX](01-user-journey.md) | Live and Daily play, the Play menu, invitations, alerts, accounts, the ChatGPT journey, small player pools, UK and EU online-safety law |
| [02 · Ranking, scoring, profiles and awards](02-ranking-and-profiles.md) | Glicko-2 ratings, rating categories, kings' powers in rated play, leaderboards, seasons, profiles, achievements, crowns, fair play |
| [03 · Technical implementation](03-technical.md) | Connection methods, game backends, three architecture proposals and the judge, the data model, clocks and presence, ChatGPT limits, security, costs, the phased build plan |
| [Appendix A · User-journey findings](appendix-a-user-journey-findings.md) | The `ux-*` findings |
| [Appendix B · Ranking findings](appendix-b-ranking-findings.md) | The `rk-*` findings |
| [Appendix C · Technical findings](appendix-c-technical-findings.md) | The `tc-*` findings |
| [Appendix D · Gap findings](appendix-d-gap-findings.md) | The `gap1` to `gap6` findings |

Each appendix gives every finding with its id, the claim, the detail, the source URLs and the checker's verdict (confirmed, corrected, unverifiable, unchecked or added by the checker). The three parts label each recommendation as *common practice* (most products do it), *best practice* (a guideline, standard, law or study supports it) or *our inference*, and cite the finding IDs. A fact that the gap checker added has no ID; the parts name it as a checker fact and give its source link.

## Summary

Most online chess and board games use one simple path: a Play button, three ways to start (the computer, a friend, a stranger), a short wait, the game, and an end screen with Rematch. Most let a new person play a casual game first, and ask for an account only for ratings, saved games and slow games. Sites with few players depend on friend invitations by link and on Daily games, where each player has days for each move and gets an email or phone alert. Chess sites show skill as one number (Lichess and most open-source chess sites use the Glicko-2 method), and many games keep a separate progress track, like King Down's crowns, that never goes down. King Down can do the same: one account and one player pool for the website and ChatGPT, Daily friend games first, the computer always ready, then live games, then open play with ratings and short leaderboards. The technology stays with the two services that King Down already uses: Supabase keeps the accounts and the games, and Vercel runs one game server for the website and ChatGPT. The website board shows a move at once, the ChatGPT board asks the server for news every few seconds, and email or web push tells players that it is their turn. Until OpenAI lists the plugin publicly, invited friends play in the browser; the review can take 1 to 4 months, so we submit the plugin early. UK online-safety law may already cover today's ChatGPT friend games, so the first written UK safety records may be due now. Before players meet online, King Down also needs clear terms and a Report button, and a lawyer must confirm the details. The cost is about $45 a month at 100 players a day; the estimate of $750–1,450 at 10,000 players a day is not measured. Eight decisions below need your answer before the build starts.

## Top 12 recommendations

1. **One account, one player pool and one game server** for the website and ChatGPT; never a ChatGPT-only account or pool. [01 §5.4](01-user-journey.md#54-one-account-on-the-website-and-in-chatgpt), [03 §4](03-technical.md#4-the-recommended-architecture)
2. **Friends and Daily games first**, with Daily as the default for friend invites; live play next; open play and ratings after that. [01 §4](01-user-journey.md#4-daily-games), [03 §9](03-technical.md#9-phased-build-plan)
3. **A Play sheet with three rows:** Play the computer, Play a friend, Find an opponent (two presets, Live 10 + 5 and Daily 3 days per move, plus a list of open challenges); no 11-tile time grid. [01 §3.2](01-user-journey.md#32-the-play-sheet)
4. **One "Your games" list and alerts from the account:** a "your turn" state for each seat drives every list and badge, and email and web push name the opponent and the move. [01 §4.5](01-user-journey.md#45-your-turn-the-move-the-next-game), [01 §4.6](01-user-journey.md#46-notifications)
5. **The computer is always ready:** offer it after 25 s of wait, keep the seek open, label it "Computer", and never rate its games. [01 §3.4](01-user-journey.md#34-find-an-opponent-the-wait), [02 §2.5](02-ranking-and-profiles.md#25-games-against-the-computer)
6. **Glicko-2 ratings:** start 1500, RD 350, "?" while RD ≥ 110; one rating category at launch; the number plus a named band. [02 §2.2](02-ranking-and-profiles.md#22-the-recommendation-glicko-2-updated-after-each-game), [02 §2.4](02-ranking-and-profiles.md#24-rating-categories)
7. **Short, kind leaderboards:** top 10, your own window and your friends; entry after 20 rated games; quarterly season badges later (phase 5); the rating never resets. [02 §3.3](02-ranking-and-profiles.md#33-recommendation-for-a-small-player-base)
8. **One fixed rated ruleset:** the full random piece pool, no kings' powers at launch, random colours; friend games casual by default; every game records each seat's power. [02 §2.3](02-ranking-and-profiles.md#23-rated-and-casual-games), [02 §2.12](02-ranking-and-profiles.md#212-kings-powers-and-rating-fairness)
9. **Crowns stay the progress track:** crowns from computer wins and from finished online games (at most 3 a day); achievements are feedback only; no XP, streaks or daily-login rewards. [02 §5.4](02-ranking-and-profiles.md#54-how-awards-fit-crowns-piece-unlocks-xp-and-levels), [02 §8](02-ranking-and-profiles.md#8-anti-patterns-and-ethics)
10. **The database is the truth:** Supabase Postgres holds each game, Realtime pings are only hints, and every client reads the revision again on open, on return and on a gap. Fix account deletion and pin engine versions before the first online game. [03 §6.2](03-technical.md#62-revisions-retries-and-resync), [03 §5.9](03-technical.md#59-engine-versions-and-storage-size), [03 §8.8](03-technical.md#88-account-deletion-and-export)
11. **ChatGPT uses read-only polling**, shows a "slow connection" message with a way to continue on kingdown.dev when polls fail (a poll with no answer after 10 s counts as failed), keeps the position and the opponent's handle away from the model, and sends invitees to the browser until the public listing. [03 §4.5](03-technical.md#45-chatgpt-flow), [01 §6.8](01-user-journey.md#68-who-can-use-the-king-down-plugin)
12. **Safety and privacy:** the first UK risk records now, because today's ChatGPT friend games may already be in scope; before players meet, unique handles and preset icons (no real names or provider photos), fixed preset messages only, one Report flow with an intimate-image path, and the terms. [01 §5.7](01-user-journey.md#57-age-safety-and-the-law), [03 §8.10](03-technical.md#810-online-safety-law-the-uk-and-the-eu)

## Roadmap

The phases come from [part 03, section 9](03-technical.md#9-phased-build-plan). Its table maps every "MVP" item of part 01 and every "Launch" item of part 02 to a phase. Each phase ends only when its checks pass. Visual work waits for your yes on a rendered sample, and every public deploy waits for your word.

| Phase | On the website | In ChatGPT | Main technical work | Checks |
|---|---|---|---|---|
| **0 · Measure** (about 1 week) | No change | No change | Your decisions. Supabase Pro with the spend cap on and an alert at about 4 M Realtime messages a month; the Postgres version. A spike: move-to-screen time from two regions; a 30-minute soak test of the board on ChatGPT web, macOS, iOS and Android, once at the default approval level and once with "Always ask"; the presence tool; `wss://`. Your plugin-sharing test. If King Down has UK links, the illegal content risk assessment and the children's access assessment for today's ChatGPT friend games. Registration with the NCA reporting portal. Drafts of the other UK records and the terms; the DSA question to a lawyer | The numbers are in the spec. Each ChatGPT client has a pass or a fail. Your answers are recorded. The first two UK records exist, or a record says why King Down has no UK links yet |
| **1 · Friends and Daily** (early access) | Handle and icon. Play a friend (Daily by default). Join page with "Play now in the browser". A server board with End turn. "Your games" and "Your turn (N)". Resign, draw, abort, preset messages, Report. Email turn alerts. Follow, block, privacy settings. Terms and safety pages | "Is it my turn?" (`kingdown_games`) and Next game. Join by link or short code. Resign, draw, claim, presets, Report, Open in App. The model gets no position in games between people. The plugin goes to review at the end of the phase | The deletion fix. The engine archive (G1, G2). Shared game tables. One Vercel project with `/api`, `/mcp`, `/authorize`, `/internal`. The pgmq outbox, Resend, a 1-minute deadline sweep. The Report flow with an intimate-image choice (take-down within 48 hours), the NCA escalation path and a hold on reported data. The four UK records, updated for the multiplayer launch | The opponent keeps the game after a player deletes the account. A game survives an engine deploy. A website player and a ChatGPT player finish a Daily game on desktop, iPhone and Android. A retried command applies once. An unchanged poll writes nothing and takes under 100 ms. A missed deadline ends the game within 2 minutes. A deleted account keeps its data under a report hold until the hold ends. The four UK records exist, updated for the multiplayer launch, before the first player outside the testers |
| **2 · Live** | Live friend games with server clocks, presence and "Claim the win". Guests in live casual friend games. Web push with a priming card. Screen Wake Lock | Live games only with both boards open, at 15 + 10 or slower. "Online (ChatGPT)" in presence | The Realtime trigger and policy. A Web Worker heartbeat (G4). Clocks, the lag quota and one deadline function (G7). A 5 s live sweep. Warm workers and a compact state. Anonymous sign-in with Turnstile. Monitoring | p95 from commit to the opponent's screen under 500 ms from two regions. No lost or doubled move after 30 s offline. A flag ends the game within 1 s of a claim. A deploy drops nothing. A guest cannot make a rated game |
| **3 · Open play and ratings** | Find an opponent (Live 10 + 5, Daily, Either). Open challenges. The computer while you wait. Ratings with "?" and bands. Leaderboards. Profile rating cards and the Daily finish rate. A public page on request | Find an opponent with Daily first (no fast live play). The score card and the leaderboard card | A `seeks` table with pairing under a lock. `player_ratings`, `rating_history` and `glicko2-lite` in the finish transaction. Abuse guards. Boards with a 60 s cache. Fair-play signals | 20 seeks at the same time give no double pairing. Ratings match the `scalachess` values. Aborted, self-play and flagged games stay unrated. The board query takes under 50 ms on 100,000 rows |
| **4 · Awards and the public launch** | Achievements and the showcase. Crowns from online games. The Paladin unlock step. Each player's own record with each power; then win rates for each power, adjusted for the players' ratings, after 50 human games for a power (phase 4 or later). The public launch on your word | "Play in ChatGPT" on the join page when the listing is live. Recent achievements in the score card | The achievements module and a nightly re-check. The move archive. A "stuck games" view | Each award comes once. The online-crown cap holds. A finished game uses about 1 KB. The ChatGPT review checklist passes |
| **5 · Later** (behind flags) | Vacation, seasons, weekly leagues (at about 50+ weekly rated players), events, spectators, card mode, a Powers rating category | A Realtime ping; host subscriptions when ChatGPT offers them | Split rating categories. The penalty ladder and refunds. Tournaments. Durable Objects only if a trigger fires | Triggers: p95 above about 500 ms, peak sockets near 400, Realtime overage above about $100 a month ([03 §11.3](03-technical.md#113-when-to-choose-another-option)) |

**One plan in all three parts.** The parts now use one phase plan, the plan of part 03: 0 Measure, 1 Friends and Daily, 2 Live, 3 Open play and ratings, 4 Awards and the public launch, 5 Later. Part 01's "MVP" items and part 02's "Launch" items each name their phase, so an MVP item can come in phase 4, for example crowns from online games. Weekly leagues are in phase 5. The parts also agree that achievements are written just after the commit, through the outbox; that ChatGPT boards use read-only polling, with a direct path only after tests pass on all four ChatGPT clients; and on the terms "handle" and "Daily game".

What still differs:

- **Cost at 10,000 players a day.** The judge quotes the P1 proposal: $450–800 a month. Part 03 §10 adds the Vercel CDN lines and gives $750–1,450. This page uses the part 03 figure.
- **One open check.** Part 03 asks whether a custom MCP server that an admin publishes to a workspace reaches the ChatGPT iOS and Android apps (section 11, question 26). The phase-0 soak test answers it.

## Decisions for the owner

The three parts list 54 decisions ([01 §11](01-user-journey.md#11-decisions-for-the-owner), [02 §9](02-ranking-and-profiles.md#9-decisions-for-the-owner), [03 §12](03-technical.md#12-decisions-for-the-owner)). Many repeat each other. This page merges them into 8, most important first. Each decision names the section decisions that it replaces, so you answer each one once.

### 1. Build on Supabase and Vercel (architecture P1)

**Question.** Do we keep Supabase Postgres as the one game authority, with one Node game service on Vercel for both surfaces, Realtime pings on the website and polling in ChatGPT?

- The judge gave P1 44 of 50 points, P2 (Cloudflare Durable Objects) 36 and P3 (Nakama) 32. P1 adds no new server and reuses the match service that passed live tests on desktop and iPhone.
- About $45 a month at 100 players a day. Supabase Free pauses after one inactive week and has no backups; Pro with the spend cap allows 500 Realtime connections and 5 M Realtime messages a month. With the cap on, Supabase refuses messages above 5 M until the next billing cycle, so pings stop and the fallback poll carries live games. 100 players a day use about 0.9 M.
- The ChatGPT server address cannot change after OpenAI's review.

**Our pick.** P1 with the judge's grafts G1–G10. Supabase Pro with the spend cap on and an alert at about 4 M Realtime messages a month; remove the cap when peak connections near 400 or messages near 4 M a month. Move the ChatGPT server to `kingdown.dev/mcp` and the consent page to `kingdown.dev/authorize` now. Read-only polling in ChatGPT; a socket path only after tests pass on all four ChatGPT clients. Daily backups first; point-in-time recovery (about $100 a month) later. No spectators at launch.

**If you say yes.** Phase 0 starts: the move to Pro, the message alert, a check of the Postgres version (15.1.1.61 or later for jobs that run more than once a minute), and the one-week spike. We move to Durable Objects only if p95 move-to-screen time passes about 500 ms or peak sockets come near 400.

*Replaces:* part 03 T1, T2, T3, T9, T14, T15.

### 2. Release order: friends and Daily games first

**Question.** Do we release in four phases, with Daily friend games first and Daily as the default speed for friend invitations?

- 11 of 14 small digital board games checked offer asynchronous play, because it does not need two players online at the same time. King Down expects tens to a few hundred players online at launch.
- ChatGPT cannot alert a player. Supabase's built-in email sends 2 messages an hour and is "not meant for production use"; Resend is free up to 3,000 emails a month and costs $20 for 50,000.
- A 3-day default sits between Lichess (2 days) and Game Center (7 days).

**Our pick.** Phases 1 to 4: Friends and Daily; Live; Open play and ratings; Awards and the public launch. Daily is the default for friend invites, and Live is one tap away. 1, 3 or 7 days per move, 3 by default. Resend email and web push for alerts. No vacation at launch. New friend games use server invitations; old link games still open.

**If you say yes.** Phase 1 builds casual Daily friend games on both surfaces, with email alerts. Ratings wait for phase 3. We open a Resend account and make the web-push keys.

*Replaces:* part 01 decisions 2, 4, 8, 11, 12, 15; part 03 T4, T11, T12.

### 3. UK and EU online-safety work, starting now

**Question.** Do we treat King Down as a UK user-to-user service now, write the first safety records in phase 0, and finish the safety work before players outside the testers meet online?

- The Online Safety Act has no size exemption. Moves and handles count as user content, and today's ChatGPT friend games already let one player's moves reach another player. If King Down has UK links, the three-month windows for the first assessments may already run (Ofcom guidance, para 2.19).
- Ofcom fined 4chan £20,000 in October 2025 for an unanswered information notice, and in March 2026 £50,000 for a missing risk assessment, £20,000 for its terms and £450,000 for missing age assurance. The maximum fine is £18M or 10% of qualifying worldwide revenue (Schedule 13, para 4).
- A preset sent to one opponent can count as a direct message in Ofcom's Code, so presets alone do not keep the grooming risk low. "18+" in the terms without highly effective age checks does not remove the children's duties. OpenAI expects plugin users aged 13 to 17.

**Our pick.** Yes, with a lawyer's check. Write the four UK records: an illegal content risk assessment, a children's access assessment, a children's risk assessment, and a record of measures that names you as the accountable person. Register with the NCA reporting portal before any report, and keep reported data for one year and the report reference for five years. Publish terms, a "Safety and reporting" page and a contact page. Build one Report flow with statements of reasons, appeals and an intimate-image path with take-down within 48 hours. Preset messages only, each a fixed phrase with no free field, number or link; the risk assessment records why the grooming risk is low. The terms state a minimum age of 13, and King Down asks no age. A lawyer settles the EU DSA scope; no EU targeting until then.

**If you say yes.** Phase 0 finishes the illegal content risk assessment and the children's access assessment (if King Down has UK links), registers with the NCA, drafts the other records and the pages, and sends the DSA question to a lawyer. Phase 1 builds the Report flow, the owner queue and the report hold, and finishes the four records before the first player outside the testers. Each later significant change gets a further assessment before it goes live.

*Replaces:* part 01 decisions 7, 14; part 02 D20; part 03 T18, T19.

### 4. ChatGPT: the browser first for invited friends, an early submission

**Question.** Do invited friends play in the browser until OpenAI lists the plugin, with the plugin submitted for review at the end of phase 1?

- Today a second person can add the private plugin only by hand, on ChatGPT on the web, as a custom MCP server with an "elevated risk" warning. No share link exists for personal accounts. OpenAI removed the "restricted to developer MCPs" chat block in late September 2026, so built-in apps work again in the same chat; the setup stays manual, so the pick does not change.
- Review takes 30 to 120 days in community reports. It needs identity and domain verification and a demo login without MFA.
- ChatGPT sends no signal when a board closes, and each call adds host delay (about 1–3 s, low confidence).

**Our pick.** The join page shows only "Play now in the browser" until the listing is live, and then adds a direct link to the listing. Submit at the end of phase 1. Live games in ChatGPT only with both boards open, at 15 + 10 or slower, with a 2 s delay credit for each turn. A separate presence tool every 25 s; if it causes approval prompts, the clock decides instead. Testers on phones also use the custom-server path, because a plugin that a workspace imports from a marketplace or by GitHub sync is Desktop only. The help text suggests "Allow read actions" or higher, because "Always ask" can make even a poll ask for approval.

**If you say yes.** Phase 1 ends with the listing package and a one-page guide for testers. "Play in ChatGPT" appears on the join page when OpenAI publishes the listing.

*Replaces:* part 01 decision 13; part 03 T8, T16, T17.

### 5. Rules for online play

**Question.** Do these rules hold online: one clock turn for a Haste turn, a first rematch that repeats the setup, and the Lichess disconnect and abort rules?

- A Haste turn has two actions. Game Center and Root count time per turn, not per action.
- Lichess allows a claim after 30 s times a speed factor (1, 2, 4 or 10); for a 10 + 5 game that is 2 minutes. Lichess gives Chess960 1.5 times the first-move time of chess, about 45 s in a rapid game; King Down also has a random back rank.
- Lichess repeats the Chess960 position in the first rematch, so each player plays both sides of one setup.

**Our pick.**

- Time per turn: the clock runs until the turn passes, the increment comes once, and the opponent gets one alert.
- Live games send each action at once. On the website, a Daily turn is staged, and End turn sends it as one command. ChatGPT sends each action at once.
- The first rematch repeats the back rank and the kings with the colours swapped; the next rematch deals a new setup.
- Away after 25 s (website) or 60 s (ChatGPT). A claim after 30 s times the speed factor, at least 60 s for a ChatGPT seat. A 45 s first-move timer. Abort until each side has completed its first turn. Both players gone: a draw with no rating change. You can tune the numbers later.

**If you say yes.** We record these rules in the accounts and multiplayer spec. Phase 1 builds the turn rule for Daily games; phase 2 builds the clocks and the disconnect rules in one tested deadline function.

*Replaces:* part 01 decisions 3, 10; part 03 T5, T6, T7.

### 6. Ratings and leaderboards

**Question.** Do we rate games with Glicko-2 in one shared category for live and Daily games, and show a number with a named band on short leaderboards that only established players enter?

- Lichess, PyChess and OGS use Glicko-2: start 1500, RD 350, "?" while RD ≥ 110.
- Common practice is a separate Daily rating, but each split divides a small player base (OGS reports weak ratings across 16 categories), and crossplay needs one shared rating.
- The Lichess board gate (30 games, RD < 75) leaves a small board almost empty; Chess.com asks for 20 games, a game in 90 days and an account 7 days old.

**Our pick.**

- One category for live and Daily games. Card mode and a later Powers category get their own.
- The number with "?" while it is provisional, and a band name after placement. Proposed names: Pike, Steed, Cross, Rock, Thorn, Monarch; you choose.
- Board gate: no "?", 20 or more rated games, a rated game in the last 30 days, an account at least 7 days old. Players show by handle by default, with "hide me". Raise the gate when more than about 100 players qualify.
- Quarterly season badges in phase 5; the rating never resets. Weekly leagues in phase 5, only at about 50 or more weekly rated players.
- Games against the computer stay unrated, and the computer always carries a label. ChatGPT games count under the same rules (low confidence; revisit if cheating reports appear).
- The Daily finish rate becomes public after 10 finished Daily games. Automatic short timeouts for abort, leave and stall; cases of computer help go only to your review.

**If you say yes.** Phase 3 builds the rating tables, the update in the finish transaction, the boards with a 60 s cache and the profile rating cards. You name the bands before phase 3.

*Replaces:* part 01 decisions 5, 6; part 02 D1, D2, D3, D8, D9, D10, D11, D12, D15, D16.

### 7. The rated ruleset: pieces, kings' powers and colours

**Question.** Do rated games use one fixed ruleset: the full random piece pool, no kings' powers at launch, and random colours?

- The balanced powers still spread 42–57% in depth-3 engine games: about −56 to +49 Elo, or 4 times the Lichess colour term of 12 Elo. Nothing measures a power against no power.
- Of 14 products with unequal sides, none fits a term for each faction into one shared rating; about 9 keep one rating for each mode.
- Friend games are the main path for boosting, and a chosen colour in a rated game makes boosting easier.

**Our pick.**

- Rated games use the full random pool (Paladin included) and no powers at launch. Every online game records each seat's power, or "none".
- First, show each player their own record with each power. Then publish human win rates for each power, adjusted for the players' ratings, after 50 human games with that power. Raw rates would mislead, because matchmaking by rating pulls them toward 50% (Blizzard adjusted its StarCraft II rates for this reason in 2010).
- In phase 5, one "Powers" rating category with the balanced readings only, seeded from the King Down rating with a large RD. Both players take a power through a hidden pick at the same time. This is a rules change: today either side may play without a power. Before phase 5, compare this category with one shared category that records the power, because each extra rated pool has a cost.
- Friend games are casual by default. They are rated only when both players agree, with at most 3 rated games a day for each pair.
- Colours are random in pairing and in rated games; the creator chooses in casual friend games; colours swap in rematches. The colour term stays 0 until rated human games exist.

**If you say yes.** The first schema (phase 1) stores the power, the readings and the colour of each seat. Rated play starts in phase 3 on this ruleset. The power records and statistics come in phase 4 or later. The Powers category waits for phase 5 and for your rules decision on "both players take a power".

*Replaces:* part 01 decision 9 (the rated pool); part 02 D4, D5, D6, D7, D19.

### 8. Accounts, guests, profiles and crowns

**Question.** Do we let guests join only through a friend's invite link, replace real names and photos with a handle and a preset icon, and give crowns for finished online games?

- Today `profile_name()` copies the Google, GitHub or Facebook name and photo into the public profile. Ofcom names location, profile data that shows a child, and users without accounts as risk factors.
- Guest play is common (3 of 7 live chess products and 3 of 4 board sites checked), and guest games are never rated.
- Today crowns come only from computer wins. The Paladin is back in the random pool since 2026-10-09, but it is not in the unlock ladder.

**Our pick.**

- Guests: on the website only, through an invite link to a live casual friend game, with Turnstile, no public profile, and cleanup after 30 days.
- Profile: a unique handle at the first sign-in, a preset icon, no flag, no provider name or photo. A public page only when the player turns it on.
- Crowns: from computer wins at Casual or stronger, and from finished online games that pass the abort and early-end rules, at most 3 online crowns a day. The browser writes crowns from its own computer games; the server writes the rest.
- Casual friend games use the union of both players' unlocks. The Paladin is the last unlock (for example at 14 crowns); after it, crowns open cosmetics. No XP, levels or streaks.

**If you say yes.** Phase 1 ships handles, icons, the privacy settings and the deletion fix. Phase 2 turns on anonymous sign-in for guests. Phase 4 adds online crowns, and `docs/PROGRESSION.md` gets the Paladin step.

*Replaces:* part 01 decisions 1, 9; part 02 D13, D14, D17, D18; part 03 T10, T13.

## Method and limits

### How the research ran

1. **15 research topics**, in parallel, each with an independent checker who read the primary sources:
   - 6 on user journeys: live play, asynchronous play, other game types, games inside host apps, guidelines, accounts (`ux-*`);
   - 4 on ranking and profiles: rating systems, ladders and leaderboards, profiles and awards, fair play (`rk-*`);
   - 5 on technology: connections, game backends, data, the ChatGPT platform, identity and security (`tc-*`).
2. **3 architecture proposals and a judge.** P1 reuses the current stack, P2 puts real-time play first on Cloudflare Durable Objects, and P3 adds the Nakama game backend. The judge scored each on ten criteria and added ten grafts (G1–G10) to the winner.
3. **A completeness critic** found what the first drafts missed.
4. **6 gap studies:** gap1, who can use a ChatGPT plugin; gap2, tool-call limits and sockets in the ChatGPT board; gap3, ratings in games with unequal sides; gap4, the speed and reliability of Supabase Realtime; gap5, small digital board games; gap6, UK and EU online-safety law.
5. **A revision pass** added the gap findings and removed contradictions between the three parts.
6. **A gap check** (2026-10-10): a checker read all 100 gap findings against their sources, and the three parts now use the checker's verdicts.

### Claim checks

| Measure | 15 research topics | 6 gap studies |
|---|---|---|
| Findings kept | 550, with the 72 that a checker added | 100, plus the 23 facts that the checker added |
| Confirmed by a checker | 373 | 71 |
| Corrected by a checker (the parts use the corrected form) | 98 | 26 |
| Added by a checker | 72 | 23 (the parts cite them as checker facts, with a source link) |
| Unverifiable | 6 | 3 |
| Unchecked | 1 | 0 |
| Refuted | 0 (the parts use no refuted finding) | 0 |

### What was not verified

- **3 gap findings stay unverifiable:** gap1:F9 (plugins do not run with Pro models), gap1:F10 (plugin availability in the EU/EEA, the UK and Switzerland) and gap3:F10 (the rating and the bid for sides in digital Twilight Struggle). The parts mark them as unconfirmed. The Check column of appendix D shows these verdicts.
- **Search limits.** The shared web-search budget ran out in each research thread; after that, researchers read only pages with known addresses. help.openai.com, openai.com and the ChatGPT directory returned 403. Some Help Center facts, for example the four approval levels, come only from search snippets.
- **Not measured:** the move-to-screen time through Supabase Realtime from the players' regions (only Supabase's own benchmark inside AWS: median 46 ms, p95 132 ms; Supabase does not publish how it measured these figures); ChatGPT tool-call timeouts and rate limits (OpenAI publishes none); the cost model at 10,000 players a day; the memory of one engine worker. The status-page uptime (99.93% in 2025, 99.92% in 2026) can undercount, because some Realtime incidents have no component marked.
- **Not tested:** the ChatGPT Android app; `wss://` or SSE in a published ChatGPT board; approval prompts from the presence tool, and polls with "Always ask"; whether a custom server that a workspace publishes reaches the iOS and Android apps; plugin sharing between personal accounts; plugin availability in the EU/EEA, the UK and Switzerland. Phase 0 tests most of these.
- **Community sources only:** the review time of 30–120 days, the host delay for each tool call, blank boards in the ChatGPT Android and iOS apps, plugins with Pro models, and plugins in voice mode.
- **Engine data, not human data:** White's edge (+24 ± 34 Elo in a 200-game engine run) and the 42–57% spread of the powers. Engine games overstate human edges. Human numbers need rated games.
- **Law:** the parts read UK and EU law from primary texts, but this is not legal advice. A lawyer must confirm the scope of the Online Safety Act, the minimum age and the scope of the DSA. Ofcom gives no number for a "significant number" of UK users, so phase 0 first checks whether King Down has UK links today.

### Facts that can change soon

- **Prices,** read on 2026-10-10: Vercel (Pro, invocations, CPU, CDN requests, Flat Rate CDN), Supabase (Pro, Realtime messages and connections, egress, compute), Resend and Postmark.
- **Beta and trial features:** the Supabase OAuth 2.1 server, manual identity linking and passkeys; Vercel Functions WebSockets; Sign in with ChatGPT (a limited trial for selected partners).
- **ChatGPT platform rules and behaviour:** the review rules and the review time; the commerce rules for plugins (no ads, no upsell, no checkout or upgrade links); the approval levels; "Desktop only" for imported workspace plugins; picture-in-picture support (two OpenAI pages disagree); the Developer mode rollout; MCP Events (Work chats only); host subscriptions for boards (only a proposal); regional availability; client bugs that stop board calls for days.
- **Supabase Realtime:** replay fixes reached the main branch on 2026-10-09, with no confirmed date for the hosted service; the supabase-js bug #2613 is open.
- **Law and regulators:** Ofcom's codes (the version of 9 September 2026) and its enforcement; the EU Digital Fairness Act proposal, expected near the end of 2026.
