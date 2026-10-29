import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { z } from 'zod';

export const INTENTS = ['none', 'networking', 'flypal'] as const;
export type IntentChoice = (typeof INTENTS)[number];

/** Optional phone, typed any common way ("858 555 0100", "+1 (858)…"), stored as E.164. */
const phoneSchema = z
  .string()
  .trim()
  .transform((raw, ctx) => {
    if (raw === '') return undefined;
    // Students without a +country code are almost always US numbers.
    const parsed = parsePhoneNumberFromString(raw, 'US');
    if (!parsed?.isValid()) {
      ctx.addIssue({ code: 'custom', message: 'That doesn’t look like a phone number.' });
      return z.NEVER;
    }
    return parsed.number; // E.164, e.g. +18585550100
  });

export const onboardingSchema = z
  .object({
    collegeId: z.string().min(1, { error: 'Pick your home college.' }),
    intent: z.enum(INTENTS),
    phone: phoneSchema,
    sharePhone: z.boolean(),
  })
  .refine((v) => !v.sharePhone || v.phone, { path: ['phone'], error: 'Add a number to share it.' });

export type OnboardingInput = z.input<typeof onboardingSchema>;
export type Onboarding = z.output<typeof onboardingSchema>;
