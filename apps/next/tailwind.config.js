const { theme } = require('../../packages/app/design/tailwind/theme')

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: [
    './pages/**/*.{js,jsx,ts,tsx}',
    '../../packages/**/*.{js,jsx,ts,tsx}',
    './app/**/**/*.{js,ts,jsx,tsx,mdx}',
    '!../../*/**/node_modules/**/*.{html,js}',
  ],
  safelist: [
    // Gradient classes used dynamically in packages/ui/components/flowbite/masonry.tsx
    // These cannot be detected by Tailwind JIT when interpolated into className strings
    'bg-gradient-to-br',
    'from-violet-600',
    'to-indigo-600',
    'from-rose-500',
    'to-pink-500',
    'from-amber-500',
    'to-orange-500',
    'from-emerald-500',
    'to-teal-500',
    'from-sky-500',
    'to-blue-600',
    'from-fuchsia-500',
    'to-purple-600',
  ],
  theme: {
    ...theme,
  },
  extends: '@repo/ui/tailwind.config',
}
