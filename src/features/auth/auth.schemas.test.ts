import { codeSchema, emailSchema, signInSchema, signUpSchema } from './auth.schemas';

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
  it('sign up needs a display name; a blank one doesn’t count', () => {
    const r = signUpSchema.safeParse({ email: 'a@ucsd.edu', displayName: '   ' });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toBe('Add the name riders will see.');
  });
  it('sign in needs only the email', () => {
    expect(signInSchema.safeParse({ email: 'a@ucsd.edu' }).success).toBe(true);
  });
  it('needs exactly 6 digits for a code', () => {
    expect(codeSchema.safeParse('123456').success).toBe(true);
    expect(codeSchema.safeParse('12345').success).toBe(false);
    expect(codeSchema.safeParse('12a456').success).toBe(false);
  });
});
