# 03: Commit messages hold no model name and end with one neutral trailer

**What to build:** The commit-msg hook refuses a message that holds a model name: a whole word, in any case, with or without a version tag. The refusal shows the word it found and says how to fix the message. One name module holds the model names; it is the one exception to decision 4, because a matcher must hold its words, and the steering spec's lint imports it. The prepare-commit-msg hook removes each `Claude-Session:` line, then adds a trailer only when the message has no `Co-Authored-By:` trailer. The Codex marker wins over the Claude Code marker, because Codex inherits `CLAUDECODE` from Claude Code shells. Codex gets `Co-Authored-By: Codex <noreply@openai.com>`; Claude Code gets `Co-Authored-By: Claude Code <noreply@anthropic.com>`; no marker gets no trailer. The builder finds the Codex marker in a Codex shell and records its name in the hook; until then, Codex briefs write their own trailer.

**Blocked by:** 02

**Status:** ready-for-agent

**Owns:** `.githooks/commit-msg` and its Node script, `.githooks/prepare-commit-msg` and its Node script, `tools/lib/model-names.mjs`, `tools/lib/model-names.test.ts`, `tools/git-hooks/commit-msg.test.ts`, `tools/git-hooks/prepare-commit-msg.test.ts`

- [ ] Name-matcher unit test: each name in the module matches as a whole word in lower, upper and mixed case, with and without a version tag; the same letters inside a longer word do not match; a clean message gives no match.
- [ ] Git-hook test, story 6: a commit whose message holds a model name exits non-zero, and the output holds the word it found and the fix.
- [ ] Git-hook test, story 7: with the Claude Code marker set, the commit ends with exactly one `Co-Authored-By: Claude Code <noreply@anthropic.com>` line and no `Claude-Session:` line.
- [ ] Git-hook test: with both markers set, the commit ends with exactly one `Co-Authored-By: Codex <noreply@openai.com>` line.
- [ ] Git-hook test: with no marker, the hook adds no trailer and still removes `Claude-Session:` lines.
- [ ] Git-hook test: a message that already has a `Co-Authored-By:` trailer keeps exactly one trailer.
- [ ] The Codex marker name comes from a real Codex shell; the builder records the variable name (never its value) under `## Comments` in this file. If no Codex shell is at hand, the ticket says so there and the Codex test case uses the name that the hook reads.

**Verify:** `npm test`; in a scratch clone after `npm ci`: a commit with a model name in the message (refused), and a commit with `CLAUDECODE=1` set (one neutral trailer).
