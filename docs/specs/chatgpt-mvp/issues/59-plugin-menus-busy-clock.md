# The busy-Start test reads after the 1 s timer under load

Status: done
Type: task

## Fault

`tools/plugin-menus.test.ts` "shows a busy Start at once, Starting… after 1 s …" failed once in a full pre-push run on 2026-10-19 (the web session's codex/web-02 on main 0a7ec40b: 1 failed, 3,544 passed). Alone, the file passes.

## Cause

`page.clock.install()` lets the page time flow. The test clicks Start and then reads the button "at once". Under machine load, more than 1 s can pass between the click and the read, so the 1 s timer has already changed the text to "Starting…".

## Change

The test pauses the page clock (`pauseAt`) for the click and the read, then resumes it. The assertion and every later step stay the same.

## Proof

- Probe (not committed): a 1.3 s wait between the click and the read. Before the change: `expected [ true, 'true', 'Starting…' ] to deeply equal [ true, 'true', 'Start game' ]`. After: pass.
- The whole file: 13 of 13 pass.
