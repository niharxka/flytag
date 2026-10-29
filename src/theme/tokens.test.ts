import { colors, type } from './tokens';

// Guards the generator (scripts/build-tokens.ts): if tokens.json changes shape, these break
// before a screen silently renders an undefined colour.
describe('generated tokens', () => {
  it('defines every colour in both themes', () => {
    expect(Object.keys(colors.dark).sort()).toEqual(Object.keys(colors.light).sort());
  });

  it('resolves the focus alias to sky-deep in each theme', () => {
    expect(colors.light.focus).toBe(colors.light.skyDeep);
    expect(colors.dark.focus).toBe(colors.dark.skyDeep);
  });

  it('keeps body text at 16 or larger and drops the slides-only fine style', () => {
    expect(type.body.fontSize).toBeGreaterThanOrEqual(16);
    expect(type).not.toHaveProperty('fine');
  });
});
