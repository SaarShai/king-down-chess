import type { KingChoice } from '../rules/rules';
import type { PluginTool } from '../plugin/tool-names';

export const SCREENS = ['home', 'play', 'friend', 'join', 'wait', 'lobby', 'seat', 'board', 'end', 'profile', 'collection', 'settings', 'handle'] as const;
export type Screen = typeof SCREENS[number];
export type Pending = { name: string; args: Record<string, unknown>; game_tag?: string; screen?: Screen; quick?: boolean; king?: KingChoice | null; error?: string; error_screen?: Screen };
export type BoardSettings = { symbols_only: boolean; show_threats: boolean };
/** The tools that change no game and no account: they run as reads, beside the lane (design §2). A saved one is never a command to resend.
 *  Each name is a PluginTool; tools/plugin-tool-table.test.ts asks for each readOnly tool of the server here. */
export const READ_TOOLS: string[] = ['kingdown_get', 'kingdown_games', 'kingdown_lobby', 'kingdown_profile'] satisfies PluginTool[];
export const CANNOT_CONNECT = 'Cannot connect. Check your connection, then try again.';
export const errorText = (error: unknown) => error instanceof Error ? error.message : String(error);
export const knownScreen = (name: unknown) => SCREENS.find(screen => screen === name);
