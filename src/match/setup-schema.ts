/** The server's schemas for the game setup (`setup.ts`): shape here, the rules in `validate` and `validateChoice`. */
import { z } from 'zod';
import type { KingName, PowerName } from '../rules/rules';
import { DEAL_CARDS, POOL_KINDS, validate } from './setup';

export const optionsSchema = z.strictObject({
  fairy: z.boolean(), pool: z.array(z.enum(POOL_KINDS as [string, ...string[]])).max(POOL_KINDS.length),
  arrangement: z.boolean(), classic: z.boolean(), cards: z.boolean(),
  cardPool: z.array(z.enum(DEAL_CARDS as [(typeof DEAL_CARDS)[number], ...(typeof DEAL_CARDS)[number][]])).max(DEAL_CARDS.length), kingPowers: z.boolean(),
}).superRefine((o, ctx) => { const error = validate(o); if (error) ctx.addIssue({ code: 'custom', message: error }); });

/** Shape only: an existing game admits stable IDs through its stored setup contract. */
export const choiceSchema = z.strictObject({
  king: z.strictObject({ king: z.string().regex(/^[A-Za-z]{1,32}$/) as z.ZodType<KingName>, power: z.string().regex(/^[A-Za-z]{1,32}$/) as z.ZodType<PowerName> }).nullable(),
  order: z.string().regex(/^[A-Z]{8}$/),
});
