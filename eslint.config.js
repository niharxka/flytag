// Lint = Expo's defaults + the folder rules from spec §4.2, written as plain import bans so
// each folder's block reads like a row of the table. Cross-folder imports always use the `@/`
// alias, which is what makes these patterns reliable.
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');

// Importing another feature's internals (`@/features/rides/rides.api`) instead of its index.
const featureInternals = {
  group: ['@/features/*/*'],
  message: "Import a feature only through its index.ts (e.g. '@/features/rides').",
};
const supabase = {
  group: ['@supabase/*'],
  message: 'Supabase calls live only in *.api.ts files and src/lib/supabase.ts.',
};
const noFeatures = { group: ['@/features', '@/features/*'], message: 'This layer may not import features.' };
const noRoutes = { group: ['@/app', '@/app/*'], message: 'Nothing imports route files.' };
const noUi = { group: ['@/ui', '@/ui/*'], message: 'lib/ and theme/ sit below ui/ and may not import it.' };

// Colours must come from tokens. Matches "#abc", "#a1b2c3", "#a1b2c3d4" in strings and templates.
const HEX = '/#[0-9a-fA-F]{3,8}\\b/';
const noHex = [
  'error',
  { selector: `Literal[value=${HEX}]`, message: 'Use a colour token, not a hex literal.' },
  { selector: `TemplateElement[value.raw=${HEX}]`, message: 'Use a colour token, not a hex literal.' },
];

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  {
    ignores: ['dist/*', 'src/theme/tokens.ts', 'src/theme/tailwind.tokens.js', 'src/lib/database.types.ts'],
  },
  {
    files: ['src/app/**'],
    rules: { 'no-restricted-imports': ['error', { patterns: [featureInternals, supabase] }] },
  },
  {
    // Every file in src/app becomes a route that Metro bundles into the app, so tests (and
    // their Node-only imports) must live elsewhere. See src/routing.test.tsx.
    files: ['src/app/**/*.test.*'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Program',
          message: 'Tests can’t live in src/app: every file there is bundled as a route.',
        },
      ],
    },
  },
  {
    files: ['src/features/**'],
    ignores: ['src/features/**/*.api.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [featureInternals, noRoutes, supabase] }],
      'no-restricted-syntax': noHex,
    },
  },
  {
    files: ['src/features/**/*.api.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [featureInternals, noRoutes] }],
      'no-restricted-syntax': noHex,
    },
  },
  {
    files: ['src/ui/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            noFeatures,
            noRoutes,
            supabase,
            { group: ['@/lib/*', '!@/lib/dates'], message: 'ui/ may only use lib/dates from lib/.' },
            { group: ['@tanstack/*'], message: 'ui/ is presentational: no data fetching.' },
          ],
        },
      ],
      'no-restricted-syntax': noHex,
    },
  },
  {
    files: ['src/lib/**'],
    ignores: ['src/lib/supabase.ts'],
    rules: { 'no-restricted-imports': ['error', { patterns: [noFeatures, noRoutes, noUi, supabase] }] },
  },
  {
    files: ['src/lib/supabase.ts'],
    rules: { 'no-restricted-imports': ['error', { patterns: [noFeatures, noRoutes, noUi] }] },
  },
  {
    files: ['src/theme/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            noFeatures,
            noRoutes,
            noUi,
            { group: ['@/lib', '@/lib/*'], message: 'theme/ imports only theme/.' },
          ],
        },
      ],
    },
  },
]);
