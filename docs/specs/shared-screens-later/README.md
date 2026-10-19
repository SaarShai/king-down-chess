# Shared screens later work

One ticket per feature of the five parked later-update branches (`claude/od-home`, `claude/od-board`, `claude/od-look`, `taste/b2-row-preview`, `taste/c5-seat-reveal`). They are later work on the shared screens of the ChatGPT app and the web account page. The [web adaptation plan](../web-adaptation/map.md) lists this folder under Out of scope.

The owner parks all five branches on 2026-10-18. His words, from the plugin session and relayed in this task, are “yes, park them and send it”. Each branch is local only. Each branch predates the client redesign. Use each branch as a reference only. Do not merge, rebase, or delete it.

Work starts only after the plugin session hands over src/plugin/ and the OpenAI review allows it. The owner record gives a review period of one to five weeks on the live plugin. This is a limit from the owner record, not a checked review schedule. One writer changes the shared screens. A new visual trade-off needs the owner yes on a rendered sample.

The parking meets the web plan condition that approved later-update branches land or are parked. It does not hand over src/plugin/, finish the review, approve a sample, or authorize a deploy. PR 62 merges before the release deploy. The release owner supplies the later deploy commit and checks.

J1 changes the chat start contract, test case P2 in both copies, and the skill. It keeps its own review gate. The focused board view stays outside the approved web adaptation scope until a new choice changes that scope.

The tracker uses needs-triage for work that needs a new comparison and scope. It uses needs-info where the review or sample choice remains open. Blocked by stays none because the handover and review are outside events, recorded in Starts.

Read a branch source with git show <tip>:<path> in the repository. The ticket names its fixed tip, feature commits, and approval source. Local-only branch links on a public site cannot supply this record.

The branches also hold earlier work that the merge already carries: Home game count and person-first resume (J10), pitch and empty states (W2), host fullscreen entry (D7), Select words (B4), card choice and naming (C3, D4, W10), and the complete-turn and own-piece preview paths. Keep these merged paths. Tickets 14 and 15 check the latter overlaps and close with evidence if no gap remains. Do not turn old ancestor commits into new product scope.

## Tickets

- [01 · Hall tools and the first friend name](issues/01-hall-tools.md)
- [02 · J1 chat draft before Start](issues/02-chat-draft.md)
- [03 · Three setup presets](issues/03-setup-presets.md)
- [04 · Feature chips and named history results](issues/04-feature-chips.md)
- [05 · More options in the setup](issues/05-more-options.md)
- [06 · Any rules in the hall and open games](issues/06-any-rules.md)
- [07 · Start feedback and ways out](issues/07-start-feedback.md)
- [08 · Quiet resend after a remount](issues/08-quiet-resend.md)
- [09 · Start retry on the server clock](issues/09-retry-server-clock.md)
- [10 · Use a card or power from its coin](issues/10-direct-card-use.md)
- [11 · Readable card faces in both hands](issues/11-card-coin-faces.md)
- [12 · Card and power costs in Collection](issues/12-collection-costs.md)
- [13 · Coins and action words at 197 px](issues/13-narrow-coins.md)
- [14 · Keep the own-piece shove and swap preview](issues/14-own-piece-preview.md)
- [15 · Keep the complete-turn service contract](issues/15-whole-turn-contract.md)
- [16 · Plain dim layers](issues/16-plain-dim.md)
- [17 · System text and a path logo](issues/17-system-text.md)
- [18 · Safe Collection tab targets](issues/18-collection-tab-hits.md)
- [19 · A complete move chooser](issues/19-move-chooser.md)
- [20 · Optional focused board view](issues/20-focused-board.md)
- [21 · More board room on a short phone](issues/21-short-board.md)
- [22 · Readable labels on the dark board frame](issues/22-frame-labels.md)
- [23 · Clear move-mark edges](issues/23-move-mark-edges.md)
- [24 · A board preview in Your games](issues/24-game-row-preview.md)
- [25 · An opponent VS banner](issues/25-opponent-banner.md)
- [26 · Read the dealt cards before Ready](issues/26-seat-dealt-cards.md)
- [27 · A stone reveal over the other army](issues/27-seat-reveal.md)
