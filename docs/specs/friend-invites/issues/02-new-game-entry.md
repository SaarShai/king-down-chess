# Route A friend to online setup

Status: needs-info
Type: task
Blocked by: 01; owner approval of New game sample
Spec: [Online friend invitations](../README.md)

## Scope

Own the local-to-account route and the online return intent. Use the existing sign-in and handle steps. Share the online friend setup. Do not add a second setup system.

## Acceptance checks

- Signed-in A friend opens friend setup. Signed-out A friend opens sign-in, then the same setup.
- A missing handle returns to setup after handle selection. Back and sign-in failure keep the local game.
- The label says A friend. The help says Send an online invitation.
- No route opens another origin from an unchecked return URL.

## Tests to add

- Add route and runtime cases for signed-in, signed-out, missing handle and cancelled sign-in.
- Add a local browser journey with a fake account transport. Check that the local save stays intact.
