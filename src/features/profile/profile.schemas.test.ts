import { CUSTOM_HOME, editProfileSchema, MAX_SAVED_AREAS, onboardingSchema } from './profile.schemas';

const base = {
  homeChoice: 'c1',
  homeLabel: '',
  savedAreas: [] as string[],
  intent: 'none' as const,
  phone: '',
  sharePhone: false,
};

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
  it('a typed area that was never added joins the saved list', () => {
    expect(
      onboardingSchema.parse({
        ...base,
        homeChoice: CUSTOM_HOME,
        homeLabel: 'Del Mar',
        savedAreas: ['Pacific Beach'],
      }),
    ).toMatchObject({ homeLabel: 'Del Mar', savedAreas: ['Pacific Beach', 'Del Mar'] });
  });
  it("a saved area keeps its saved spelling and isn't duplicated", () => {
    expect(
      onboardingSchema.parse({
        ...base,
        homeChoice: CUSTOM_HOME,
        homeLabel: 'del mar',
        savedAreas: ['Del Mar'],
      }),
    ).toMatchObject({ homeLabel: 'Del Mar', savedAreas: ['Del Mar'] });
  });
  it("won't keep more than the maximum areas", () => {
    const full = Array.from({ length: MAX_SAVED_AREAS }, (_, i) => `Area ${i}`);
    const r = onboardingSchema.safeParse({
      ...base,
      homeChoice: CUSTOM_HOME,
      homeLabel: 'One more',
      savedAreas: full,
    });
    expect(r.error?.issues[0].message).toMatch(/Remove one first/);
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
