# Root asset URLs for account routes

Status: implemented; browser check pending.

## Plan

Use the root Vite asset base for the root-hosted game. Root the service-worker and account legal links. Keep inline SVG fragment references in the current document. Update the combined artifact check to accept root asset URLs.

## Verification

Extend the real Vite build test to resolve emitted HTML, CSS and public art from `/play/` and `/g/:id`. Check inline SVG fragments, service-worker registration and offline lists. The browser proof task owns the shared test lane and checks both routes against the emitted combined artifact. Limit unit workers to four because the engine and browser checks share CPU; keep the existing test inputs and time limits.

## Evidence

Source inspection finds the common cause: `base: './'` resolves built entry imports beneath the current account path. The new root base applies to Vite's HTML, CSS, module and runtime public URLs. The service worker and legal links also use root URLs. No `<base>` element changes fragment references. Syntax and diff checks pass. Required unit/build/browser evidence is recorded by the integration task after this commit lands.
