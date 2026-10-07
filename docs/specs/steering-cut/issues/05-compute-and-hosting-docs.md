# 05: COMPUTE.md and HOSTING.md hold the facts; the true shell limit; one deploy path

**What to build:** An agent who needs machine facts opens COMPUTE.md or HOSTING.md, not a long AGENTS.md section. COMPUTE.md holds the Kaggle, M1 and power facts and a pointer to the browser-check runner. It states the true shell limit: a background shell stops at the shell's own timeout or at the session end, so a long run starts detached and gets a separate watch. HOSTING.md holds the hosting and DNS facts, names the secret files and never their content, and names the deploy script as the only deploy path. The two AGENTS.md sections shrink to short pointers. AGENTS.md, COMPUTE.md and HOSTING.md hold no 2-hour claim.

**Blocked by:** 04 (shares the steering lint); checks-and-hooks/06 (the browser-check runner `npm run check:browser`); secrets-and-public-gates/10 (the deploy script with its publish step)

**Status:** ready-for-agent

- [ ] Red first: before the edit, the section-size rule fails and names the AGENTS.md Compute section (322 words) and the Hosting section (140 words). The output goes in this ticket.
- [ ] Rule: the two AGENTS.md sections that point to COMPUTE.md and HOSTING.md hold 120 words or less each, heading excluded. Ticket 06 widens this rule to every section.
- [ ] Rule: no name from the model-name module occurs in COMPUTE.md or HOSTING.md.
- [ ] HOSTING.md names the deploy script and holds no `vercel deploy` command.
- [ ] HOSTING.md names `kaggle_api_token`, `oauth.json` and `porkbun_api.json` as file names only.
- [ ] Search (one-off, output in this ticket): AGENTS.md, COMPUTE.md and HOSTING.md hold no "2 hours" claim for the shell limit. (The copy in the old handoff goes in ticket 07.)
- [ ] Each fact of the old Compute and Hosting sections is in COMPUTE.md or HOSTING.md, or is listed in this ticket as dropped with a reason.

**Owns:** `docs/COMPUTE.md`, `docs/HOSTING.md`, `AGENTS.md` (the Compute and Hosting sections only), `tools/steering.docs.test.ts`

**Verify:** `npm test`; `npm run test:docs`; `git grep -n -E "2 hours|2-hour" -- AGENTS.md docs/COMPUTE.md docs/HOSTING.md`.
