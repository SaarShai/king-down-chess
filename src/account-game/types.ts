import type { KingChoice } from '../rules/rules';

export const SCREENS = ['home', 'play', 'friend', 'join', 'wait', 'lobby', 'seat', 'board', 'end', 'profile', 'collection', 'settings', 'handle'] as const;
export type Screen = typeof SCREENS[number];
export type Pending = { name: string; args: Record<string, unknown>; game_tag?: string; screen?: Screen; quick?: boolean; king?: KingChoice | null; error?: string; error_screen?: Screen };
export type BoardSettings = { symbols_only: boolean; show_threats: boolean };
export const CANNOT_CONNECT = 'Cannot connect. Check your connection, then try again.';
export const errorText = (error: unknown) => error instanceof Error ? error.message : String(error);
export const knownScreen = (name: unknown) => SCREENS.find(screen => screen === name);
