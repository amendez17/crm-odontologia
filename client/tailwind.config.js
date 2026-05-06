/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
  50: '#fffefb',
  100: '#fdf8ee',
  200: '#f7ebcb',
  300: '#eed9a0',
  400: '#e3c57a',
  500: '#d6b25e',
  600: '#c29d4d',
  700: '#a27f3d',
  800: '#7b6030',
  900: '#574321',
},
        dental: {
  50: '#fffef9',
  100: '#fcf6ea',
  200: '#f5e7c8',
  300: '#ecd39b',
  400: '#dfbc73',
  500: '#cfaa58',
  600: '#ba9449',
  700: '#98763a',
  800: '#72582d',
  900: '#503d20',
},
        accent: {
  50: '#fffdf8',
  100: '#faf3e4',
  200: '#f2dfb7',
  300: '#e8c987',
  400: '#dbb162',
  500: '#ca9a47',
  600: '#b2843d',
  700: '#906732',
  800: '#6d4d27',
  900: '#4b351b',
},
        surface: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
        }
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
  card: '0 2px 10px rgba(0,0,0,0.04)',
  'card-hover': '0 10px 30px rgba(0,0,0,0.08)',
  sidebar: '4px 0 20px rgba(0,0,0,0.06)',
  glow: '0 0 18px rgba(212, 175, 55, 0.18)',
  'glow-teal': '0 0 18px rgba(20, 184, 166, 0.15)',
},
      backgroundImage: {
  'gradient-dental':'linear-gradient(135deg, #cfaa58 0%, #e8c987 45%, #fffef9 100%)',
  'gradient-accent':'linear-gradient(135deg, #d6b25e 0%, #f2dfb7 100%)',
  'gradient-sidebar':'linear-gradient(180deg, #5b4525 0%, #a27f3d 55%, #cfaa58 100%)',
  'gradient-header':'linear-gradient(135deg, #ffffff 0%, #fdf8ee 100%)',
  'gradient-surface':'linear-gradient(135deg, #ffffff 0%, #faf8f3 100%)',
},
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
