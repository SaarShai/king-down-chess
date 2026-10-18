# Prototype browser routes and invite return

Type: prototype
Status: open
Blocked by: 06, 09, 10, 11
Parent: [Web adaptation map](../map.md)
Labels: wayfinder:prototype

## Question

Can a player enter, leave, reload and resume every account flow with ordinary browser controls?

## Rule

A URL selects a screen or a game. It never takes a seat or submits a turn by itself.

## Options

1. Use the account hall, game and invite routes with browser history.
2. Keep every screen at the root URL and hold navigation only in memory.
3. Put the plugin in an iframe with a simulated host.

Recommended: 1. Direct links and the sign-in return become ordinary browser behavior, and a separate account page keeps the local engine state apart.

On yes: make a throwaway route prototype with fixtures and the game renderer. Show the route trace and the rendered screens to the owner. Keep it out of the product build until the flow is accepted.

## Prototype cases

- `/play/` opens the hall. `/play/profile` and `/play/settings` reload correctly.
- `/g/<id>` checks the account and the seat, then routes by server status.
- `/j/<token>` shows a preview. Sign-in returns to that preview. Join takes the seat only on its button.
- A code typed in the hall uses the same preview flow.
- Back from a board returns to the earlier page and does not abort the match.
- Back during a failed send keeps the receipt on its game. A late success does not move the player off Profile.
- An expired code, a taken seat, a deleted game and a wrong account each have a complete exit.
- After a join, the game URL replaces the token URL. Tokens never go to analytics or error logs.
- The old local game-link format still opens the local app.

## Pass evidence

A route table, a keyboard trace, a phone render, a desktop render and the owner's choice. A bare route stub or a screenshot with no Back and reload behavior does not resolve this ticket.
