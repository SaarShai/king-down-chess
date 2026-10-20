import { App } from '@modelcontextprotocol/ext-apps';
import { configureRuntime, type AccountGameHost } from '../account-game/host';
import type { WidgetHost } from './client';

const app = new App({ name: 'King Down', version: '1.0.0' }, { availableDisplayModes: ['inline', 'fullscreen'] });
const host: AccountGameHost = {
  stateHost: (window as Window & { openai?: WidgetHost }).openai,
  call: (name, args, options) => app.callServerTool({ name, arguments: args }, options),
  async connect() {
    app.ontoolresult = result => host.onResult?.(result);
    app.onclose = () => host.onClose?.();
    app.onteardown = async () => host.onTeardown?.() ?? {};
    app.onhostcontextchanged = () => host.onContext?.();
    await app.connect();
  },
  getHostContext: () => app.getHostContext(),
  requestDisplayMode: input => app.requestDisplayMode(input),
  openLink: input => app.openLink(input),
  updateModelContext: input => app.updateModelContext(input),
};
configureRuntime(host);
