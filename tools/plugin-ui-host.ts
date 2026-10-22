import { AppBridge, PostMessageTransport } from '@modelcontextprotocol/ext-apps/app-bridge';
const host = window as any;
// The widget page is on another origin, so it reaches this page only by postMessage (ticket 17-b).
const first = document.querySelector<HTMLIFrameElement>('iframe')!;
const query = new URLSearchParams(location.search);
// ChatGPT mounts a new widget for each tool result, and the old widgets stay live. ?frame-per-result does the same here.
const perResult = query.has('frame-per-result');
type Widget = { frame: HTMLIFrameElement; bridge?: AppBridge; initialResult?: any; calls: any[]; widgetState?: any; injectedState?: { value: any }; widgetStates: any[]; fence?: number; held?: number; inflight?: number };
// Each widget has its own state, as in ChatGPT. The harnessWidgetState and harnessWidgetStates hooks are the newest widget's.
const widgets: Widget[] = host.harnessWidgets = [{ frame: first, calls: [], widgetStates: [] }];
const newest = () => widgets.at(-1)!;
// A check that replaces the state must win over each write the frame sent before it, as when the frame wrote this page
// directly. So the host sends the frame a fence, and keeps the check's state until the frame answers it.
let fences = 0;
Object.defineProperty(host, 'harnessWidgetState', { configurable: true, get: () => newest().widgetState, set: value => {
  const widget = newest(); widget.widgetState = value; widget.injectedState = { value }; widget.fence = ++fences;
  widget.frame.contentWindow?.postMessage({ harness: 'fence', id: widget.fence }, '*');
} });
Object.defineProperty(host, 'harnessWidgetStates', { configurable: true, get: () => newest().widgetStates, set: value => { newest().widgetStates = value ?? []; } });
host.harnessBoots = 0;
for (const [name, field] of [['harnessHeld', 'held'], ['harnessInflight', 'inflight']] as const) {
  Object.defineProperty(host, name, { get: () => newest()[field] ?? 0 });
}
// A failed connect belongs to the frame that sends it.
addEventListener('message', event => {
  if (host.rejectNextConnect && event.data?.method === 'ui/initialize' && widgets.some(widget => widget.frame.contentWindow === event.source)) {
    host.rejectNextConnect = false; event.stopImmediatePropagation();
    (event.source as Window).postMessage({ jsonrpc: '2.0', id: event.data.id, error: { code: -32000, message: 'Harness connect failed' } }, '*');
  }
}, true);
const draftRules = new Map<string, unknown>();
host.harnessDraftBases = {};
function rememberDraftBase(view: any) {
  if (!view) return;
  if (view.rules) draftRules.set(view.game_id, view.rules);
  const rules = view.rules ?? draftRules.get(view.game_id);
  if (rules) host.harnessDraftBases[`${view.game_id}:${view.revision}`] = { rules: JSON.stringify(rules), engine: view.engine_fingerprint };
}
let matchId: string | undefined;
const invoke = async (name: string, args: Record<string, unknown>) => {
  const response = await fetch('/fixture-tool', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name, arguments: args }) });
  const result = await response.json();
  rememberDraftBase(result._meta?.view);
  // The board's data is in _meta; the model would read only the summary.
  if (result._meta?.view && (name !== 'kingdown_get' || args.board_id || !matchId || result._meta.view.game_id === matchId)) { matchId = result._meta.view.game_id; host.harnessMatchId = matchId; host.harnessView = result._meta?.view; }
  return result;
};
async function callTool(widget: Widget, params: any) {
  const current = widget.bridge;
  widget.inflight = (widget.inflight ?? 0) + 1;
  const hold = (slot: string) => new Promise<void>(resolve => {
    if (widget.bridge === current) widget.held = (widget.held ?? 0) + 1;
    host[slot] = () => { host[slot] = undefined; if (widget.bridge === current) widget.held!--; resolve(); };
  });
  try {
  (host.harnessCalls ??= []).push(params); widget.calls.push(params);
  if (host.rejectNextGet && params.name === 'kingdown_get') { host.rejectNextGet = false; throw new Error('Harness saved-game read failed'); }
  if (host.rejectNextMove && params.name === 'kingdown_move') { const code = host.rejectNextMove; host.rejectNextMove = undefined; return { isError: true, content: [{ type: 'text', text: 'Harness definitive rejection' }], _meta: { code } }; }
  if (host.requireHandleNext && params.name === 'kingdown_create') { host.requireHandleNext = false; return { isError: true, content: [{ type: 'text', text: 'Pick a name and picture first.' }], _meta: { code: 'HANDLE_NEEDED' } }; }
  if (host.failNextAction && !['kingdown_handle', 'kingdown_games'].includes(params.name)) { host.failNextAction = false; throw new Error('Harness action after Save failed'); }
  if (params.name === 'kingdown_handle' && params.arguments?.check !== true) { if (host.failActionAfterHandle) { host.failActionAfterHandle = false; host.failNextAction = true; } host.harnessHandle = params.arguments; }
  // holdBeforeNext holds a call before the server runs it; holdNext (below) holds the reply after the server commits.
  // Each names one tool, or a list of tools for the first call to any of them.
  const holds = (hold: unknown) => hold === params.name || (Array.isArray(hold) && hold.includes(params.name));
  if (holds(host.holdBeforeNext)) { host.holdBeforeNext = undefined; await hold('releaseBefore'); }
  if (host.rejectNextAction?.name === params.name) { const { code, text } = host.rejectNextAction; host.rejectNextAction = undefined; return { isError: true, content: [{ type: 'text', text }], _meta: { code } }; }
  const result = await invoke(params.name, params.arguments ?? {});
  if (params.name === 'kingdown_get' && host.harnessNextView) { result._meta.view = host.harnessNextView; host.harnessView = result._meta?.view; host.harnessNextView = undefined; rememberDraftBase(result._meta.view); }
  if (holds(host.holdNext)) { host.holdNext = undefined; await hold('releaseHeld'); }
  if (host.holdNextGet && params.name === 'kingdown_get') { host.holdNextGet = false; await hold('releaseHeldGet'); host.heldGetReturned = true; }
  if (host.dropNextReply === params.name) { host.dropNextReply = undefined; throw new Error('Harness lost reply after commit'); }
  if (host.dropNextMoveReply && params.name === 'kingdown_move') { host.dropNextMoveReply = false; throw new Error('Harness lost reply after commit'); }
  return result;
  } finally { if (widget.bridge === current) widget.inflight!--; }
}
// The widget page's window.openai (FRAME_SHIM in plugin-ui-harness.ts) and the checks' frame code talk to these.
addEventListener('message', ({ source, data }) => {
  const widget = widgets.find(item => item.frame.contentWindow === source);
  if (!widget || typeof data?.harness !== 'string') return;
  const post = (message: object) => (source as Window).postMessage(message, '*');
  if (data.harness === 'fence') { if (widget.fence === data.id) widget.fence = undefined; }
  // A new page reads the check's state at boot, so its writes come after it.
  else if (data.harness === 'boot') { widget.fence = undefined; post({ harness: 'boot', bootDelay: host.harnessBootDelay ?? 0, openai: !host.harnessWithoutWidgetState, widgetState: widget.widgetState }); }
  // The frame has set its boot timer, so a check may now step the page clock over it.
  else if (data.harness === 'booted') host.harnessBoots++;
  else if (data.harness === 'widget-state') { if (!host.harnessDropWidgetWrites && widget.fence === undefined) { widget.widgetState = data.state; widget.injectedState = undefined; } widget.widgetStates.push(data.state); }
  // A check's frame code sets host hooks (holdNext and the others) in order with the frame's next tool call.
  else if (data.harness === 'set') Object.assign(host, data.values);
  else if (data.harness === 'tool') callTool(widget, data.params).then(result => post({ harness: 'tool', id: data.id, result }), error => post({ harness: 'tool', id: data.id, error: String(error) }));
});
// The bridge listens before the page loads, as in a real host: the frame's load event waits for the board art.
async function mount(widget: Widget) {
  // The SDK requires resource teardown before the iframe leaves the document.
  if (widget.bridge) {
    const injected = widget.injectedState;
    if (widget.bridge.getAppCapabilities()) await widget.bridge.teardownResource({});
    // A check can supply the next boot state; the old app saves its own state during teardown.
    if (injected) widget.widgetState = injected.value;
    widget.injectedState = undefined;
    const fresh = widget.frame.cloneNode() as HTMLIFrameElement;
    fresh.removeAttribute('src'); widget.frame.replaceWith(fresh); widget.frame = fresh;
  }
  await widget.bridge?.close();
  const bridge = widget.bridge = new AppBridge(null, { name: 'King Down local harness', version: '1' }, { serverTools: {}, updateModelContext: {}, openLinks: {} }, { hostContext: { displayMode: host.harnessDisplayMode ?? 'inline', availableDisplayModes: ['inline', 'fullscreen'], ...host.harnessHostContext } });
  bridge.onrequestdisplaymode = async ({ mode }) => { (host.harnessDisplayRequests ??= []).push(mode); if (host.denyDisplayNext) { host.denyDisplayNext = false; return { mode: host.harnessDisplayMode ?? 'inline' }; } if (host.holdDisplayNext) { host.holdDisplayNext = false; await new Promise(resolve => { host.releaseDisplay = resolve; }); } host.harnessDisplayMode = mode; await bridge.setHostContext({ displayMode: mode }); return { mode }; };
  bridge.onopenlink = async input => { (host.harnessOpenLinks ??= []).push(input); const isError = !!host.denyOpenLinkNext; host.denyOpenLinkNext = false; return { isError }; };
  widget.held = widget.inflight = 0;
  bridge.oncalltool = params => callTool(widget, params);
  // ChatGPT's standard context write replaces its widget-state snapshot.
  bridge.onupdatemodelcontext = async params => { widget.widgetState = { modelContent: params.structuredContent }; return {}; };
  bridge.oninitialized = async () => {
    host.harnessDeclaredModes = bridge.getAppCapabilities()?.availableDisplayModes;
    const result = widget.initialResult ?? (query.has('terminal') ? await (await fetch('/fixture-terminal')).json() : await invoke('kingdown_open', matchId ? { game_id: matchId } : {}));
    if (query.has('terminal')) result.structuredContent.screen = 'board';
    rememberDraftBase(result._meta?.view);
    widget.initialResult = result;
    matchId = result.structuredContent?.game_id;
    await bridge.sendToolInput({ arguments: matchId ? { game_id: matchId } : {} });
    await bridge.sendToolResult(result);
    host.harnessMatchId = matchId;
    host.harnessView = result._meta?.view;
  };
  await bridge.connect(new PostMessageTransport(widget.frame.contentWindow!, widget.frame.contentWindow!));
  widget.frame.src = first.dataset.src!;
}
// One mount at a time: a second quick Remount waits, so no old bridge stays open beside the new one.
let mounting = Promise.resolve();
const remount = (widget = newest()) => mounting = mounting.then(() => mount(widget));
host.harnessSetContext = async (context: any) => { host.harnessHostContext = context; await newest().bridge!.setHostContext(context); };
host.harnessTeardown = () => newest().bridge!.teardownResource({});
host.harnessTool = (params: any) => callTool(newest(), params);
host.harnessShow = async (result: any, route = false) => {
  rememberDraftBase(result._meta?.view);
  const shown = route || result.isError ? result : { ...result, structuredContent: { ...result.structuredContent, screen: result.structuredContent?.screen ?? 'board' } };
  matchId = result.structuredContent?.game_id; host.harnessMatchId = matchId; host.harnessView = result._meta?.view;
  if (!perResult) { newest().initialResult = shown; await newest().bridge!.sendToolResult(shown); return; }
  // A new frame with the same sandbox, allow list and source, its own bridge and an empty widget state.
  const frame = document.createElement('iframe');
  for (const { name, value } of first.attributes) if (name !== 'src') frame.setAttribute(name, value);
  // The chat scrolls to the new result; the older widgets go out of view.
  document.body.append(frame); frame.scrollIntoView();
  const widget: Widget = { frame, initialResult: shown, calls: [], widgetStates: [] };
  widgets.push(widget);
  await remount(widget);
};
remount();
document.querySelector<HTMLButtonElement>('#remount')!.onclick = () => { remount(); };
