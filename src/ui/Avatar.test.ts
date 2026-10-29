import { withAlpha } from '@/theme/color';
import { colors } from '@/theme/tokens';

import { initials, toneForName } from './Avatar';

describe('Avatar helpers', () => {
  it('takes at most two initials', () => {
    expect(initials('niharika ann sapre')).toBe('NA');
    expect(initials('  Jake ')).toBe('J');
    expect(initials('')).toBe('');
  });

  it('gives the same name the same tone every time', () => {
    expect(toneForName('Jake')).toBe(toneForName('Jake'));
    expect(['sky', 'deep', 'charcoal']).toContain(toneForName('Silvia'));
  });
});

describe('withAlpha', () => {
  it('turns a token hex into rgba', () => {
    // sky-deep in Mist is #245c96.
    expect(withAlpha(colors.light.skyDeep, 0.18)).toBe('rgba(36,92,150,0.18)');
  });
  it('rejects anything that is not #rrggbb', () => {
    expect(() => withAlpha('rgba(0,0,0,1)', 0.5)).toThrow();
  });
});
