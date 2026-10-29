// Class names come from the generated token map, so `bg-mist`, `p-space-4`, `rounded-pill`,
// `h-control-md` exist and Tailwind's default palette/scale don't (no off-brand values).
const tokens = require('./src/theme/tailwind.tokens.js');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    colors: { transparent: 'transparent', ...tokens.colors },
    spacing: { 0: '0px', px: '1px', ...tokens.spacing },
    borderRadius: { none: '0px', ...tokens.borderRadius },
    fontFamily: tokens.fontFamily,
    extend: {},
  },
  plugins: [],
};
