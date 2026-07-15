/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        rose: {
          50: '#fdf2f4',
          100: '#fce7eb',
          200: '#f9d0d9',
          300: '#f4a8b8',
          400: '#ec7590',
          500: '#dc4a6d',
          600: '#c92d55',
          700: '#a82145',
          800: '#8c1e3d',
          900: '#781c38',
        },
        ink: {
          900: '#1a1216',
          700: '#3d2f35',
          500: '#6b5560',
          300: '#a8949c',
        },
        sand: {
          50: '#faf7f5',
          100: '#f3ebe6',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'hero-mesh':
          'radial-gradient(ellipse 80% 60% at 20% 20%, rgba(220,74,109,0.18), transparent), radial-gradient(ellipse 60% 50% at 85% 15%, rgba(168,33,69,0.12), transparent), linear-gradient(165deg, #faf7f5 0%, #f3ebe6 45%, #fce7eb 100%)',
      },
    },
  },
  plugins: [],
};
