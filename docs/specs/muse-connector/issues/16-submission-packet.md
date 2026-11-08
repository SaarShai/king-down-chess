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

- Step 4, 2026-11-08, branch `muse-privacy` (a draft PR): `public/privacy.html` gets the paragraph `muse-connector` (Meta as a recipient, the independent controllers, Meta's use of the tool calls, deletion on disconnect) and the list item `muse-link` (the stored OAuth link). `tools/privacy-policy.docs.test.ts` checks the words, checks that the Muse tools name no handle, picture or email address, and keeps Muse out of the rest of the page.
- The switch does not gate this text: the site build copies the legal pages byte for byte, and the live check compares those bytes. As with the ChatGPT text, the legal text follows `MUSE_CONNECTOR` by hand. Merge the PR only in the release that sets `MUSE_CONNECTOR` to `true`, and set "Last updated" to the day of that release.
- Open before that release: no code acts on a disconnect in Muse yet, and Meta names no revocation signal. Step 3 must say which data "the data that King Down received through Muse" is (the OAuth link; the games played through Muse or not), and the code or the sentence must agree with it.
