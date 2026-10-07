# 03: LESSONS.md becomes Always and an index; six topic files hold the lessons

**What to build:** An agent reads a short LESSONS.md: the section Always, then the section Index. Always holds the rule on printed process environments and secrets, without its Jev bullets. Index gives each lesson's heading, date and topic file, with a link. Six topic files hold the lesson text word for word: engine and tests; runs; Jev; art and motion; browser checks and UI; agents and tools. The steering lint keeps LESSONS.md small and keeps the index equal to the topic-file headings.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Red first: before the move, the size rule fails on LESSONS.md (about 64,000 bytes) and names the size. The output goes in this ticket.
- [ ] Rule: LESSONS.md is under 30,000 bytes.
- [ ] Rule: LESSONS.md holds the section Always, then the section Index, in this order, and no other `##` section.
- [ ] Rule: the Index entries equal the `##` headings of the six topic files, with no repeat, and each entry links to the file that holds it.
- [ ] Rule: no name from the model-name module occurs in LESSONS.md.
- [ ] The Jev bullets of the process-environment section move to the Jev topic file. Always keeps "never print a process environment" and the rotation rule.
- [ ] Conservation (one-off script, output in this ticket): each line of LESSONS.md after ticket 02 occurs one time in the new LESSONS.md or a topic file.
- [ ] The union driver of ticket 01 applies to each topic file (`git check-attr merge`).

**Owns:** `LESSONS.md`, `docs/lessons/**` (six files: `engine-and-tests.md`, `runs.md`, `jev.md`, `art-and-motion.md`, `browser-checks-and-ui.md`, `agents-and-tools.md`), `tools/steering.docs.test.ts`

**Verify:** `npm test`; `npm run test:docs`; `git check-attr merge -- docs/lessons/*.md`; the one-off conservation script.
