# Open a Muse Connector Platform account

Type: task
Status: open
Blocked by:
Parent: [Muse connector map](../map.md)
Labels: wayfinder:task

## Question

Can King Down's owner submit a connector, and as a person or as a business?

## Steps

1. Owner: sign in at https://platform.muse.ai with a work email (a six-digit code). New accounts give a date of birth.
2. Owner: read the [Connector Terms](https://muse.ai/platform/terms) and accept them only if they fit. They give Meta a licence to the name and marks, require a public privacy notice, a 48-hour incident notice (vendor-incident@meta.com) and deletion on revocation.
3. Owner: start business verification (Persona). Record here whether a personal route exists and what it needs.
4. Agent: record the portal's form fields, the payment choice and any category list here. They are behind the login now.

## Progress

- 2026-11-08: the owner has a portal account. The Account menu has only "Open Muse.ai" and "Log out". Business verification does not show before a submission.
- The form at `/submission` has three steps: Overview, Technical specs and Review. The Overview fields are:
  - Connector name
  - Company or developer
  - Product website
  - Example prompts
  - Connector icon: a 512×512 PNG or SVG; larger square PNGs up to 4096×4096 are scaled down.
  - Payments: "accepts payments" or "does not accept payments".
  - Your name: it must match a government ID.
  - Work email: "Use your company email address."
  - Support email or URL
  - Privacy policy URL
  - Terms of service URL
  - Anything else (optional)
- Proposed values:
  - Name: King Down Chess
  - Website: `https://kingdown.dev`
  - Icon: `public/icons/icon-512.png`
  - Payments: does not accept payments
  - Email: `hello@kingdown.dev`
  - Support: `https://kingdown.dev/support.html`
  - Privacy policy: `https://kingdown.dev/privacy.html`, after the change that names Meta (ticket 16)
  - Terms: `https://kingdown.dev/terms.html`
- The Technical specs fields are not recorded yet: "Next" checks the Overview fields first.

## Done when

The owner has a portal account, the verification route is known, and the form fields are recorded.
