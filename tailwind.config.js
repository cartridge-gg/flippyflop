module.exports = {
  mode: 'jit',
  content: ['./app/**/*.{js,ts,jsx,tsx}', './src/**/*.{js,ts,jsx,tsx}'], // remove unused styles in production
  darkMode: 'media', // or 'media' or 'class'
  theme: {
    extend: {
      keyframes: {
        'team-click': {
          '0%, 100%': { borderWidth: '8px' },
          '50%': { borderWidth: '4px' },
        },
      },
      animation: {
        'team-click': 'team-click 300ms ease-in-out',
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
