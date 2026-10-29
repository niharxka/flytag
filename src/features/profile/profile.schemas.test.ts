import { onboardingSchema } from './profile.schemas';

const base = { collegeId: 'c1', intent: 'none' as const, phone: '', sharePhone: false };

describe('onboardingSchema', () => {
  it('needs a college', () => {
    expect(onboardingSchema.safeParse({ ...base, collegeId: '' }).success).toBe(false);
  });
  it('treats a blank phone as none', () => {
    expect(onboardingSchema.parse(base).phone).toBeUndefined();
  });
  it('stores US numbers as E.164', () => {
    expect(onboardingSchema.parse({ ...base, phone: '(858) 534-2230' }).phone).toBe('+18585342230');
  });
  it('rejects numbers that cannot exist', () => {
    expect(onboardingSchema.safeParse({ ...base, phone: '123' }).success).toBe(false);
  });
  it('won’t share a phone that isn’t there', () => {
    const r = onboardingSchema.safeParse({ ...base, sharePhone: true });
    expect(r.error?.issues[0].message).toBe('Add a number to share it.');
  });
});
