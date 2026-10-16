# 10 · Retro

Type: task
Status: open

## Question

What worked and failed in this 7-hour run, and which rules change?

## Run log for the retro (2026-10-15, 12:30–19:30 PDT)

The retro skill runs only when the owner starts it (`/mattpocock-skills:retro`). These are the facts of the run, for that session.

**Work done**
- QA: stress rounds 1 and 2, device matrix rounds 1 (Chromium) and 2 (WebKit 26.6 and Chromium, 46 cases × 2), a review rehearsal (R1–R25), and a UX journey review of the combined preview (U1–U22, with three concept images).
- Fault rounds 2 to 7 on `claude/fault-round-2`. Each round fixes the confirmed findings of the review before it; two reviewers check each fix. Tickets: docs/specs/chatgpt-mvp/issues/23–28.
- Taste options as branches, with images on the approval page: layout a/b/c, stone a/b, motion quiet/lively, play hall and shortcuts, quick start, teach notes, and one combined preview (`taste/recommended`, refreshed with rounds 3–5).
- CI: the plugin-ui check went from 281 s to 95 s (no assertion removed), the browser checks run in their own job, and a keyboard race in the check is fixed. PR 57 CI is green.

**What went wrong (candidates for rules)**
- The plugin-ui check grew from 22.8 s to 294 s over several days, and nobody saw it until CI hit its 15-minute limit. The check runner records each duration but does not compare it with earlier runs.
- A fix in one round made a fault for the next round four times: the 10 s command limit and the 10 s wait line fired together; animated opponent moves (F35-1) made the board drop arrow keys; the Find receipt (RV5-4) showed the creator's times to the opponent; the 200% zoom fix made 125% zoom scroll. Each time, a reviewer found it, not the fixer's own tests.
- Edge-case fixes on the server (RV5-3, RV5-4) cost more than the fault they fixed, and stay out.
- `if: failure()` skipped the CI log upload when the job timed out (a timeout is a cancel).
- A background shell started with `&` inside a foreground command sends no notification.

**What worked**
- Two independent reviewers with probes found real faults in every round (round 4 review: 10 confirmed of 21).
- Old-code proof for each new test (the test fails on the base, passes on the fix).
- Approval page items with images, so taste calls wait without blocking fault work.
