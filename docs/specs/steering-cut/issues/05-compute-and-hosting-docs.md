# 05: COMPUTE.md and HOSTING.md hold the facts; the true shell limit; one deploy path

**What to build:** An agent who needs machine facts opens COMPUTE.md or HOSTING.md, not a long AGENTS.md section. COMPUTE.md holds the Kaggle, M1 and power facts and a pointer to the browser-check runner. It states the true shell limit: a background shell stops at the shell's own timeout or at the session end, so a long run starts detached and gets a separate watch. HOSTING.md holds the hosting and DNS facts, names the secret files and never their content, and names the deploy script as the only deploy path. The two AGENTS.md sections shrink to short pointers. AGENTS.md, COMPUTE.md and HOSTING.md hold no 2-hour claim.

**Blocked by:** 04 (shares the steering lint); checks-and-hooks/06 (the browser-check runner `npm run check:browser`); secrets-and-public-gates/10 (the deploy script with its publish step)

**Status:** resolved

- [x] Red first: before the edit, the section-size rule fails and names the AGENTS.md Compute section (322 words) and the Hosting section (140 words). The output goes in this ticket.
- [x] Rule: the two AGENTS.md sections that point to COMPUTE.md and HOSTING.md hold 120 words or less each, heading excluded. Ticket 06 widens this rule to every section.
- [x] Rule: no name from the model-name module occurs in COMPUTE.md or HOSTING.md.
- [x] HOSTING.md names the deploy script and holds no `vercel deploy` command.
- [x] HOSTING.md names `kaggle_api_token`, `oauth.json` and `porkbun_api.json` as file names only.
- [x] Search (one-off, output in this ticket): AGENTS.md, COMPUTE.md and HOSTING.md hold no "2 hours" claim for the shell limit. (The copy in the old handoff goes in ticket 07.)
- [x] Each fact of the old Compute and Hosting sections is in COMPUTE.md or HOSTING.md, or is listed in this ticket as dropped with a reason.

**Owns:** `docs/COMPUTE.md`, `docs/HOSTING.md`, `AGENTS.md` (the Compute and Hosting sections only), `tools/steering.docs.test.ts`

**Verify:** `npm test`; `npm run test:docs`; `git grep -n -E "2 hours|2-hour" -- AGENTS.md docs/COMPUTE.md docs/HOSTING.md`.

## Comments

**Build, 2026-10-07 (branch `build/steering-cut-05`).** The rules are in `tools/steering.docs.test.ts`, block "COMPUTE.md, HOSTING.md and the AGENTS.md pointers" (5 tests: 2 fixture tests, 3 tests on the real files).

Red first (`npx vitest run tools/steering.docs.test.ts` before the edit, 3 failed, 28 passed):

```
AGENTS.md § Compute — owner decision, 2026-10-03 (322 words, line 12): the section must hold 120 words or less, heading excluded
AGENTS.md § Compute — owner decision, 2026-10-03 (line 12): the section must link to docs/COMPUTE.md
AGENTS.md § Hosting — owner decision, 2026-10-03 (140 words, line 15): the section must hold 120 words or less, heading excluded
AGENTS.md § Hosting — owner decision, 2026-10-03 (line 15): the section must link to docs/HOSTING.md
docs/COMPUTE.md § (file) (count 0): the file must exist
docs/HOSTING.md § (file) (count 0): the file must exist
AGENTS.md § Compute — owner decision, 2026-10-03 (line 13): the file must not hold the 2-hour shell claim "2 hours"
```

Green: the Compute section holds 76 words, the Hosting section 51. The rules:

