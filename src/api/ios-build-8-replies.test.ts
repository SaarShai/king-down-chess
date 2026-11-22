import { expect, it } from 'vitest';
import type { OnlineClient } from '../online/client';
import type { Friend, HistoryEntry, InboxEntry, InvitationRow, LobbyEntry, Opponent, View } from '../match/protocol';
import type { MyProfile } from '../account/profile';
import type { InviteLink } from './http';
import type * as Build8 from './fixtures/ios-build-8-replies';

// `npm run typecheck` (and `npm test`) fails here when a reply type loses a field that iOS build 1.0 (8) reads:
// the error names the field. A removed field breaks the app in App Review and on old phones (docs/IOS.md).
type Keeps<T, Fields extends PropertyKey> = [Exclude<Fields, keyof T>] extends [never] ? true : Exclude<Fields, keyof T>;
type Reply<Call extends keyof OnlineClient> = Awaited<ReturnType<OnlineClient[Call]>>;

const kept: {
  create: Keeps<Reply<'create'>, Build8.Create>; settings: Keeps<Reply<'settings'>, Build8.Settings>;
  handle: Keeps<Reply<'handle'>, Build8.Handle>; record: Keeps<Reply<'record'>, Build8.Record>;
  lobby: Keeps<Reply<'lobby'>, Build8.Lobby>; block: Keeps<Reply<'block'>, Build8.Block>;
  command: Keeps<Reply<'command'>, Build8.Ack>; invitations: Keeps<Reply<'invitations'>, Build8.Invitations>;
  friends: Keeps<Reply<'friends'>, Build8.Friends>; preview: Keeps<Reply<'preview'>, Build8.JoinPreview>;
  previewDraft: Keeps<Reply<'previewDraft'>, Build8.DraftPreview>; report: Keeps<Reply<'report'>, Build8.Report>;
  view: Keeps<View, Build8.View>; opponent: Keeps<Opponent, Build8.Opponent>; inbox: Keeps<InboxEntry, Build8.InboxEntry>;
  invitation: Keeps<InvitationRow, Build8.InvitationRow>; lobbyEntry: Keeps<LobbyEntry, Build8.LobbyEntry>;
  history: Keeps<HistoryEntry, Build8.HistoryEntry>; friend: Keeps<Friend, Build8.Friend>;
  invite: Keeps<InviteLink, Build8.InviteLink>; profile: Keeps<MyProfile, Build8.Profile>;
} = {
  create: true, settings: true, handle: true, record: true, lobby: true, block: true, command: true, invitations: true,
  friends: true, preview: true, previewDraft: true, report: true, view: true, opponent: true, inbox: true,
  invitation: true, lobbyEntry: true, history: true, friend: true, invite: true, profile: true,
};

it('keeps the /api reply fields that iOS build 1.0 (8) reads', () => {
  expect(Object.values(kept).every(Boolean)).toBe(true);
});
