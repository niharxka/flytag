/**
 * A token colour at a different opacity, e.g. withAlpha(colors.onAtmos, 0.35) for the glass
 * button rim. Only for the few places the artifact mixes a token with alpha; prefer a real token.
 */
export function withAlpha(hex: string, alpha: number): string {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) throw new Error(`withAlpha expects #rrggbb, got ${hex}`);
  const [r, g, b] = m.slice(1).map((h) => parseInt(h, 16));
  return `rgba(${r},${g},${b},${alpha})`;
}
