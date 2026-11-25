# Map each store screen to its address route

Status: ready-for-agent
Source: the change rehearsals and guard checks of 2026-11-25 ([ticket 10](10-change-rehearsals.md), [ticket 11](11-guards-that-cannot-fail.md), [ticket 12](12-lessons-and-checks.md))

## Problem
- `src/online/runtime.ts:190`: `{ screen: screen === 'profile' || screen === 'settings' ? screen : 'play' }` sets the address and the history entry. A new read screen (a new `ReadRoute` screen in `src/account-game/client.ts:9`) falls back to `'play'`. The address bar, Back and Forward, and a reload lose the screen. No type or test finds it.

## Change
This is class C code. It needs the class C review. No behaviour change for the current screens.
- Replace the ternary with a table: `const ROUTE_OF: Record<Extract<Screen, ReadRoute['screen']>, AccountEntryRoute['screen']>` (a new `ReadRoute` screen must also join `SCREENS`, so it joins this key set) (or a `satisfies` check on a typed list of read screens), so that a new `ReadRoute` screen does not compile until it has an address route.
- Add a case to `src/online/runtime.test.ts` that iterates the `ReadRoute` samples (the `Samples` mapped type of `src/diagnostics/data.test.ts:124` or `tools/account-screen-guard.test.ts`) and checks that `history.pushState` gets `accountPath(sample)`.

## Test that fails first
- Add `'records'` to `ReadRoute`, `SCREENS` and `accountPath` in a scratch copy. `npm run typecheck` must fail at the new table. The runtime test must fail with `/play/` in place of `/play/records`.
- Revert: typecheck green; focused run of `src/online/runtime.test.ts` green.

## Known limits
- The table makes a person decide the route. It does not prove that the saved page route (`page.save`) is the same.

## Work record
Not started.
