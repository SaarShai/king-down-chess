// Type guard: each route reply type of src/api/http.ts must give every field that src/online/client.ts declares for
// that call. `npm run typecheck` fails at the field below when a client type reads a field that the route does not send.
// The check goes one way only (route reply to client type): the client may declare a wider type (for example
// `available?: boolean` against `available?: true`).
import { expect, it } from 'vitest';
import type { AckReply, BlockReply, CreateReply, HandleReply, InvitationsReply, LobbyReply, RecordReply, SettingsReply } from '../src/api/http';
import type { OnlineClient } from '../src/online/client';

type Gets<K extends keyof OnlineClient> = OnlineClient[K] extends (...args: never[]) => Promise<infer R> ? R : never;
type Sends<ClientType, RouteReply> = [RouteReply] extends [ClientType] ? true
  : 'the route reply type in src/api/http.ts does not give a field that src/online/client.ts declares; align the two types';

const checks: {
  create: Sends<Gets<'create'>, CreateReply>; settings: Sends<Gets<'settings'>, SettingsReply>; handle: Sends<Gets<'handle'>, HandleReply>;
  record: Sends<Gets<'record'>, RecordReply>; lobby: Sends<Gets<'lobby'>, LobbyReply>; block: Sends<Gets<'block'>, BlockReply>;
  command: Sends<Gets<'command'>, AckReply>; invitations: Sends<Gets<'invitations'>, InvitationsReply>;
} = { create: true, settings: true, handle: true, record: true, lobby: true, block: true, command: true, invitations: true };

it('keeps the client reply types fed by the route reply types (checked by npm run typecheck)', () => {
  expect(Object.values(checks).every(Boolean)).toBe(true);
});