- Pointer sections: each `##` heading that names Compute or Hosting (the match ignores case, so ticket 06's "Runs and compute" also matches) holds 120 words or less, heading excluded, and links to `docs/COMPUTE.md` or `docs/HOSTING.md`. `sections()` also gives the "(top)" text, so ticket 06 can widen the size rule to every section.
- Fixed phrases. COMPUTE.md: `kaggle-tournament.mjs`, `M1`, `pmset -g batt`, `npm run check:browser`, "the shell's own timeout", "the session end", "detached". HOSTING.md: `tools/deploy.sh`, `kaggle_api_token`, `oauth.json`, `porkbun_api.json`, `kingdown.dev`.
- HOSTING.md holds no `vercel deploy` command (also `vercel@<version> deploy`).
- COMPUTE.md and HOSTING.md hold no name from the model-name module and no text that looks like a secret value (a `pk1_`, `sk1_` or `KGAT_` prefix, or 32 or more key characters in one run). This is the "file names only" check; the values stay out of the test.
- AGENTS.md, COMPUTE.md and HOSTING.md hold no 2-hour claim ("2 hours", "2-hour", "two hours"). This makes the one-off search a lint rule as well (story 7).

Commands and results, after the merge of the integration tip:

- `npm test`: exit 0; vitest 64 files, 1249 tests passed; node tests 42 passed.
- `npm run test:docs`: 2 files, 39 tests passed.
- Search: `git grep -n -E "2 hours|2-hour" -- AGENTS.md docs/COMPUTE.md docs/HOSTING.md` gives no line (exit 1). The copy in `HANDOFF.md` stays for ticket 07.

Fact map (old AGENTS.md Compute and Hosting sections):

| Old fact | New place |
|---|---|
| Think of Kaggle CPU notebooks beside this Mac before a compute task | COMPUTE.md Kaggle; AGENTS.md Compute (with the M1) |
| `kaggle-tournament.mjs push\|status\|pull`; games identical; shards pool in one report | COMPUTE.md Kaggle |
| 4 CPUs a notebook, about 1/5 of 4 M3 Max workers, about 1/15 of the Mac; extra capacity | COMPUTE.md Kaggle |
| 5 notebooks at most; the refusal text (2026-10-03); resend with `--only` | COMPUTE.md Kaggle |
| M1: the owner quote, network MacBook, `LOCAL-AI-MACBOOK.md` Tournament shards, when it plays, identical games | COMPUTE.md M1 |
| Token `KAGGLE_API_TOKEN` or `.secrets/kaggle_api_token`, git-ignored, never print or commit | COMPUTE.md Kaggle; HOSTING.md Secret files |
| Runs still need the owner's go | AGENTS.md Compute; COMPUTE.md intro points to the AGENTS.md run rules |
| Start long runs detached (`nohup`, `setsid nohup`), watch with a separate check | COMPUTE.md Long runs; AGENTS.md Compute |
| Background shell stops "at most 2 hours" | Corrected: the shell's own timeout or the session end (COMPUTE.md, AGENTS.md) |
| Card round stopped at 2,315 of 2,400 games (2026-10-03); runs resume by game id | COMPUTE.md Long runs |
| Re-arm the check; the night's runs finished at 18:36 and sat four hours | COMPUTE.md Long runs |
| Power: 61 W charger, 16 workers at half speed (93 → 177 ms a ply), battery drains; `pmset`, `ioreg`; ask for the larger charger | COMPUTE.md Power |
| Public at kingdown.vercel.app and kingdown.dev; project `kingdown`, team, Hobby plan | HOSTING.md Site; AGENTS.md Hosting (kingdown.dev) |
| Domain at Porkbun; A records `@` and `www` → `76.76.21.21` | HOSTING.md Domain and DNS |
| Deploys from this Mac with the Vercel CLI (signed in) | HOSTING.md Site (signed in) and Deploy (`tools/deploy.sh`) |
| The manual recipe: clean worktree, `npx vite build`, browser checks, copy `dist/` to `kingdown`, `npx vercel@latest link` and `deploy --prod` | Dropped: `tools/deploy.sh --publish` does these steps with a pinned CLI and a live check; HOSTING.md tells what it does |
| Every deploy publishes to the world; deploy only what the owner asked | HOSTING.md intro; AGENTS.md Hosting |
| Porkbun API URL and `dns/retrieve\|create\|delete/kingdown.dev` | HOSTING.md Domain and DNS |
| Keys in `.secrets/porkbun_api.json`, git-ignored, never print or commit | HOSTING.md Secret files; AGENTS.md Hosting (no file of `.secrets/`) |
| Parking ALIAS and `*` CNAME replaced on 2026-10-03; kingdown.dev answered that day | HOSTING.md Domain and DNS |
| A DNS change needs the owner's go | HOSTING.md Domain and DNS; AGENTS.md Hosting |
| Headings "owner decision, 2026-10-03" | Kept; ticket 06 renames the sections and removes the dates |

New facts, not in the old sections: the browser-check runner (COMPUTE.md, from `tools/check.mjs`), the deploy script and its two modes (from `tools/deploy.sh`), the tool gate asks (from `.claude/hooks/tool-gate.mjs`), `oauth.json`, mode 600 and `tools/save-secret.sh` (from the secrets spec).

Left for other tickets: the HANDOFF.md run recipes and the "Recipes" section of COMPUTE.md (ticket 07); the section names and the dates in the headings (ticket 06).

