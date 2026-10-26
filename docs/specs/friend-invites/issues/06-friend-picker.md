# Choose a friend and share a link

Status: needs-info
Type: task
Blocked by: 03, 04; owner approval of picker and share samples
Spec: [Online friend invitations](../README.md)

## Scope

Own the candidate service, exact-handle lookup and shared picker UI. Recent opponents and follows use existing account data. Reuse existing setup and share controls. Include the open-link path only if the owner accepts P4.

## Acceptance checks

- Recent opponents and follows have no duplicate IDs, deleted accounts or self entries. Blocked players do not appear.
- The handle field has a label. Find player resolves one current account; Send invitation uses its ID.
- Selection and setup survive a refused send. The primary action names the selected friend.
- Sharing a named invite limits acceptance to its recipient. Open links show first-accept text and the sender cap.
- No email address, contact upload or online presence is needed. The 320×568 picker scrolls with a reachable action.

## Tests to add

- Add candidate and exact-lookup cases for pagination, duplicates, no results, self, blocks and rename.
- Check keyboard selection, focus return, empty/error states and 200% text size.
- Check that Share and Copy keep expiry and recipient. Check stale code invalidation.
