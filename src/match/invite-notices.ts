/** Shared text for the website and app. Handles are text, never HTML. */
export const INVITE_NOTICES = {
 gameLimit: (count: number, handle: string | null, accepting = false) => `You have ${count} games with ${handle ?? 'this player'}. ${accepting ? 'Finish one to accept this invitation.' : 'Finish one of them first.'}`,
 namedLimit: (handle: string | null, count = 2) => `You sent ${handle ?? 'this player'} ${count} invitations. Wait until they accept one.`,
 namedSlot: 'A decline, cancellation or expiry frees a slot.',
 openLimit: 'You have 2 open link invitations. Cancel one or wait for it to end.',
 expired: 'This invitation is past its end time. Create a new game to invite again.',
 closed: 'This invitation is no longer open. Return to Your games.',
 permission: 'You cannot invite this player now. Choose another friend.',
 unavailable: 'This invitation is not available now. Return to Your games.',
 notFound: 'Player not found. Check the handle.',
 namedLink: (handle: string) => `Only ${handle} can accept this invitation.`,
 openLink: 'The first player to accept takes the seat. They must sign in and choose a handle.',
} as const;
