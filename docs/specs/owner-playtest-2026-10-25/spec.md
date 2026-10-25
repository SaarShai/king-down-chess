# Owner playtest — Settings logout

Status: approved

## Owner decision

Saar approves the Settings sample on 2026-10-25: "do only the log out in settings."

## Scope

Add one Log out button as the last row of Settings on kingdown.dev. Use the existing local sign-out function. Return to the account sign-in page. Keep saved games and pending game receipts.

The Profile button is not approved. F-107 Main menu remains open. F-106 Guard shield stays with the effects session.

## Checks

The button matches the approved desktop and phone samples. A focused test fails before the change and passes after it. Tests cover one send for repeated clicks across a page update, a safe retry after an error, the absent Profile button, and local sign-out scope. The emitted website check covers touch, keyboard focus, logout, a fresh load without the account session, and unchanged saved games on the disposable local database. Run the project typecheck and full tests. The orchestrator starts the second independent review after this run. This run makes a commit and writes PR text. It does not push, open a PR or merge.
