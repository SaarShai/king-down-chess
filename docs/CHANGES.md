# How a change reaches the game

The lead sets the class of a change when the request arrives. The first answer to the owner states the class and the expected time.

## Classes

| Class | What it is | Review | Path |
| --- | --- | --- | --- |
| A. Tweak | Text, style or layout of one screen. Easy to undo. No server, database, account, storage, browser history or rules code. | The lead's read of the diff and the pictures is the independent review. A tweak that the lead writes gets a reader that did not write it. | The builder makes it and does a browser pass of the changed screen: each changed control, a phone size and a desktop size, pictures before and after. The scripted journey check runs. The tweak goes to the preview. The owner says yes or no. Approved tweaks go in one PR with one CI run. Publish. |
| B. Feature | New behaviour in one area. | One independent review by an agent that did not build it. | A short spec. The failing test first. One playtest of the journeys that the change touches, on a frozen head. The review. One batch of repairs. One check of that batch by the same reviewer. One CI run. Publish. |
| C. Risky | Server, database, accounts, online play, storage, browser history, a cutover. Hard to undo. | As B. A second review is permitted. | As B, and one two-account pass on staging. |

A change that touches class C code is class C. Its size does not change this.

## Rules

1. **Blocker rule.** A finding blocks a release only when a player reaches it with usual actions: tap, type, Back, reload, turn the phone, slow network. All other findings go to the follow-up list with their severity. Fix each confirmed fault that blocks.
2. **One review, one repair check.** Each PR gets one review. The same reviewer checks the repair batch one time, and only the repair. If that check finds a blocker, there are two exits and no third round:
   - The new repair is small and touches no class C code: the lead verifies it with a probe and merges with a reconcile note.
   - If not: the lead takes the faulty repair, or the faulty part, out of the release, lists the first fault as known, and tells the owner.
3. **Repairs are smaller than the fault.** Remove or go back before you add a guard. A repair that touches class C code leaves the release and becomes its own change.
4. **Freeze, then test.** The order is: build, local checks, playtest, repair batch, review, CI, staging, publish. No agent test starts on a head that can still change.
5. **A fault becomes a check.** When the owner or a tester finds a fault, the repair adds one case to a scripted check in the repository. A lesson goes into a note only when no check can hold it.

## Review record

Record each review in the ticket and in the PR: the kind (the lead's read of a tweak, or a review by an agent that did not build the change), the head that was read, and the open findings. When the head or the base moves after the review, the record holds a reconcile note that says what changed and how it was verified.

## Preview

A tweak goes to the preview address, `https://kingdown-preview.vercel.app`, before CI. Before the preview, these pass: the type check, the build, the scripted journey check and the builder's browser pass. The preview uses the staging project and the staging data. It never uses a production key or the production database, and it never moves the staging address or the live site. Only the lead starts a preview. `tools/deploy.sh` publishes to production only: never use it for a preview.

## Skills for agents

Each build brief and each repair brief names Ponytail (level full) and the skill for its task: `tdd` for a class B or C build, `diagnosing-bugs` for a fault with no clear cause, `pr` for the PR text. The lead runs `retro` one time after each release; its result feeds rule 5.
