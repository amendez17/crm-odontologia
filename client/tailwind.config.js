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
          50: '#eef8ff',
          100: '#d8eeff',
          200: '#b9e0ff',
          300: '#89cfff',
          400: '#52b4ff',
          500: '#2196f3',
          600: '#1a7ad4',
          700: '#1565c0',
          800: '#0d47a1',
          900: '#0a3475',
        },
        dental: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        accent: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
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
        'card': '0 2px 12px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 8px 25px rgba(0, 0, 0, 0.1)',
        'sidebar': '4px 0 24px rgba(0, 0, 0, 0.08)',
        'glow': '0 0 20px rgba(33, 150, 243, 0.15)',
        'glow-teal': '0 0 20px rgba(20, 184, 166, 0.15)',
      },
      backgroundImage: {
        'gradient-dental': 'linear-gradient(135deg, #1565c0 0%, #2196f3 50%, #42a5f5 100%)',
        'gradient-teal': 'linear-gradient(135deg, #0f766e 0%, #14b8a6 50%, #2dd4bf 100%)',
        'gradient-accent': 'linear-gradient(135deg, #ea580c 0%, #f97316 50%, #fb923c 100%)',
        'gradient-sidebar': 'linear-gradient(180deg, #0d47a1 0%, #1565c0 40%, #1a7ad4 100%)',
        'gradient-header': 'linear-gradient(135deg, #f8fafc 0%, #eef8ff 100%)',
        'gradient-surface': 'linear-gradient(135deg, #f0fdfa 0%, #eef8ff 100%)',
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
