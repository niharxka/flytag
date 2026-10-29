import { postRideSchema } from './rides.schemas';

const inTwoHours = () => new Date(Date.now() + 2 * 60 * 60 * 1000);
const base = () => ({
  direction: 'to_airport' as const,
  departAt: inTwoHours(),
  seatsMax: 4,
  meetSpot: '',
  notes: '',
  estTotalCostCents: '',
});

describe('postRideSchema', () => {
  it('accepts a normal ride and drops blank optionals', () => {
    const r = postRideSchema.parse(base());
    expect(r.meetSpot).toBeUndefined();
    expect(r.estTotalCostCents).toBeUndefined();
  });
  it('rejects a time in the past or under 30 minutes out', () => {
    expect(postRideSchema.safeParse({ ...base(), departAt: new Date(Date.now() - 60_000) }).success).toBe(
      false,
    );
    expect(
      postRideSchema.safeParse({ ...base(), departAt: new Date(Date.now() + 10 * 60_000) }).success,
    ).toBe(false);
  });
  it('rejects more than 90 days out', () => {
    expect(
      postRideSchema.safeParse({ ...base(), departAt: new Date(Date.now() + 91 * 86_400_000) }).success,
    ).toBe(false);
  });
  it('keeps seats between 2 and 6', () => {
    expect(postRideSchema.safeParse({ ...base(), seatsMax: 1 }).success).toBe(false);
    expect(postRideSchema.safeParse({ ...base(), seatsMax: 7 }).success).toBe(false);
  });
  it('turns a typed fare into cents', () => {
    expect(postRideSchema.parse({ ...base(), estTotalCostCents: '$48.50' }).estTotalCostCents).toBe(4850);
    expect(postRideSchema.safeParse({ ...base(), estTotalCostCents: '600' }).success).toBe(false);
    expect(postRideSchema.safeParse({ ...base(), estTotalCostCents: 'lots' }).success).toBe(false);
  });
  it('trims the meet spot and caps notes', () => {
    expect(postRideSchema.parse({ ...base(), meetSpot: '  Sixth market ' }).meetSpot).toBe('Sixth market');
    expect(postRideSchema.safeParse({ ...base(), notes: 'x'.repeat(281) }).success).toBe(false);
  });
});
