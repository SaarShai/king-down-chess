# Build the Apple review controls

Status: ready-for-human

## Scope

Port the store patch. Add canonical app invites, deletion, reports, blocks and a gated Apple sign-in path.
Use the existing online routes. Add no dependency and change no live service.

## Checks

The related run passes 262 tests in 12 files.
The local online browser matrix passes 49 checks at 360 by 640, 390 by 844 and 1440 by 900.
The browser records no console error and no outside request. The rendered sheets fit at all three sizes.
The design detector reports no finding in the changed interface files.
The final gate and unsigned simulator build results go in the external Apple build report.

## Result and limits

The app shares canonical HTTPS invites. The website keeps its existing link format.
You has deletion with a confirm step, a server date, account data cleanup and sign-out.
The receipt confirms the request. It does not claim that the seven-day deletion job has run.
Games, results and invites have player safety controls. You has a blocked-player list with pages and Unblock.
The Apple web and native sign-in paths use one release switch. It stays off.
The local native bridge adds no package. The owner must complete provider setup and approve the capability.
The current server has no Apple token exchange or revocation record. Keep the switch off until that work passes its checks.
The current deletion job sends no final completion email. No server route changes for these controls.
No live sign-in, signing, archive, upload, deploy or commit runs.
An independent review and the owner's signed-device checks remain open.
