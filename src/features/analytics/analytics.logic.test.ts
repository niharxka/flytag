import { normalizeSource, sourceFromQuery } from './analytics.logic';

describe('normalizeSource', () => {
  it('lowercases and joins words with _', () => {
    expect(normalizeSource('  Instagram Story ')).toBe('instagram_story');
  });
  it('drops characters the database would reject', () => {
    expect(normalizeSource('discord!!<script>')).toBe('discordscript');
  });
  it('caps the tag at 40 characters', () => {
    expect(normalizeSource('a'.repeat(60))).toHaveLength(40);
  });
  it('treats empty or junk-only values as no tag', () => {
    expect(normalizeSource('')).toBeNull();
    expect(normalizeSource('!!!')).toBeNull();
    expect(normalizeSource(undefined)).toBeNull();
  });
});

describe('sourceFromQuery', () => {
  it('reads utm_source among other params', () => {
    expect(sourceFromQuery('?ref=x&utm_source=WhatsApp&utm_medium=group')).toBe('whatsapp');
  });
  it('is null when the link has no tag', () => {
    expect(sourceFromQuery('?ref=x')).toBeNull();
    expect(sourceFromQuery('')).toBeNull();
  });
});
