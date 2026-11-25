# Docs lint for the Status line of each ticket

Status: ready-for-agent
Source: the change rehearsals and guard checks of 2026-11-25 ([ticket 10](10-change-rehearsals.md), [ticket 11](11-guards-that-cannot-fail.md), [ticket 12](12-lessons-and-checks.md))

## Problem

No docs lint checks the Status line of a ticket. Only tools/parked.docs.test.ts:15 checks one Status line (docs/PARKED.md).
The tree has 827 tracked tickets (docs/specs/*/issues/*.md). Many tickets have no Status line (for example docs/specs/change-classes/issues/01-rules.md).
The Status values are free text: "resolved", "done", "closed", "done (PR #42, ...)", "in review", and more.
A ticket can thus show "ready-for-agent" after the work merges, and no check finds it.

## Change

1. Decide the set of status words (for example: needs-triage, needs-info, ready-for-agent, ready-for-human, claimed, in-progress, ready-for-review, done, resolved, closed). Put it as one list in a tools/lib module.
2. Add tools/ticket-status.docs.test.ts. It reads each tracked docs/specs/*/issues/*.md file that a commit after a named base commit adds (git log --diff-filter=A <base>..HEAD). It checks that the file has one line "Status: <word>" from the list, with optional text after the word.
3. Keep old tickets out by the base commit, not by a list of files. Do not rewrite old tickets in this ticket.

The failure text names the file and the line, and gives the list of status words.

## Test that fails first

Add a new ticket with "Status: maybe" (or with no Status line). The new docs test goes red and names the file. Remove it: green.

## Known limits

- The lint does not prove that the status is true (for example "done" while the work is not merged). A check against the git log is a larger change.
- The choice of status words and of the base commit is a process decision (tracker owner). The tracker files (TASKS.md, docs/QUEUE.md) do not change.

## Work record

Not started.
