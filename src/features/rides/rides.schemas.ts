import { z } from 'zod';

const MIN_LEAD_MS = 30 * 60 * 1000; // §8.5: at least 30 minutes from now
const MAX_AHEAD_MS = 90 * 24 * 60 * 60 * 1000; // ≤ 90 days, same as create_ride

const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, { error: `${label} can be up to ${max} characters.` })
    .transform((v) => v || undefined);

export const postRideSchema = z.object({
  direction: z.enum(['to_airport', 'to_campus']),
  departAt: z
    .date()
    .refine((d) => d.getTime() >= Date.now() + MIN_LEAD_MS && d.getTime() <= Date.now() + MAX_AHEAD_MS, {
      error: 'Pick a time at least 30 minutes from now, up to 90 days out.',
    }),
  seatsMax: z.number().int().min(2).max(6),
  meetSpot: optionalText(80, 'Meet spot'),
  notes: optionalText(280, 'Notes'),
  // Typed as dollars ("48" or "48.50"); stored as cents. Blank means no estimate.
  estTotalCostCents: z
    .string()
    .trim()
    .transform((raw, ctx) => {
      if (raw === '') return undefined;
      const dollars = Number(raw.replace(/^\$/, ''));
      if (!Number.isFinite(dollars) || dollars < 0 || dollars > 500) {
        ctx.addIssue({ code: 'custom', message: 'Enter a fare from $0 to $500.' });
        return z.NEVER;
      }
      return Math.round(dollars * 100);
    }),
});

export type PostRideInput = z.input<typeof postRideSchema>;
export type PostRide = z.output<typeof postRideSchema>;
