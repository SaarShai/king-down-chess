# Make room for another CI run

Status: done

Run the scene check in its own job. Enable test pages in its browser step. Run both release checks on the WebKit drafts runner and install both browsers there. The full plan uses 18 jobs. Add the stable live Home checks to the journey shards.

Use Node 24 to record the tested tree. An iOS-only change with a green base runs the type check, document lints and `tools/ios-app.test.ts` on Ubuntu. The store test needs macOS tools and stays outside the hosted plan. The iOS path still needs independent review.

## Checks

Print the full, document, iOS-only and mixed plans. Check the merge gate and run the affected tests. Measure the full job count and the longest job on the PR run.
