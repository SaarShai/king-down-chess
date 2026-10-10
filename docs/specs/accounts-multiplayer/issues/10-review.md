# 10 — Review and integration

Type: task
Status: ready-for-agent
Wave: 4 · Model: Opus

## What to do

1. Independent reviews of the whole branch against `main`: correctness (transactions, races, Haste turns, deadlines), security (auth boundaries, the internal secret, grants and RLS, data the model sees), and the spec (each ticket's checks).
2. Fix confirmed findings in the branch.
3. Run every check of the spec on the integrated branch and record the results here.
4. Write the pull request body (what, why, how to check, what the owner must do before a deploy: Supabase migrations 0005 and 0006, `supabase/ops/cron.sql`, the Resend key, the internal secret, the OAuth resource move to `kingdown.dev/mcp`).

## Comments
