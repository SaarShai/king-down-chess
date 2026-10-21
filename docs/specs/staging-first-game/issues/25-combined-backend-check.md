# Check the combined backend's static art

Status: in progress. Parent: U08 release acceptance. Check code only.

## Evidence and plan

The exact narration release passes all four compiled browser checks. The backend check then fails on `plugin-art/icon-192-BFQmrJSM.png`: it copies only the function and calls its handler. The emitted combined build puts this file in its static layer. Both release and recovery have the same 69,434-byte file there. The existing builder and server document this split.

1. Recognize a Vercel function by its existing function config. Read its enclosing output config and serve art through the existing `serveSite` helper. Keep standalone checking and direct API closure checks intact.
2. Switch the selected static output with the recovery handler. Do not rebuild, copy art into or change either accepted artifact.
3. Keep every image status, type, CORS, cache, nonempty and traversal assertion. Rerun the exact backend check against the same release and recovery bytes.
4. Obtain an independent review. Retain the failed receipt and the corrected run separately. Reuse the four unchanged green browser checks.

This is a checker correction. It is not evidence of a missing asset in the deployed game. The new route branch must pass the existing asset assertions before staging publication.
