// Fills %SITE_URL% in the built dist/index.html (link-preview tags need a full https:// URL).
// On Vercel, VERCEL_PROJECT_PRODUCTION_URL is set automatically to the production domain, so
// previews always point at the live site, even from preview deploys. SITE_URL overrides it
// (e.g. a custom domain). Without either, the tags fall back to relative paths.
import { readFileSync, writeFileSync } from 'node:fs';

const host = process.env.SITE_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '');
const file = 'dist/index.html';
const html = readFileSync(file, 'utf8');
writeFileSync(file, html.replaceAll('%SITE_URL%', host.replace(/\/$/, '')));
console.log(`site url: ${host || '(none, relative paths)'}`);
