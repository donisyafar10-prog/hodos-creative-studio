import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        helix: {
          bg: '#f2140c',
          fg: '#f7f3ee',
        },
      },
      fontFamily: {
        anton: ['var(--font-anton)', 'sans-serif'],
        inter: ['var(--font-inter-tight)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
