import { CUSTOM_HOME, editProfileSchema, onboardingSchema } from './profile.schemas';

const base = { homeChoice: 'c1', homeLabel: '', intent: 'none' as const, phone: '', sharePhone: false };

describe('onboardingSchema', () => {
  it('needs a home', () => {
    expect(onboardingSchema.safeParse({ ...base, homeChoice: '' }).success).toBe(false);
  });
  it('a college home has no label', () => {
    expect(onboardingSchema.parse({ ...base, homeLabel: 'ignored' })).toMatchObject({
      collegeId: 'c1',
      homeLabel: null,
    });
  });
  it('a custom home needs a label and has no college', () => {
    expect(onboardingSchema.safeParse({ ...base, homeChoice: CUSTOM_HOME }).error?.issues[0].message).toBe(
      'Add a neighbourhood or area.',
    );
    expect(
      onboardingSchema.parse({ ...base, homeChoice: CUSTOM_HOME, homeLabel: ' Pacific Beach ' }),
    ).toMatchObject({
      collegeId: null,
      homeLabel: 'Pacific Beach',
    });
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

describe('editProfileSchema', () => {
  it('requires a display name, trimmed, up to 30', () => {
    expect(editProfileSchema.safeParse({ ...base, displayName: '   ' }).success).toBe(false);
    expect(editProfileSchema.safeParse({ ...base, displayName: 'x'.repeat(31) }).success).toBe(false);
    expect(editProfileSchema.parse({ ...base, displayName: ' Niharika ' }).displayName).toBe('Niharika');
  });
});
