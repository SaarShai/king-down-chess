# Approve a browser sample from the game UI

Type: prototype
Status: open
Blocked by: 09, 12, 13
Parent: [Web adaptation map](../map.md)
Labels: wayfinder:prototype

## Question

How do the account screens use the chosen game look in a top-level browser?

## Rule

Reuse the chosen game materials and behavior, and get the owner's approval of a rendered browser sample before the visual build.

## Options

1. Adapt the actual account screens, with browser safe areas and no composer gap.
2. Make a new website theme.
3. Copy the iframe dimensions and host padding unchanged.

Recommended: 1. Stone controls, the painted board, the scroll, badges and the shared fonts already work. The browser needs its own frame sizes.

On yes: render the hall, setup, seat, board and profile, with a local-play entry, a result card and a card or power target state. Every board uses the engine and the painted view. Record each difference from an existing owner pick. The sample does not authorize a new rule or font.

## Sizes and input

Main comparison: 390 × 844 and 1440 × 900. Fit cases: 320 × 568, a short landscape view, and 197 × 426 (200% zoom). Use browser safe areas, not the ChatGPT composer values. Check the software keyboard, long handles, draw replies, all four cards and a blocked-move notice.

Keep round coins, whole words in tabs, visible target words, the board floor with page scroll, the approved card-strip wraps and 48 px touch targets. Use the existing reduced-motion path. A spent coin stays readable. Show touch and keyboard focus. Include the open plugin samples that [the scope picks](12-scope-picks.md) send here, and the visible shared changes from [the web baseline](08-release-evidence.md).

## Resolution evidence

A link to the rendered sample, the owner's accepted options, and any remaining taste choice. No sample exists yet and no approval is inferred.
