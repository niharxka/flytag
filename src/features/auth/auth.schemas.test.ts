import { codeSchema, emailSchema, signInSchema } from './auth.schemas';

describe('auth schemas', () => {
  it('accepts UCSD email, trimmed and lowercased', () => {
    expect(emailSchema.parse('  Triton@UCSD.edu ')).toBe('triton@ucsd.edu');
  });
  it('rejects other domains with the hook’s wording', () => {
    const r = emailSchema.safeParse('me@gmail.com');
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toBe('Use your @ucsd.edu email.');
  });
  it('rejects subdomains', () => {
    expect(emailSchema.safeParse('me@eng.ucsd.edu').success).toBe(false);
  });
  it('treats a blank display name as not given', () => {
    expect(signInSchema.parse({ email: 'a@ucsd.edu', displayName: '   ' }).displayName).toBeUndefined();
  });
  it('needs exactly 6 digits for a code', () => {
    expect(codeSchema.safeParse('123456').success).toBe(true);
    expect(codeSchema.safeParse('12345').success).toBe(false);
    expect(codeSchema.safeParse('12a456').success).toBe(false);
  });
});
