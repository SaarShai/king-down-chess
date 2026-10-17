import { z } from 'zod';
import type { Pool } from 'pg';
import { id, parse } from '../match/service';
import { choiceSchema, optionsSchema } from '../match/setup-schema';
import { ONLINE_VISIBLE_TO } from '../account/profile';
import { KINGS } from '../rules/rules';

export const lastSetupSchema = z.strictObject({
 kind: z.enum(['solo', 'friend', 'random']), options: optionsSchema, colour: z.enum(['white', 'black', 'random']),
 level: z.enum(['beginner', 'casual', 'club', 'strong']),
 king: choiceSchema.shape.king.refine(king => !king || KINGS[king.king].includes(king.power)),
});
/** `online_visible_to` is not stored here: PluginService.settings() writes it to profiles.online_visible_to. */
export const settingsSchema = z.strictObject({ symbols_only: z.boolean().optional(), show_threats: z.boolean().optional(), online_visible_to: z.enum(ONLINE_VISIBLE_TO).optional(), last_setup: lastSetupSchema.optional() });
export interface PlayerSettings { symbols_only: boolean; show_threats: boolean; online_visible_to: typeof ONLINE_VISIBLE_TO[number]; last_setup: z.infer<typeof lastSetupSchema> | null }
export class SettingsService {
 constructor(private pool: Pool) {}
 async settings(actor: string, input: unknown = {}): Promise<Omit<PlayerSettings, 'online_visible_to'>> {
  actor = id(actor); const { online_visible_to: _, ...changes } = parse(settingsSchema, input);
  if (Object.keys(changes).length) await this.pool.query(`insert into public.player_settings as s (user_id,symbols_only,show_threats,last_setup) values($1,coalesce($2,false),coalesce($3,false),$4)
   on conflict (user_id) do update set symbols_only=coalesce($2,s.symbols_only),show_threats=coalesce($3,s.show_threats),last_setup=coalesce($4,s.last_setup)`,
   [actor, changes.symbols_only ?? null, changes.show_threats ?? null, changes.last_setup ?? null]);
  return (await this.pool.query('select symbols_only,show_threats,last_setup from public.player_settings where user_id=$1', [actor])).rows[0] ?? { symbols_only: false, show_threats: false, last_setup: null };
 }
}
