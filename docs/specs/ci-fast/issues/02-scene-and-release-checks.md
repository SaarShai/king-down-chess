# Run the scene and release checks in CI

Status: claimed

Give each check its own job in full CI. Run the scene check in Chromium and each release check in Chromium and WebKit. Enable test pages only in the scene job. Check that the production build has no scene page.

Keep the full plan at 20 jobs. Move the Chromium board test to the verify job with the Chromium drafts test.

Keep the shard file filter out of test child processes. Add the focus contrast test to the local plan for changes to the Help and menus CSS files. Record the lead review setting and its path limit.

## Checks

Compare the before and after plans. Run the local tests and document lints. Dispatch full CI on the branch and record the job times in the handoff.
