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
  50: '#fffdf7',
  100: '#fff7e6',
  200: '#fbe7b2',
  300: '#f5d27a',
  400: '#e6c35a',
  500: '#d4af37', // ⭐ dorado principal
  600: '#b8922e',
  700: '#8f6f22',
  800: '#5f4916',
  900: '#3a2c0d',
},
        dental: {
  50: '#f0fffc',
  100: '#ccf7f1',
  200: '#99efe3',
  300: '#66e0d1',
  400: '#33cbb8',
  500: '#14b8a6',
  600: '#0f8f82',
  700: '#0d6f65',
  800: '#0a4f49',
  900: '#073531',
},
        accent: {
  50: '#fffdf5',
  100: '#fff3d6',
  200: '#ffe6a3',
  300: '#ffd36b',
  400: '#f5c242',
  500: '#e0a82e',
  600: '#c78f1f',
  700: '#9f6e16',
  800: '#7a5210',
  900: '#5a3b0b',
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
  'gradient-dental': 'linear-gradient(135deg, #d4af37 0%, #f5d27a 50%, #fff7e6 100%)',
  'gradient-teal': 'linear-gradient(135deg, #0f766e 0%, #14b8a6 50%, #ccf7f1 100%)',
  'gradient-accent': 'linear-gradient(135deg, #e0a82e 0%, #ffd36b 100%)',
  'gradient-sidebar': 'linear-gradient(180deg, #3a2c0d 0%, #8f6f22 100%)',
  'gradient-header': 'linear-gradient(135deg, #ffffff 0%, #fff7e6 100%)',
  'gradient-surface': 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
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
