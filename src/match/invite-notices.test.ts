import { expect, it } from 'vitest';
import { INVITE_NOTICES as n } from './invite-notices';
it('uses the exact shared limit and invitation notices', () => {
 expect(n.gameLimit(5, 'rowan')).toBe('You have 5 games with rowan. Finish one of them first.');
 expect(n.gameLimit(5, 'rowan', true)).toBe('You have 5 games with rowan. Finish one to accept this invitation.');
 expect(n.gameLimit(7, 'rowan')).toBe('You have 7 games with rowan. Finish one of them first.');
 expect(n.namedLimit('rowan')).toBe('You sent rowan 2 invitations. Wait until they accept one.');
 expect(n.namedSlot).toBe('A decline, cancellation or expiry frees a slot.');
 expect(n.openLimit).toBe('You have 2 open link invitations. Cancel one or wait for it to end.');
 expect(n.permission).toBe('You cannot invite this player now. Choose another friend.');
 expect(n.unavailable).toBe('This invitation is not available now. Return to Your games.');
 expect(n.expired).toBe('This invitation is past its end time. Create a new game to invite again.');
 expect(n.closed).toBe('This invitation is no longer open. Return to Your games.');
 expect(n.notFound).toBe('Player not found. Check the handle.');
 expect(n.namedLink('rowan')).toBe('Only rowan can accept this invitation.');
 expect(n.openLink).toBe('The first player to accept takes the seat. They must sign in and choose a handle.');
});
