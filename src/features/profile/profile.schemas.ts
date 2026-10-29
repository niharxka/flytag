import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { z } from 'zod';

export const INTENTS = ['none', 'networking', 'flypal'] as const;
export type IntentChoice = (typeof INTENTS)[number];

/** Value of the home picker when the rider chose "Somewhere else" instead of a college. */
export const CUSTOM_HOME = 'custom';

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

/**
 * Home is a college OR a custom label (the database enforces "not both").
 * The form keeps two fields, the picker choice (a college id, or CUSTOM_HOME) and the label,
 * and this turns them into exactly one of { collegeId } / { homeLabel }.
 */
const homeFields = {
  homeChoice: z.string().min(1, { error: 'Pick where you live.' }),
  homeLabel: z.string().trim().max(40, { error: 'Keep it to 40 characters.' }),
};
function toHome<T extends { homeChoice: string; homeLabel: string }>(v: T, ctx: z.RefinementCtx) {
  const { homeChoice, homeLabel, ...rest } = v;
  if (homeChoice !== CUSTOM_HOME) return { ...rest, collegeId: homeChoice, homeLabel: null };
  if (!homeLabel) {
    ctx.addIssue({ code: 'custom', path: ['homeLabel'], message: 'Add a neighbourhood or area.' });
    return z.NEVER;
  }
  return { ...rest, collegeId: null, homeLabel };
}

const sharedFields = {
  ...homeFields,
  intent: z.enum(INTENTS),
  phone: phoneSchema,
  sharePhone: z.boolean(),
};
const phoneToShare = (v: { sharePhone: boolean; phone?: string }) => !v.sharePhone || Boolean(v.phone);
const phoneToShareIssue = { path: ['phone'], error: 'Add a number to share it.' };

export const onboardingSchema = z
  .object(sharedFields)
  .refine(phoneToShare, phoneToShareIssue)
  .transform(toHome);

export const editProfileSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(1, { error: 'Add a name riders will know you by.' })
      .max(30, { error: 'Keep it to 30 characters.' }),
    ...sharedFields,
  })
  .refine(phoneToShare, phoneToShareIssue)
  .transform(toHome);

export type OnboardingInput = z.input<typeof onboardingSchema>;
export type Onboarding = z.output<typeof onboardingSchema>;
export type EditProfileInput = z.input<typeof editProfileSchema>;
export type EditProfile = z.output<typeof editProfileSchema>;
