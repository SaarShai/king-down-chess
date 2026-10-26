# Use the same invitations in the ChatGPT app

Status: ready-for-agent
Type: task
Blocked by: 03, 04, 05, 06
Spec: [Online friend invitations](../README.md)

## Scope

Own plugin tools and web transport mapping for the shared UI. Add candidate reads and named invitation actions. Preserve board selection, queue ordering and host recovery.

## Acceptance checks

- The website and app use the same service paths, errors, rows and notices.
- A named invite sent on either host appears on the other. Accept and Decline work after remount.
- Game-list output contains no raw token, code, private relation or presence data.
- The app keeps composer space and uses King Down styles. It does not add a second visual system.
- Old code joins and old waiting friend games still work with the new limits.

## Tests to add

- Extend tool, runtime and protocol cases for recipient input, private metadata and typed errors.
- Extend the compiled embedded journey with fake accounts and cross-transport invite changes.
- Check explicit actions, late replies and remount recovery at phone and desktop sizes.
