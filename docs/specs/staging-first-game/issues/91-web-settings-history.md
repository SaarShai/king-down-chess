# Web audit F6: Settings through browser history

Type: task
Status: in review

The owner asks for the F6 fix from the web audit. Work stays on `staging/web-routes-setup`.

## Plan and checks

1. Add a failing case for browser Back to `/play/settings` through the shared runtime.
2. Accept Settings in the mount route list.
3. Run the case and the related web and ChatGPT app tests. Check that the ChatGPT adapter still routes screens.
4. Record the red and green results. Commit this finding on its own.

Pass: the URL and screen both show Settings after Back. The shared runtime and adapter tests pass. No browser check, full suite, build or publish runs here.

## Result

The mount route list omits `settings`. The browser host sends that screen after a history event, but the mount keeps Play on screen. Add `settings` to the same list. This keeps the current mount and saved-screen rules.

The new browser case uses the real browser host and shared runtime. It opens Settings, presses the page Back control, then sends `popstate` for `/play/settings`. It checks the screen and URL. It also checks that the route adds no history entry. A second case sends Settings, Profile and Play through the ChatGPT adapter.

- Red: `KINGDOWN_TEST_FILE=src/plugin/app.test.ts KINGDOWN_TEST_NAME='shows Settings when browser Back|routes later ChatGPT results' npm test`. Both new cases fail on the old code: the screen stays `play` instead of `settings`. The type check passes.
- Green: `KINGDOWN_TEST_FILE='src/{plugin/app,online/runtime}.test.ts' npm test`. All 157 selected tests pass. The type check and all 57 drawing tests in the test command pass too.
- Logs: `web-routes-setup-f6-red.log` and `web-routes-setup-f6-green.log` in the audit scratch folder.

Review: the shared guard is the cause. The one-list change is sufficient. The ChatGPT adapter and its existing mount cases pass. A full suite and a real browser check remain for CI.
