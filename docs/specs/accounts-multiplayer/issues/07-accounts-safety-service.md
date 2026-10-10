# 07 — Accounts and safety service

Type: task
Status: ready-for-agent
Wave: 2 (after 02) · Model: Opus · Branch: `claude/mp-07`

## What to build

Read part 01 of the report, sections 5 (accounts) and 8.2 (reports), and part 03, sections 8.8 (deletion) and 8.10 (UK duties).

1. `src/online/accounts.ts` (server side, uses the store's pool):
   - handles: validation, a small blocklist (slurs, staff words, title patterns such as `gm_`), `reserved_handles` (old and deleted handles never return), one rename in 90 days;
   - icons: a list of preset keys;
   - privacy settings (`challenge_from`, `online_visible_to`, `quiet_mode`, `accepting_games`, `on_leaderboards`);
   - follow and block (`relations`); a block also hides presets and refuses invites both ways;
   - account deletion: request (7-day grace), cancel on sign-in, status;
   - notification preferences.
2. `src/online/safety.ts`:
   - reports: from a player against a player, a handle or a preset message, with the seven reasons of part 01, section 8.2; "child safety or illegal content" has the intimate-image sub-choice and a 48-hour take-down target; the browser inserts only its own reports;
   - the owner queue: list open reports (child safety first), act (warning, rename, hide, suspension), each action writes `mod_actions` with a statement of reasons; appeals;
   - report hold: `hold_until` for NCA cases.
3. `tools/mod.ts`: a small owner CLI over the same functions (list, show, act, appeal), with the admin database URL from the environment. No admin web page.
4. Website account client helpers in `src/account/` for the new profile fields (no UI).

Ticket 08 adds the HTTP routes; ticket 09 adds the ChatGPT tools.

## Checks

- Database tests: handle rules and reservation; rename limit; a block refuses an invite; a report reaches the queue; an action writes a statement; a hold blocks deletion (with ticket 06's job if merged; else the store check).
- `npm test` passes.

## Comments
