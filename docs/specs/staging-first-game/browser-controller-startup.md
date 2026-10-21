# Controlled ChatGPT startup

Keep browser navigation and its readiness wait in one `cua_repl` call. Do not end the call at the first host snapshot or the first iframe element. The host adds the sandbox after that point.

## Post-mount acceptance

After the controller procedure is corrected, a separate `kingdown_settings` failure is captured. The staging pooler reaches its 15-client session limit. Source `64205cdf` uses transaction pooling and Vercel idle-connection cleanup. Ten fresh controlled opens of preview `dpl_4oJy4wGygNEaEkDEYk86UGNCodxT` reach enabled controls with ten distinct init IDs and no error notice or Try again. All ten remain clean on a later read. The saved feature game opens in both hosts with its seven actions unchanged. See [ticket 47](issues/47-account-privacy-and-host-startup.md) and the parent workspace's `evidence/staging-post-mount-error/verification.md`.

These checks use the existing desktop browser profile. They do not establish cold-cache, mobile or all-browser reliability. The vendor controller's idle-response defect remains; the supported verification procedure keeps the operation active until readiness. Keep these two causes separate.

## Captured cause

The extension intercepts Document responses with `Fetch.requestPaused`. A response that arrives during an active browser operation receives `Fetch.continueResponse`. In the isolated failing case, the response arrives after the browser operation ends and gets no release command. Later inspection does not recover that request. Detaching the debugger releases it, as the earlier controls show.

The probe has one button and one frame. Its button waits one second before it sets the frame URL to the public staging sandbox. It has no game, SDK, account or ChatGPT code. Its parent uses `localhost`, which the sandbox's frame-ancestor policy permits.

| Case | Result |
| --- | --- |
| Click and end the browser call | HTTP 200 reaches `Fetch.requestPaused`; no release follows. The child stays at `about:blank`. |
| Same page and click, then wait for Loaded in the same call | The response gets `Fetch.continueResponse` after 2 ms. The child loads in the original frame. |
| Real ChatGPT navigation, then end the call early | The sandbox and DIL document responses pause after the call returns. Neither has a release command in the captured trace. |
| Real ChatGPT navigation with the readiness procedure below | Ten new tabs reach enabled game controls, each with a new initialization ID. No Try again or navigation retry is used. |

Native DevTools logpoints capture only command names, times, test tab/frame/request identifiers, response types and public document URLs. Both logpoints are removed before the ten-open check. DevTools is closed. No installed controller code or security setting changes.

This identifies the lost response-release boundary and supplies a verified browser workflow. It does not repair the vendor controller's behavior between operations. Do not add a game retry or weaken CSP to compensate for it.

## Readiness procedure

Use the selected Chrome binding. Run tab creation and this whole wait in the same `cua_repl` call. The host can take more than one short selector wait to add its nested frame. Recheck that same document until the deadline; never reload, reopen, detach or click Try again inside the wait.

```js
async function waitForKingDown(tab) {
  const deadline = Date.now() + 25_000;
  while (Date.now() < deadline) {
    if (await tab.playwright.getByRole('button', {
      name: 'Try again', exact: true,
    }).isVisible()) throw new Error('Host displayed Try again');
    try {
      await tab.playwright.locator('iframe[title="King Down Staging"]')
        .waitFor({ state: 'attached', timeoutMs: 5_000 });
      const start = tab.playwright
        .frameLocator('iframe[title="King Down Staging"]')
        .frameLocator('iframe')
        .getByRole('button', { name: 'Start game', exact: true });
      await start.waitFor({ state: 'visible', timeoutMs: 5_000 });
      if (await start.isEnabled()) {
        return tab.playwright.locator('iframe[title="King Down Staging"]')
          .getAttribute('src');
      }
    } catch (error) {
      if (!/selector deadline|no_matches|not attached|timed out for selector/i
        .test(String(error))) throw error;
    }
  }
  throw new Error('Staging readiness deadline exceeded');
}

const tab = await cua.createBrowserTab('1',
  'https://chatgpt.com/mcp-app/asdk_app_6ad777853ecc8191820df5a18fcb9e5f/kingdown_open',
  { sessionName: '♟️ Staging verification' });
const init = await waitForKingDown(tab);
// Read the visible game notice too. Enabled controls alone do not prove a clean app.
```

Use the browser ID returned by the current session if it differs. Capture the visible notice, screenshot and initialization ID before closing the tab. Treat a loaded app with an error notice separately from a sandbox that never starts.

## Evidence and limits

The product stays at `fd853122`, staging preview `dpl_GogCzFkEU6yGq727yTK5hEEz8xar`. No deployment occurs. The ten observed times range from 8.0 to 25.2 seconds; these include host and test overhead and use a warm signed-in profile. They are not cold-load performance measurements.

At the earlier unchanged-product checkpoint, the tenth screenshot also shows `Internal error` after the game list and enabled setup controls appear. This is the separate post-mount symptom from ticket 10, not the blank sandbox failure. The ten checks prove document startup without Try again; they do not prove ten error-free app sessions. That deployment has no error-level request logs in the queried 30-minute window. Later tracing shows that HTTP 503 records can have level info. Query failed statuses as well as application-error logs; neither an empty error-level query nor enabled controls alone proves a clean session.

One earlier prototype wait tries the nested button before waiting for the outer frame. Its short selector deadline expires; it is excluded from the final ten and retained in the report. Earlier traces without a console filter cover only the visible console range. Use the later filtered pause/release records for the timing conclusion.

Full receipts are in the parent workspace at `evidence/controller-startup-diagnosis/`. The one-second probe, red and green traces, all ten initialization IDs, final screenshot and cleanup record are retained there. Reuse the existing mechanics, privacy and native controls. Keep the post-mount error and physical-device gates open.
