# 05 — Safety documents: drafts

Type: task
Status: resolved
Wave: 1 · Branch: `claude/mp-05`

## What to build

Drafts for the owner and a lawyer, in `docs/safety/`. Read part 01, section 5.7, and part 03, section 8.10, of the report, and appendix D (gap 6). Every file starts with "DRAFT — not legal advice; the owner and a lawyer must check it" and lists the facts that only the owner can supply (UK links, user numbers, the accountable person, the address for notices).

- [x] `uk-illegal-content-risk-assessment.md`: the Ofcom four-step structure, filled for today's private ChatGPT friend play and for phase 1 (Daily friend games, handles, preset messages, reports).
- [x] `uk-childrens-access-assessment.md`.
- [x] `uk-childrens-risk-assessment.md` (outline, for phase 1).
- [x] `uk-record-of-measures.md`: the measures that the build adds (preset messages only, no free text, blocks, reports with the intimate-image path and 48-hour take-down, report hold, statements of reasons, appeals, NCA registration).
- [x] `terms-draft.md`, `safety-and-reporting-draft.md`, `contact-draft.md`: minimum age 13 in the terms; no age question.

Write in ASD-STE100. Cite the regulator's own pages.

## Checks

- [x] Each file names its source pages and the owner facts it still needs.
- [x] `npm run test:docs` passes.

## Comments

### Done, 2026-10-10

Seven drafts in `docs/safety/`, a check for them in `tools/safety-drafts.docs.test.ts`, and no other change. The build (`src/plugin`, `src/match`) is untouched, so no browser checks were needed.

- **Files.** `uk-illegal-content-risk-assessment.md` (four steps; two scopes: today's private ChatGPT friend play, and phase 1); `uk-childrens-access-assessment.md` (Stage 1 and 2; proposed result "likely"); `uk-childrens-risk-assessment.md` (outline; first-pass levels); `uk-record-of-measures.md` (M01 to M23, mapped to Ofcom code measures; measures not used; measures in place today; seven gaps); `terms-draft.md` (minimum age 13, no age question); `safety-and-reporting-draft.md`; `contact-draft.md` (with the mailbox procedure).
- **Each file** starts with the DRAFT line, has a "Facts only the owner can supply" list with open `- [ ]` items, and a Sources list with regulator pages (Ofcom, legislation.gov.uk, ICO, FTC; EUR-Lex only as a conditional note).
- **Check, new.** `tools/safety-drafts.docs.test.ts` asserts, for each of the seven files: the first line; an owner-facts list with at least one open item; a Sources list with https links only and at least one regulator link; no model names; relative links that resolve. It also asserts that the folder holds exactly these seven files. I mutated the files one at a time (wrong first line, renamed owner-facts heading, an http source link, a model name, a broken relative link), ran the check, and restored them from a backup (`diff -r` identical). Each mutation failed exactly one test (35 of 36 passed); on the real files all 36 pass. I filtered the output of those five mutation runs with grep to see the failing test names; the `npm test` and `npm run test:docs` runs below were not filtered.

### Evidence

- `npm run test:docs`: 5 files, 110 tests, all pass (36 of them new).
- `npm test` with `PLUGIN_TEST_DATABASE_URL` on the loopback test database `kingdown_mp_05_test`, after `npm run plugin:db:init-test`: typecheck clean; vitest 112 files passed, 1872 tests passed, 8 skipped; `node --test` 50 pass, 0 fail; exit 0.
- Style: a self-check script (sentences over 25 words, passive voice, words such as should, may, will) flags 1 line in 7 files: a quoted sentence from the beta packet. A rough Flesch-Kincaid grade of 3.3 (terms), 3.3 (safety page) and 4.3 (contact page) on the published text. I have no ASD-STE100 dictionary tool, so the owner must still read for STE.
- Sources I read for these drafts: Ofcom's Risk Assessment Guidance V2.0 (Tables 9, 10, 13, 13.3, 15), Children's Risk Assessment Guidance (paragraph 2.21), the children's access assessment pages, the Illegal Content and Protection of Children Codes, the CSEA reporting page and S.I. 2026/268, Online Safety Act sections 10, 11, 12 and 20A. Two links I could not check are left out: Childline (HTTP 403) and UK GDPR Article 12A (404).

### Open issues

1. **Seven gaps** in `uk-record-of-measures.md`, section "Gaps found while writing the drafts". In short: (1) a person who is not a player cannot use the planned sign-in report routes (section 20A), so the contact page takes intimate image reports by email; a form with no sign-in is safer (ticket 08 or later); (2) a handle can hint at another app; (3) "related user data" in a report hold is undefined; (4) no job may delete `reports` rows, because the NCA reference needs five years (ticket 10 checks); (5) no follower or follow list may be visible to other players (M05; tickets 07 and 08); (6) three controls have no ticket: a switch that turns presets off, a one-tap mute, a draw-offer cap; (7) the live privacy, terms and delete-data pages disagree with the new design.
2. **Live pages.** `public/privacy.html`, `public/terms.html` and `public/delete-data.html` need updates with the terms draft (minimum age 13, handle and icon, 7-day deletion wait, report hold). Out of this ticket.
3. **For the lawyer.** Does a preset to one opponent count as a direct message (the draft assumes yes)? Is the website link game a user-to-user service? Is an email address "easy" enough for affected persons? Does the EU Digital Services Act apply (Articles 11 to 18 appear only as notes)? What do UK GDPR and the ICO Children's Code need for 13 to 17? The preset list is not final.
4. **For the owner.** Every `- [ ]` item under "Facts only the owner can supply" in the seven files: the UK link date, user numbers, the accountable person, the legal name and place, the addresses, the NCA registration, the time targets, the help lines.
5. **Ratings.** All risk levels are first-pass proposals made with a stated rule. The owner and the lawyer must confirm them. They must change when open play, free text or guests start.
