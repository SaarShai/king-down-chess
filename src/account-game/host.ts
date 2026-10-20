import type { Screen } from './types';
import type { WidgetHost } from '../plugin/client';
import type { ToolResult } from '../plugin/queue';

export type GameTransport = (name: string, args: Record<string, unknown>, options: { timeout?: number; signal?: AbortSignal }) => Promise<ToolResult>;
export type RuntimeContext = {
  theme?: 'light' | 'dark'; displayMode?: string; availableDisplayModes?: string[];
  deviceCapabilities?: { touch?: boolean }; safeAreaInsets?: Partial<Record<'top' | 'right' | 'bottom' | 'left', number>>;
};
/** The common screen runtime uses transport, lifecycle and page state. Only the plugin adapter imports the SDK. */
export interface AccountGameHost {
  call: GameTransport;
  stateHost?: WidgetHost;
  onResult?: (result: ToolResult) => void;
  onClose?: () => void;
  onTeardown?: () => Promise<{}>;
  onContext?: () => void;
  connect(): Promise<void>;
  dispose?(): void;
  getHostContext(): RuntimeContext | undefined;
  requestDisplayMode(input: { mode: 'fullscreen' }): Promise<{ mode: string }>;
  openLink(input: { url: string }): Promise<{ isError?: boolean }>;
  updateModelContext?(input: { structuredContent: { status: string; your_turn: boolean } }): Promise<unknown>;
  route?(screen: Screen, gameId?: string): void;
}
let host: AccountGameHost | undefined;
export function configureRuntime(value: AccountGameHost): void { host = value; }
export function runtimeHost(): AccountGameHost {
  if (!host) throw new Error('The account game host is not configured.');
  return host;
}
