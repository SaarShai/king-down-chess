import assert from 'node:assert/strict';
const UUID = /[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}/i;

export function checkWidgetState(state, draftBases) {
  const privateState = state.privateContent, scope = privateState?.draft?.scope;
  if (privateState) assert.deepEqual(state.modelContent ?? {}, {}, 'Widget state keeps model content empty');
  else {
    // Hosts without private widget state receive only the existing public status summary.
    const summary = state.modelContent;
    assert.deepEqual(Object.keys(summary).sort(), ['status', 'your_turn']);
    assert(['waiting', 'setup', 'playing', 'finished', 'aborted'].includes(summary.status));
    assert.equal(typeof summary.your_turn, 'boolean');
  }
  const redacted = structuredClone(state);
  if (redacted.privateContent) delete redacted.privateContent.board_id;
  if (scope) {
    // The plugin uses its server-owned per-actor board ID; the browser uses its signed-in user ID.
    assert.equal(scope.account, privateState.board_id, 'The private draft keeps this board ownership scope');
    assert(Number.isInteger(scope.revision) && scope.revision >= 0, 'The private draft names a base revision');
    assert.equal(privateState.draft.game_tag, scope.game.slice(0, 8), 'The private draft tag names its full game');
    const key = `${scope.game}:${scope.revision}`;
    assert(Object.hasOwn(draftBases, key), 'The private draft names an observed game and revision');
    assert.equal(scope.rules, draftBases[key], 'The private draft keeps the observed rules');
    delete redacted.privateContent.draft.scope.account;
    delete redacted.privateContent.draft.scope.game;
  }
  assert(!UUID.test(JSON.stringify(redacted)), 'Each widget write has no full UUID outside approved private scope fields');
  assert(!privateState?.pending?.args?.code && !privateState?.pending?.args?.handle, 'Pending state has no code or handle');
}
