import { z } from 'zod';

/** v1 is UCSD only (spec §6). The server enforces it too: see the auth_hook migration. */
export const UCSD_DOMAIN = '@ucsd.edu';
export const CODE_LENGTH = 6;

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: 'That doesn’t look like an email address.' }))
  .refine((e) => e.endsWith(UCSD_DOMAIN), { error: 'Use your @ucsd.edu email.' });

/** Sign in: existing riders only need their email. */
export const signInSchema = z.object({
  email: emailSchema,
  // Not shown on Sign in. Declared so both modes share one form type in AuthForm.
  displayName: z.string().optional(),
});

/** Sign up: the display name is required, because onboarding doesn't ask for it again. */
export const signUpSchema = z.object({
  email: emailSchema,
  // Typed as optional going in so both modes share one form type; the pipe then requires it.
  displayName: z
    .string()
    .optional()
    .pipe(
      z
        .string({ error: 'Add the name riders will see.' })
        .trim()
        .min(1, { error: 'Add the name riders will see.' })
        .max(30, { error: 'Keep it to 30 characters.' }),
    ),
});
export type AuthFormInput = z.input<typeof signInSchema>;
export type AuthFormValues = { email: string; displayName?: string };

export const codeSchema = z
  .string()
  .regex(new RegExp(`^\\d{${CODE_LENGTH}}$`), { error: 'Enter the 6-digit code.' });
