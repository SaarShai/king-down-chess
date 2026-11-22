import { expect, it } from 'vitest';
import type { DraftPreview, Friend, FriendsPage, HistoryEntry, InboxEntry, InvitationRow, JoinPreview, LobbyEntry, Opponent, View } from '../match/protocol';
import type { MyProfile } from '../account/profile';
import type { WebAccountStatus } from '../online/account-access';
import type { SafetyService } from '../online/safety';
import type { AckReply, BlockReply, CreateReply, HandleReply, InvitationsReply, InviteLink, LobbyReply, RecordReply, SettingsReply } from './http';
import type * as Build8 from './fixtures/ios-build-8-replies';

// `npm run typecheck` (and `npm test`) fails here when a server reply type loses a field that iOS build 1.0 (8) reads:
// the error names the field. The routes in src/api/http.ts return these types, so a route that drops a field fails there. A removed field breaks the app in App Review and on old phones (docs/IOS.md).
type Keeps<T, Fields extends PropertyKey> = [Exclude<Fields, keyof T>] extends [never] ? true : Exclude<Fields, keyof T>;

const kept: {
  status: Keeps<WebAccountStatus, Build8.Status>;
  create: Keeps<CreateReply, Build8.Create>; settings: Keeps<SettingsReply, Build8.Settings>;
  handle: Keeps<HandleReply, Build8.Handle>; record: Keeps<RecordReply, Build8.Record>;
  lobby: Keeps<LobbyReply, Build8.Lobby>; block: Keeps<BlockReply, Build8.Block>;
  command: Keeps<AckReply, Build8.Ack>; invitations: Keeps<InvitationsReply, Build8.Invitations>;
  friends: Keeps<FriendsPage, Build8.Friends>; preview: Keeps<JoinPreview, Build8.JoinPreview>;
  previewDraft: Keeps<DraftPreview, Build8.DraftPreview>; report: Keeps<Awaited<ReturnType<SafetyService['report']>>, Build8.Report>;
  view: Keeps<View, Build8.View>; opponent: Keeps<Opponent, Build8.Opponent>; inbox: Keeps<InboxEntry, Build8.InboxEntry>;
  invitation: Keeps<InvitationRow, Build8.InvitationRow>; lobbyEntry: Keeps<LobbyEntry, Build8.LobbyEntry>;
  history: Keeps<HistoryEntry, Build8.HistoryEntry>; friend: Keeps<Friend, Build8.Friend>;
  invite: Keeps<InviteLink, Build8.InviteLink>; profile: Keeps<MyProfile, Build8.Profile>;
} = {
  status: true, create: true, settings: true, handle: true, record: true, lobby: true, block: true, command: true, invitations: true,
  friends: true, preview: true, previewDraft: true, report: true, view: true, opponent: true, inbox: true,
  invitation: true, lobbyEntry: true, history: true, friend: true, invite: true, profile: true,
};

it('keeps the /api reply fields that iOS build 1.0 (8) reads', () => {
  expect(Object.values(kept).every(Boolean)).toBe(true);
});
