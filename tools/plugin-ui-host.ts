import { AppBridge, PostMessageTransport } from '@modelcontextprotocol/ext-apps/app-bridge';
const frame = document.querySelector<HTMLIFrameElement>('iframe')!;
let bridge: AppBridge | undefined;
let matchId: string | undefined;
let initialResult: any;
const invoke = async (name: string, args: Record<string, unknown>) => {
  const response = await fetch('/fixture-tool', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name, arguments: args }) });
  const result = await response.json();
  if (name === 'kingdown_create') initialResult = result;
  if (result.structuredContent?.matchId) { matchId = result.structuredContent.matchId; (window as any).harnessMatchId = matchId; (window as any).harnessView = result.structuredContent; }
  return result;
};
frame.onload = async () => {
  await bridge?.close();
  bridge = new AppBridge(null, { name: 'King Down local harness', version: '1' }, { serverTools: {}, updateModelContext: {} }, { hostContext: { displayMode: 'inline', availableDisplayModes: ['inline', 'fullscreen'] } });
  bridge.oncalltool = async params => {
    (window as any).harnessCalls ??= []; (window as any).harnessCalls.push(params);
    if ((window as any).rejectNextGet && params.name === 'kingdown_get') { (window as any).rejectNextGet = false; throw new Error('Harness saved-game read failed'); }
    if ((window as any).rejectNextMove && params.name === 'kingdown_move') { const code = (window as any).rejectNextMove; (window as any).rejectNextMove = undefined; return { isError: true, content: [{ type: 'text', text: 'Harness definitive rejection' }], _meta: { code } }; }
    const result = await invoke(params.name, params.arguments ?? {});
    if ((window as any).dropNextMoveReply && params.name === 'kingdown_move') { (window as any).dropNextMoveReply = false; throw new Error('Harness lost reply after commit'); }
    return result;
  };
  bridge.onupdatemodelcontext = async () => ({});
  bridge.onrequestdisplaymode = async ({ mode }) => { bridge!.setHostContext({ displayMode: mode }); return { mode }; };
  bridge.oninitialized = async () => {
    const result = initialResult ?? (new URLSearchParams(location.search).has('terminal') ? await (await fetch('/fixture-terminal')).json() : await invoke('kingdown_open', matchId ? { matchId } : {}));
    initialResult = result;
    matchId = result.structuredContent.matchId;
    await bridge!.sendToolInput({ arguments: matchId ? { matchId } : {} });
    await bridge!.sendToolResult(result);
    (window as any).harnessMatchId = matchId;
    (window as any).harnessView = result.structuredContent;
  };
  (window as any).harnessShow = async (result: any) => { initialResult = result; matchId = result.structuredContent.matchId; (window as any).harnessMatchId = matchId; (window as any).harnessView = result.structuredContent; await bridge!.sendToolResult(result); };
  await bridge.connect(new PostMessageTransport(frame.contentWindow!, frame.contentWindow!));
};
frame.src = '/board-resource';
document.querySelector<HTMLButtonElement>('#remount')!.onclick = () => { frame.src = '/board-resource'; };
