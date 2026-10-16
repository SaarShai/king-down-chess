import { AppBridge, PostMessageTransport } from '@modelcontextprotocol/ext-apps/app-bridge';
const frame = document.querySelector<HTMLIFrameElement>('iframe')!;
let bridge: AppBridge | undefined;
let matchId: string | undefined;
let initialResult: any;
const invoke = async (name: string, args: Record<string, unknown>) => {
  const response = await fetch('/fixture-tool', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name, arguments: args }) });
  const result = await response.json();
  // The board's data is in _meta; the model would read only the summary.
  if (result._meta?.view && (name !== 'kingdown_get' || args.board_id || !matchId || result._meta.view.game_id === matchId)) { matchId = result._meta.view.game_id; (window as any).harnessMatchId = matchId; (window as any).harnessView = result._meta?.view; }
  return result;
};
// A test can make the frame's connect fail (design §7.5 R9): the next ui/initialize gets a JSON-RPC error.
window.addEventListener('message', event => {
  if ((window as any).rejectNextConnect && event.data?.method === 'ui/initialize') {
    (window as any).rejectNextConnect = false;
    event.stopImmediatePropagation();
    frame.contentWindow?.postMessage({ jsonrpc: '2.0', id: event.data.id, error: { code: -32000, message: 'Harness connect failed' } }, '*');
  }
}, true);
// The bridge listens before the page loads, as in a real host: the frame's load event waits for the board art.
async function mount() {
  await bridge?.close();
  const currentBridge = bridge = new AppBridge(null, { name: 'King Down local harness', version: '1' }, { serverTools: {}, updateModelContext: {} }, { hostContext: { displayMode: (window as any).harnessDisplayMode ?? 'inline', availableDisplayModes: ['inline', 'fullscreen'], ...(window as any).harnessHostContext } });
  // The calls that a hold keeps now, and the tool calls in flight at the host. A test waits for the frame's own
  // inflight count to reach these, so a released reply reaches the frame before the check runs.
  (window as any).harnessHeld = 0;
  (window as any).harnessInflight = 0;
  (window as any).harnessSetContext = async (context: any) => { (window as any).harnessHostContext = context; await bridge!.setHostContext(context); };
  bridge.onrequestdisplaymode = async ({ mode }) => { (window as any).harnessDisplayRequests ??= []; (window as any).harnessDisplayRequests.push(mode); if ((window as any).denyDisplayNext) { (window as any).denyDisplayNext = false; return { mode: (window as any).harnessDisplayMode ?? 'inline' }; } if ((window as any).holdDisplayNext) { (window as any).holdDisplayNext = false; await new Promise(resolve => { (window as any).releaseDisplay = resolve; }); } (window as any).harnessDisplayMode = mode; await bridge!.setHostContext({ displayMode: mode }); return { mode }; };
  // Holds count while they keep a call: the frame's inflight falls to this count when the reply is in.
  const hold = (slot: string) => new Promise<void>(resolve => {
    if (bridge === currentBridge) (window as any).harnessHeld++;
    (window as any)[slot] = () => { (window as any)[slot] = undefined; if (bridge === currentBridge) (window as any).harnessHeld--; resolve(); };
  });
  bridge.oncalltool = async params => {
    if (bridge === currentBridge) (window as any).harnessInflight++;
    try {
    (window as any).harnessCalls ??= []; (window as any).harnessCalls.push(params);
    if ((window as any).rejectNextGet && params.name === 'kingdown_get') { (window as any).rejectNextGet = false; throw new Error('Harness saved-game read failed'); }
    if ((window as any).rejectNextMove && params.name === 'kingdown_move') { const code = (window as any).rejectNextMove; (window as any).rejectNextMove = undefined; return { isError: true, content: [{ type: 'text', text: 'Harness definitive rejection' }], _meta: { code } }; }
    if ((window as any).requireHandleNext && params.name === 'kingdown_create') { (window as any).requireHandleNext = false; return { isError: true, content: [{ type: 'text', text: 'Pick a name and picture first.' }], _meta: { code: 'HANDLE_NEEDED' } }; }
    if ((window as any).failNextAction && params.name !== 'kingdown_handle') { (window as any).failNextAction = false; throw new Error('Harness action after Save failed'); }
    if (params.name === 'kingdown_handle' && params.arguments?.check !== true) { if ((window as any).failActionAfterHandle) { (window as any).failActionAfterHandle = false; (window as any).failNextAction = true; } (window as any).harnessHandle = params.arguments; }
    // holdBeforeNext holds a call before the server runs it; holdNext (below) holds the reply after the server commits.
    // Each names one tool, or a list of tools for the first call to any of them.
    const holds = (hold: unknown) => hold === params.name || (Array.isArray(hold) && hold.includes(params.name));
    if (holds((window as any).holdBeforeNext)) { (window as any).holdBeforeNext = undefined; await hold('releaseBefore'); }
    const result = await invoke(params.name, params.arguments ?? {});
    if (params.name === 'kingdown_get' && (window as any).harnessNextView) { result._meta.view = (window as any).harnessNextView; (window as any).harnessView = result._meta?.view; (window as any).harnessNextView = undefined; }
    if (holds((window as any).holdNext)) { (window as any).holdNext = undefined; await hold('releaseHeld'); }
    if ((window as any).holdNextGet && params.name === 'kingdown_get') { (window as any).holdNextGet = false; await hold('releaseHeldGet'); (window as any).heldGetReturned = true; }
    if ((window as any).dropNextReply === params.name) { (window as any).dropNextReply = undefined; throw new Error('Harness lost reply after commit'); }
    if ((window as any).dropNextMoveReply && params.name === 'kingdown_move') { (window as any).dropNextMoveReply = false; throw new Error('Harness lost reply after commit'); }
    return result;
    } finally { if (bridge === currentBridge) (window as any).harnessInflight--; }
  };
  (window as any).harnessTeardown = () => bridge!.teardownResource({});
  (window as any).harnessTool = (params: any) => bridge!.oncalltool!(params, undefined as any);
  // ChatGPT's standard context write replaces its widget-state snapshot.
  bridge.onupdatemodelcontext = async params => { (window as any).harnessWidgetState = { modelContent: params.structuredContent }; return {}; };
  bridge.oninitialized = async () => {
    (window as any).harnessDeclaredModes = bridge!.getAppCapabilities()?.availableDisplayModes;
    const result = initialResult ?? (new URLSearchParams(location.search).has('terminal') ? await (await fetch('/fixture-terminal')).json() : await invoke('kingdown_open', matchId ? { game_id: matchId } : {}));
    if (new URLSearchParams(location.search).has('terminal')) result.structuredContent.screen = 'board';
    initialResult = result;
    matchId = result.structuredContent?.game_id;
    await bridge!.sendToolInput({ arguments: matchId ? { game_id: matchId } : {} });
    await bridge!.sendToolResult(result);
    (window as any).harnessMatchId = matchId;
    (window as any).harnessView = result._meta?.view;
  };
  (window as any).harnessShow = async (result: any, route = false) => { initialResult = route || result.isError ? result : { ...result, structuredContent: { ...result.structuredContent, screen: result.structuredContent?.screen ?? 'board' } }; matchId = result.structuredContent?.game_id; (window as any).harnessMatchId = matchId; (window as any).harnessView = result._meta?.view; await bridge!.sendToolResult(initialResult); };
  await bridge.connect(new PostMessageTransport(frame.contentWindow!, frame.contentWindow!));
  frame.src = '/board-resource';
}
// One mount at a time: a second quick Remount waits, so no old bridge stays open beside the new one.
let mounting = Promise.resolve();
const remount = () => { mounting = mounting.then(mount); };
remount();
document.querySelector<HTMLButtonElement>('#remount')!.onclick = remount;
