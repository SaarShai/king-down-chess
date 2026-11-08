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
