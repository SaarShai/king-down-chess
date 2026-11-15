# Merge the launch platform

Status: ready-for-human
Type: task

## Scope

Bring the final platform copy into this tree. Keep the newer play, UI, learning and marks work.
Build nothing new. The launch option stays off by default.

## Merge

The copy changes 41 files against its base: 21 changed files and 20 new files.
This tree did not change any of the 21 files after the base. Each file is a direct copy.
No file needs a hand merge. No file is deleted.
This tree changes only play, UI, ticket and save-check files after the base.
The copy changes none of them.
The launch HTML, launch worker and launch entry come from the unchanged base files.
The two anchors of the old online entry are unchanged.

## Verification

The full suite and the documentation checks pass on the merged tree.
The off build equals a build of the tree before the merge, file for file.
The browser checks use local previews at 360 by 640, 390 by 844 and 1440 by 900.
They cover local play, the old account flows, account controls, offline recovery,
legal pages, the returning notice, old links, the missing page and the old-browser message.
The worker update and the compiled host route probes pass.
The design project's stage report records counts, logs, screenshots and limits.

## Comments

No commit, push, pull request or deploy occurs. An independent review remains.
