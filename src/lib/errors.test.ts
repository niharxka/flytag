import { errorMessage } from './errors';

describe('errorMessage', () => {
  it('passes through the signup hook copy', () => {
    expect(errorMessage({ status: 403, message: 'Use your @ucsd.edu email.' })).toBe(
      'Use your @ucsd.edu email.',
    );
  });
  it('maps known auth codes', () => {
    expect(errorMessage({ code: 'otp_expired', status: 403 })).toMatch(/wrong or has expired/);
    // Sign in with an email that has no account (shouldCreateUser: false).
    expect(errorMessage({ code: 'otp_disabled', status: 422 })).toMatch(/Sign up instead/);
  });
  it('treats any 429 as a rate limit', () => {
    expect(errorMessage({ status: 429, code: 'something_new' })).toMatch(/Wait a minute/);
  });
  it('explains network failures', () => {
    expect(errorMessage(new TypeError('Network request failed'))).toMatch(/Can’t reach FlyTag/);
  });
  it('says the last seat went to someone else', () => {
    expect(errorMessage({ code: 'P0001', message: 'RIDE_FULL' })).toBe('This ride just filled up.');
  });
  it('maps RPC error codes', () => {
    expect(errorMessage({ code: 'P0001', message: 'INVALID_TIME' })).toMatch(/time in the future/);
  });
  it('falls back to a generic line', () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(errorMessage({ code: 'mystery' })).toBe('Something went wrong. Try again.');
  });
});
