import { z } from 'zod';

/** §8.5: 1–1000 characters after trimming. The table checks the same length. */
export const messageBodySchema = z
  .string()
  .trim()
  .min(1)
  .max(1000, { error: 'Keep it under 1000 characters.' });
