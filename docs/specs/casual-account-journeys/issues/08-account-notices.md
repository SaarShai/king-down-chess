# Read account notices on the shared Profile

Type: task
Status: resolved

## Plan and acceptance

1. Add an account-only read of the signed-in player's moderation and appeal notices. Return 20 dated safe notice DTOs and a decimal bigint cursor, without raw payload, report evidence, private marks or other account IDs.
2. Include the page in the existing HTTP record aggregate and private plugin profile metadata. Use a separate `notices_before` cursor. Keep notice content out of model-visible output.
3. Add the shared Profile notice list with empty, error and More states. Use text nodes and the existing request/lifecycle guards. Add no route, tool, persistence, polling, mail or read marker.
4. Grant only the additional notification ID/date columns and probe them before startup. Preserve suspended account authentication and manual Support.
5. Add focused database, adapter and Profile lifecycle coverage, then run through the shared test lock when the parent frees the CPU lane. Keep public matching closed and deploy nothing.

The approved policy is adaptation ticket 15. Support intake candidate `b2aba8d4` remains separate for later integration. Operational mailbox and owner handling evidence stay outside this source slice.

## Implementation and evidence

`AccountService.notices` reads only the verified actor's moderation and final appeal rows, ordered by ID. The page contains at most 20 notices; the extra row determines the next cursor. IDs and cursor comparison remain decimal PostgreSQL bigint values. The DTO keeps only date, notice ID, the player's own action reference, action/status, reason and suspension end. Malformed stored reasons fail with a safe read error. Report IDs, evidence, private marks, raw payload and other account IDs do not enter the DTO.

The existing HTTP record and plugin profile aggregate return the same page. Plugin content and structured model output retain their existing rating/total summary. The shared Profile shows dated text, the action reference, Support link, empty state and More notices. Each pagination stream keeps its own cursor. A failed More keeps the cursor for retry; the existing request and teardown guards refuse a late page. Notices add no persistent client data or read marker.

The runtime role gains only notification `id` and `created_at` reads in addition to its existing user/kind/payload grant. The startup LIMIT 0 probe checks exactly these read columns; no write grant changes.

Focused `npm test` passes 10 files / 191 tests, with no skips, against the disposable loopback test database. Full typecheck and 54 art checks pass. The selected files cover account/runtime-role DB reads, real HTTP/MCP consistency and privacy, cursor validation and client forwarding, startup probing, shared Profile empty/More/error/date/text rendering and SDK teardown, plus existing HTTP authentication paths. Log: `/tmp/kingdown-u07-notices-focused.log`. No build, deployment, live database operation, email or push was run.

Support candidate `b2aba8d4` must be integrated for its public appeal destination and operator intake before the combined support journey is checked. Owner mailbox and manual handling evidence remain release gates; these tests do not claim them.

## Review correction

Independent review found that an ordinary new-tab Support anchor is blocked by the real plugin sandbox. The activation regression fails before correction: keyboard activation makes no host open-link request. The shared host now exposes `openLink`; the plugin uses the installed SDK's `app.openLink`, and the website uses ordinary navigation. Profile prevents sandbox-native navigation and shows the fixed URL if the host refuses or the request fails. The existing request/lifecycle guard suppresses a late error. No sandbox permission changes.

After correction, the affected runtime/Profile/SDK-lifecycle repeat passes 3 files / 50 tests, with no skips, plus full typecheck and 54 art checks. The Profile test checks keyboard host request and pointer denial, while the website test checks navigation without notice storage. Logs: `/tmp/kingdown-u07-notice-link-red.log` and `/tmp/kingdown-u07-notice-link-green.log`. The independent reader confirms no remaining should-fix in the notice read or link correction. The earlier 10-file / 191-test evidence covers the unchanged service/API/grant logic; the link repeat covers the final adapter/UI delta.
