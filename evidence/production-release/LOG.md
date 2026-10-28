# Production release of the new build — log

## Publish 2026-10-27 (release 3): main f8fcec0a

Owner word, 2026-10-26: "stop fixing UI. let's wrap it up and push to live."

- Source: main `f8fcec0a` (merge of release PR #161). Content: #150, #156 to #160, #162 to #164, #166 to #168. This includes friend invitations with migration 0022, save recovery fixes, UI review fixes and the Join service notice.
- Staging: before the release, staging serves `e63e8ae7`.
- Review before the publish: the final release review approves with all faults closed. Full `npm test`: 5,696 pass. `npm run test:docs`: 183 pass. The #168 confirmation review approves.
- Engines check before the publish (`release-live.sh engines`, read-only): `engines-check: pass; 3 engine(s) in use, 0 missing bundle(s)`.
- Migration 0022 on production (`utqzovjmclfyojedmwok`), before the publish: the daily job `kingdown-daily` is paused. Pre-check: 0 invitations, 0 waiting games, no running jobs. The SQL editor runs 14 one-line phases. Each SHA-256 prefix is checked before its phase runs.
- Migration post-check: 3 columns, 3 triggers, 5 valid indexes, no old `game_invites_game` index, 5 validated constraints. The tool check includes `kingdown_friends`. `delete_account` takes account locks. The runtime has UPDATE access to `state`.
- Publish: `tools/deploy.sh --publish` through `release-live.sh publish` puts main `f8fcec0a` live at https://kingdown.dev on 2026-10-27 at about 23:40Z. Result: `deploy: published f8fcec0a... to kingdown; live checks pass`.
- Live check: `live-check: pass`; 328 public files match the build; 5 API probes pass. `plugin-live-check: pass`. Bundle `/assets/index-CLRqBhyJ.js`; `sw.js` version `33e69564e10d`.
- After the publish: the daily job `kingdown-daily` is active again.
