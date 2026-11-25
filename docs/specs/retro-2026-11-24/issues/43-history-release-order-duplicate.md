# Remove the duplicate migration list test from release-order.docs.test.ts

Status: ready-for-agent
Source: the change rehearsals and guard checks of 2026-11-25 ([ticket 10](10-change-rehearsals.md), [ticket 11](11-guards-that-cannot-fail.md), [ticket 12](12-lessons-and-checks.md))

## Problem
- tools/plugin-db/release-order.docs.test.ts:52-53 compare the two migration lists with the folder, with no failure text that names a file. tools/plugin-db/migration-places.docs.test.ts (branch guard-history, commit 5be63371e) does the same comparison with a failure text for each file.
- tools/plugin-db/release-order.docs.test.ts:54 `expect(files.slice(-2)).toEqual(['0025_opponent_avatar.sql', '0026_deletion_notice.sql']);` is a hand list. Each new migration makes it red, and the failure text does not say why.
- A builder must not edit this file in this lane: another builder can touch it.

## Change
After guard-history merges: remove lines 52-54 (keep the check of one number for each migration at line 51), or give line 54 the failure text `release-order.docs.test.ts: change the last two names to the two newest migrations`.

## Proof
npm run test:docs is green before and after. Add a fake supabase/migrations/0027_fake.sql: the red lines now come only from migration-places.docs.test.ts and from the README test at line 13, each with a file name.

## Known limits
None known.

## Work record
Not started.
