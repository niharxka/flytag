import { errorMessage } from './errors';

describe('errorMessage', () => {
  it('passes through the signup hook copy', () => {
    expect(errorMessage({ status: 403, message: 'Use your @ucsd.edu email.' })).toBe(
      'Use your @ucsd.edu email.',
    );
  });
  it('maps known auth codes', () => {
    expect(errorMessage({ code: 'otp_expired', status: 403 })).toMatch(/wrong or has expired/);
  });
  it('treats any 429 as a rate limit', () => {
    expect(errorMessage({ status: 429, code: 'something_new' })).toMatch(/Wait a minute/);
  });
  it('explains network failures', () => {
    expect(errorMessage(new TypeError('Network request failed'))).toMatch(/Can’t reach FlyTag/);
  });
  it('falls back to a generic line', () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(errorMessage({ code: 'mystery' })).toBe('Something went wrong. Try again.');
  });
});
