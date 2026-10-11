/** The server's schemas for the game setup (`setup.ts`): shape here, the rules in `validate` and `validateChoice`. */
import { z } from 'zod';
import { KINGS, type KingName, type PowerName } from '../rules/rules';
import { DEAL_CARDS, POOL_KINDS, validate } from './setup';

export const optionsSchema = z.strictObject({
  fairy: z.boolean(), pool: z.array(z.enum(POOL_KINDS as [string, ...string[]])).max(POOL_KINDS.length),
  arrangement: z.boolean(), classic: z.boolean(), cards: z.boolean(),
  cardPool: z.array(z.enum(DEAL_CARDS as [(typeof DEAL_CARDS)[number], ...(typeof DEAL_CARDS)[number][]])).max(DEAL_CARDS.length), kingPowers: z.boolean(),
}).superRefine((o, ctx) => { const error = validate(o); if (error) ctx.addIssue({ code: 'custom', message: error }); });

export const choiceSchema = z.strictObject({
  king: z.strictObject({ king: z.enum(Object.keys(KINGS) as [KingName, ...KingName[]]), power: z.enum(Object.values(KINGS).flat() as [PowerName, ...PowerName[]]) }).nullable(),
  order: z.string().regex(/^[QOLRBNAGMSK]{8}$/),
});
