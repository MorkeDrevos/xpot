// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /**
         * VAULT GOLD
         * This REMAPS all amber-* utilities globally
         * so existing Tailwind classes become premium gold
         */
        amber: {
          50:  "rgb(var(--xpot-gold-2) / 0.10)",
          100: "rgb(var(--xpot-gold-2) / 0.16)",
          200: "rgb(var(--xpot-gold-2) / 0.24)",
          300: "rgb(var(--xpot-gold-2) / 0.40)",
          400: "rgb(var(--xpot-gold-2) / 0.70)",
          500: "rgb(var(--xpot-gold) / 1)",
          600: "rgb(198 150 52 / 1)",
          700: "rgb(170 120 34 / 1)",
          800: "rgb(128 88 22 / 1)",
          900: "rgb(92 62 14 / 1)",
          950: "rgb(46 28 6 / 1)",
        },

        /**
         * YELLOW → also mapped to Vault Gold
         * (many gradients use yellow-* as highlight)
         */
        yellow: {
          50:  "rgb(var(--xpot-gold-2) / 0.10)",
          100: "rgb(var(--xpot-gold-2) / 0.16)",
          200: "rgb(var(--xpot-gold-2) / 0.24)",
          300: "rgb(var(--xpot-gold-2) / 0.40)",
          400: "rgb(var(--xpot-gold-2) / 0.70)",
          500: "rgb(var(--xpot-gold) / 1)",
          600: "rgb(198 150 52 / 1)",
          700: "rgb(170 120 34 / 1)",
          800: "rgb(128 88 22 / 1)",
          900: "rgb(92 62 14 / 1)",
          950: "rgb(46 28 6 / 1)",
        },
      },
    },
  },
  plugins: [],
};
