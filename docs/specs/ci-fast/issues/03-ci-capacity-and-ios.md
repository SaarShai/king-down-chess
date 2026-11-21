# Make room for another CI run

Status: claimed

Run the scene check after the app tests. Run both release checks on the WebKit drafts runner and install both browsers there. Keep the full plan at 17 jobs. Add the stable live Home checks to the journey shards.

Use Node 24 to record the tested tree. An iOS-only change with a green base uses the short plan. It runs the type check, document lints and both iOS test files on macOS. The iOS path still needs independent review.

## Checks

Print the full, document, iOS-only and mixed plans. Check the merge gate and run the affected tests. Measure the full job count and the longest job on the PR run.
