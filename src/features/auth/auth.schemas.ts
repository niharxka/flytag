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

export const signInSchema = z.object({
  email: emailSchema,
  // Optional: returning riders already have a name, and Supabase ignores it for them (§9.2 AC).
  displayName: z
    .string()
    .trim()
    .max(30, { error: 'Keep it to 30 characters.' })
    .optional()
    .transform((v) => v || undefined),
});
export type SignInInput = z.input<typeof signInSchema>;
export type SignIn = z.output<typeof signInSchema>;

export const codeSchema = z
  .string()
  .regex(new RegExp(`^\\d{${CODE_LENGTH}}$`), { error: 'Enter the 6-digit code.' });
