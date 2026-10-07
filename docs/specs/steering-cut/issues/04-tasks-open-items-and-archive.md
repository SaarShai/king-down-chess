# 04: TASKS.md becomes an index of open items; old sections go to the archive

**What to build:** An agent reads a short TASKS.md: the section Open items, then a link to the tasks archive and the specs folder. Each line holds a bold title, a label, the next step or question, and a link. All 107 old sections move word for word into month files in the archive. Undated phase plans go to September; undated Workshop sections go to October. No open item drops: each one maps to an index line or to a recorded close. The steering lint keeps TASKS.md and its Open items small, so the compaction hook can give the whole section.

An open item is an unchecked box, a heading marked open, or an open owner question. September items get `needs-triage`, owner questions `needs-info`, all others `ready-for-agent`. The Workshop line links its spec and makes no claim about Set A. One line can carry some items of one section when they share a next step. The Jev player comment that names a moved section names its archive file.

**Blocked by:** 03 (shares the steering lint); secrets-and-public-gates/11 (the commit that removes the transcripts and fixes the links into them, TASKS.md included)

**Status:** ready-for-agent

- [ ] Red first: before the move, the size rules fail and name TASKS.md (about 290,000 bytes) and its first section. The output goes in this ticket.
- [ ] Rule: TASKS.md is under 40,000 bytes, and its Open items section is under 5,000 bytes.
- [ ] Rule: TASKS.md holds the section Open items first; after it, only the links to the archive and the specs folder.
- [ ] Rule: each Open items line has a bold title, one of the five labels and a link; no two lines have the same title.
- [ ] Rule: no name from the model-name module occurs in TASKS.md.
- [ ] Conservation (one-off script, output in this ticket): each old TASKS.md section is byte-identical to one section of one archive month file.
- [ ] Open-item map (one-off, output in this ticket): each unchecked box, open heading and open owner question of the old TASKS.md maps to an index line or to a close with its reason.
- [ ] The comment at the top of the Jev player tool names the archive file of the "Jev balancing review" section.
- [ ] Before the merge, the builder compares main's TASKS.md with the old copy. If main changed it, the builder repeats the move and the two one-off checks.

**Owns:** `TASKS.md`, `docs/tasks-archive/2026-09.md`, `docs/tasks-archive/2026-10.md`, `tools/jev-play.ts` (the comment only), `tools/steering.docs.test.ts`. Shared file: secrets-and-public-gates/11 edits the link lines of `TASKS.md` first; this ticket blocks on it

**Verify:** `npm test`; `npm run test:docs`; the one-off conservation and open-item map scripts against `git show main:TASKS.md`.
