# Write the submission packet

Type: task
Status: open
Blocked by: 12, 13, 15
Parent: [Muse connector map](../map.md)
Labels: wayfinder:task

## Question

What does the Muse form need, in final words?

## Steps

1. The overview: users, tasks, the value beyond the browser (rules engine, account games and turn status, hands-free play), restrictions (18+, regions).
2. The tool documentation: inputs, outputs, class (Read, Write, Sensitive write), side effects, status and error handling, rate limits. Generate it from the tool table in `src/muse/tools.ts` so it cannot drift.
3. The data-processing answers: data used (account ID, handle, games), why, retention (the existing cleanup periods), deletion on revocation, TLS, access control.
4. A privacy policy change that names Meta as a recipient; the lint in `tools/privacy-policy.docs.test.ts` checks it.
5. A demo script: start, move by words, an ambiguous move, a refused move, resume, resign.

## Progress

- Step 2, the tool documentation: [tool-docs.md](../tool-docs.md). `npm run muse:docs` writes it from the tool listing of `src/muse/tools.ts` (`tools/muse-tool-docs.ts`). The doc lint `tools/muse-tool-docs.docs.test.ts` fails while the file and the listing differ. The counter of each counted tool is now in the tool table (`COUNTERS`, `src/muse/tools.ts`), and each input field with no description got one, with its default.
- Step 3, the data-processing answers: [data-processing.md](../data-processing.md). Each fact names its file. The **[owner fact: ...]** marks, listed at the end of the file, wait for the owner.
- Step 5, the demo script: [demo-script.md](../demo-script.md), with real results of the in-memory fixture.
- Review of PR 344 (independent): no must-fix fault. Fixed on the same branch: the true retry behaviour in the tool docs, the real grants of the runtime role, a repeatable demo (the ambiguous and refused scenes now run before the first move), and the notes on the count order, the SDK input-check error, the `runDeletions` reference, the demo word sources and the Meta mention in the privacy page.
- Step 3, deletion on revocation: the owner chose deletion of the Muse games (2026-11-12). [Ticket 18](18-disconnect-deletion.md) builds it; section 5 of data-processing.md gives the mechanism and the answer.
- Open: step 1 (the overview) and step 4 (the privacy policy names Meta).
