# 05 — Safety documents: drafts

Type: task
Status: ready-for-agent
Wave: 1 · Model: Sonnet · Branch: `claude/mp-05`

## What to build

Drafts for the owner and a lawyer, in `docs/safety/`. Read part 01, section 5.7, and part 03, section 8.10, of the report, and appendix D (gap 6). Every file starts with "DRAFT — not legal advice; the owner and a lawyer must check it" and lists the facts that only the owner can supply (UK links, user numbers, the accountable person, the address for notices).

1. `uk-illegal-content-risk-assessment.md`: the Ofcom four-step structure, filled for today's private ChatGPT friend play and for phase 1 (Daily friend games, handles, preset messages, reports).
2. `uk-childrens-access-assessment.md`.
3. `uk-childrens-risk-assessment.md` (outline, for phase 1).
4. `uk-record-of-measures.md`: the measures that the build adds (preset messages only, no free text, blocks, reports with the intimate-image path and 48-hour take-down, report hold, statements of reasons, appeals, NCA registration).
5. `terms-draft.md`, `safety-and-reporting-draft.md`, `contact-draft.md`: minimum age 13 in the terms; no age question.

Write in ASD-STE100. Cite the regulator's own pages.

## Checks

- Each file names its source pages and the owner facts it still needs.
- `npm run test:docs` passes.

## Comments
