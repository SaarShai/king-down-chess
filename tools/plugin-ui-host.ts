import { AppBridge, PostMessageTransport } from '@modelcontextprotocol/ext-apps/app-bridge';
const frame = document.querySelector<HTMLIFrameElement>('iframe')!;
let bridge: AppBridge | undefined;
let matchId: string | undefined;
const invoke = async (name: string, args: Record<string, unknown>) => {
  const response = await fetch('/fixture-tool', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name, arguments: args }) });
  return response.json();
};
frame.onload = async () => {
  await bridge?.close();
  bridge = new AppBridge(null, { name: 'King Down local harness', version: '1' }, { serverTools: {}, updateModelContext: {} }, { hostContext: { displayMode: 'inline', availableDisplayModes: ['inline', 'fullscreen'] } });
  bridge.oncalltool = async params => {
    (window as any).harnessCalls ??= []; (window as any).harnessCalls.push(params);
    const result = await invoke(params.name, params.arguments ?? {});
    if ((window as any).dropNextMoveReply && params.name === 'kingdown_move') { (window as any).dropNextMoveReply = false; throw new Error('Harness lost reply after commit'); }
    return result;
  };
  bridge.onupdatemodelcontext = async () => ({});
  bridge.onrequestdisplaymode = async ({ mode }) => { bridge!.setHostContext({ displayMode: mode }); return { mode }; };
  bridge.oninitialized = async () => {
    const result = new URLSearchParams(location.search).has('terminal') ? await (await fetch('/fixture-terminal')).json() : await invoke('kingdown_open', matchId ? { matchId } : {});
    matchId = result.structuredContent.matchId;
    await bridge!.sendToolInput({ arguments: matchId ? { matchId } : {} });
    await bridge!.sendToolResult(result);
    (window as any).harnessMatchId = matchId;
  };
  await bridge.connect(new PostMessageTransport(frame.contentWindow!, frame.contentWindow!));
};
frame.src = '/board-resource';
document.querySelector<HTMLButtonElement>('#remount')!.onclick = () => { frame.src = '/board-resource'; };
