# Map · King Down plugin: ready for OpenAI review

Label: wayfinder:map. Started 2026-10-15 12:30 PDT. Owner away until about 19:30 PDT ("I'm going to leave you in charge for the next 7 hours").

## Destination

The King Down ChatGPT plugin is ready to submit to OpenAI: no known fault on the tested devices and settings, the submission packet is complete, and every taste choice waits for the owner as rendered options on the approval page (https://claude.ai/artifact/S4wsHaYyPnkiNRiXRj4GkR).

## Notes

- Owner's brief (2026-10-15): orchestrate the QA and UI/UX team (Opus 5.5, Codex Sol 6.1, Codex Astra, both at xhigh); fix, improve, test and review again and again; stress tests; simulated devices and settings; research agents; "for implementations that are related to taste - create multiple options"; "don't over-engineer"; simplify the code, the user experience and the interface; "fun and faultless".
- Faults with one right fix go ahead. Taste items (look, words, motion, layout, menu structure) wait for the owner: build 2–3 options, show them on the approval page, do not merge them.
- Skills: ponytail (code), research, prototype, to-spec, implement-spec, retro.
- Branch: claude/plugin-ui-iphone (PR 57). Protocols: docs/qa/plugin-qa-protocol.md, docs/qa/plugin-ux-review-protocol.md.
- Checks on the M1; this Mac runs the tests and the local harness only.

## Decisions so far

- [Board size on iPhone](issues/04-fault-round-1.md): the app keeps the composer space twice, and a container rule hides the board on small phones. Both are faults. The full-width layout (A/B/C) is the owner's choice.
- [Fault round 1](issues/04-fault-round-1.md): merged; board 247 → 302 px on the owner's iPhone; whole rule text wins over board size on short phones.

- [What OpenAI review needs](issues/01-research-submission.md): four rejection gaps (sign-in, a read-only hint that writes, board URIs, no Android test); two go to fault round 2, sign-in goes to the owner (D8).
- [ChatGPT host metrics](issues/02-research-host-metrics.md): read the insets at run time, no composer gap; fullscreen with no tap goes to the owner (D7).
- [Game feel](issues/03-research-game-feel.md): texture only on the game surface; no haptics; reduced-motion gaps are faults; motion timings for the options.

## Not yet specified

- Fault round 3: the Astra stress QA faults, the device matrix faults, and the 820 × 600 landscape board (82 px).

- Which taste options the owner picks, and the build of those picks.
- Android and iPad behaviour in the real ChatGPT apps (no device here).
- Whether the side-panel and sidebar entries show for a private plugin.

## Out of scope

- Live deploy and the OpenAI submission itself (each needs the owner's word, ticket 19).
- Clay look (parked 2026-10-11).
