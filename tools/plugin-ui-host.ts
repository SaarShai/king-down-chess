import { AppBridge, PostMessageTransport } from '@modelcontextprotocol/ext-apps/app-bridge';
const frame = document.querySelector<HTMLIFrameElement>('iframe')!;
let bridge: AppBridge | undefined;
let matchId: string | undefined;
let initialResult: any;
const invoke = async (name: string, args: Record<string, unknown>) => {
  const response = await fetch('/fixture-tool', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name, arguments: args }) });
  const result = await response.json();
  // The board's data is in _meta; the model would read only the summary.
  if (result._meta?.view) { matchId = result._meta.view.game_id; (window as any).harnessMatchId = matchId; (window as any).harnessView = result._meta.view; }
  return result;
};
// The bridge listens before the page loads, as in a real host: the frame's load event waits for the board art.
async function mount() {
  await bridge?.close();
  bridge = new AppBridge(null, { name: 'King Down local harness', version: '1' }, { serverTools: {}, updateModelContext: {} }, { hostContext: { displayMode: (window as any).harnessDisplayMode ?? 'inline', availableDisplayModes: ['inline', 'fullscreen'], ...(window as any).harnessHostContext } });
  (window as any).harnessSetContext = async (context: any) => { (window as any).harnessHostContext = context; await bridge!.setHostContext(context); };
  bridge.onrequestdisplaymode = async ({ mode }) => { (window as any).harnessDisplayRequests ??= []; (window as any).harnessDisplayRequests.push(mode); (window as any).harnessDisplayMode = mode; await bridge!.setHostContext({ displayMode: mode }); return { mode }; };
  bridge.oncalltool = async params => {
    (window as any).harnessCalls ??= []; (window as any).harnessCalls.push(params);
    if ((window as any).rejectNextGet && params.name === 'kingdown_get') { (window as any).rejectNextGet = false; throw new Error('Harness saved-game read failed'); }
    if ((window as any).rejectNextMove && params.name === 'kingdown_move') { const code = (window as any).rejectNextMove; (window as any).rejectNextMove = undefined; return { isError: true, content: [{ type: 'text', text: 'Harness definitive rejection' }], _meta: { code } }; }
    if ((window as any).requireHandleNext) { (window as any).requireHandleNext = false; return { isError: true, content: [{ type: 'text', text: 'Pick a name and picture first.' }], _meta: { code: 'HANDLE_NEEDED' } }; }
    if ((window as any).failNextAction && params.name !== 'kingdown_handle') { (window as any).failNextAction = false; throw new Error('Harness action after Save failed'); }
    if (params.name === 'kingdown_handle') { if ((window as any).failActionAfterHandle) { (window as any).failActionAfterHandle = false; (window as any).failNextAction = true; } (window as any).harnessHandle = params.arguments; return { content: [], structuredContent: { handle: params.arguments?.handle, icon: params.arguments?.icon } }; }
    const args = params.arguments ?? {};
    const legacy = params.name === 'kingdown_create' && 'kind' in args ? { mode: args.kind, colour: args.colour, board_id: args.board_id } : params.name === 'kingdown_join' && 'code' in args ? { invitation: args.code, board_id: args.board_id } : params.name === 'kingdown_open' && 'screen' in args ? { game_id: args.game_id } : args;
    const result = await invoke(params.name, legacy);
    if ((window as any).holdNextGet && params.name === 'kingdown_get') { (window as any).holdNextGet = false; await new Promise<void>(resolve => { (window as any).releaseHeldGet = () => { (window as any).releaseHeldGet = undefined; resolve(); }; }); (window as any).heldGetReturned = true; }
    if ((window as any).dropNextMoveReply && params.name === 'kingdown_move') { (window as any).dropNextMoveReply = false; throw new Error('Harness lost reply after commit'); }
    return result;
  };
  // ChatGPT's standard context write replaces its widget-state snapshot.
  bridge.onupdatemodelcontext = async params => { (window as any).harnessWidgetState = { modelContent: params.structuredContent }; return {}; };
  bridge.oninitialized = async () => {
    const result = initialResult ?? (new URLSearchParams(location.search).has('terminal') ? await (await fetch('/fixture-terminal')).json() : await invoke('kingdown_open', matchId ? { game_id: matchId } : {}));
    if (new URLSearchParams(location.search).has('terminal')) result.structuredContent.screen = 'board';
    initialResult = result;
    matchId = result.structuredContent.game_id;
    await bridge!.sendToolInput({ arguments: matchId ? { game_id: matchId } : {} });
    await bridge!.sendToolResult(result);
    (window as any).harnessMatchId = matchId;
    (window as any).harnessView = result._meta.view;
  };
  (window as any).harnessShow = async (result: any) => { initialResult = { ...result, structuredContent: { ...result.structuredContent, screen: result.structuredContent.screen ?? 'board' } }; matchId = result.structuredContent.game_id; (window as any).harnessMatchId = matchId; (window as any).harnessView = result._meta.view; await bridge!.sendToolResult(initialResult); };
  await bridge.connect(new PostMessageTransport(frame.contentWindow!, frame.contentWindow!));
  frame.src = '/board-resource';
}
// One mount at a time: a second quick Remount waits, so no old bridge stays open beside the new one.
let mounting = Promise.resolve();
const remount = () => { mounting = mounting.then(mount); };
remount();
document.querySelector<HTMLButtonElement>('#remount')!.onclick = remount;
