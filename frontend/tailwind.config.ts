import type { Config } from 'tailwindcss';

export default {
  content: ['./app/(customer)/**/*.{ts,tsx}', './components/baduma/**/*.{ts,tsx}'],
  // Keep the customer design system isolated from the existing Ceyteq workspace.
  prefix: 'bd-',
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: { baduma: { gold: '#D4AF37', ink: '#121212' } },
    },
  },
  plugins: [],
} satisfies Config;
