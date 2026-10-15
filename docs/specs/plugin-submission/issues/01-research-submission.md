# 01 · What OpenAI review needs

Type: research
Status: closed

## Question

What does OpenAI need to approve a ChatGPT app (the Apps SDK / MCP Apps submission in 2026): the required metadata, policies, tool annotations, auth, CSP and domains, screenshots, test account, and the common reasons for rejection? Which of these does the repo meet now, and what is missing?

## Answer

Report: [01-openai-review.md](../../../research/plugin-submission-2026-10-15/01-openai-review.md) (checked: 10 claims, 5 corrected, no main finding changed).

- OpenAI takes a plugin ZIP (`plugin.json`, `mcp.json`, probably one skill) with a verified publisher, a production MCP URL, a domain check, a tool scan, four HTTPS URLs (website, support, privacy, terms), 5 positive and 3 negative test cases, a video, release notes, and a reviewer password login with no email code or second factor.
- Four gaps can each cause a rejection: (1) sign-in is only Google or GitHub; (2) `kingdown_get` says read-only but writes `last_seen_at`; (3) the board URI changes per build and old URIs are not served; (4) no Android or desktop test.
- Gaps 2 and 3 go to fault round 2 (builder B). Gap 1 is a decision for the owner (approval item D8). Gap 4 is ticket 06 plus the owner's own devices.
- The rest (ZIP, test cases, support page, release notes, privacy additions) goes to ticket 09.
