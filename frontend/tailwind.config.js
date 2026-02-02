/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Semantic colors
        success: {
          DEFAULT: '#10b981',
          light: '#d1fae5',
        },
        warning: {
          DEFAULT: '#f59e0b',
          light: '#fef3c7',
        },
        error: {
          DEFAULT: '#ef4444',
          light: '#fee2e2',
        },
        info: {
          DEFAULT: '#3b82f6',
          light: '#dbeafe',
        },
        // Regional colors
        region: {
          muntenia: '#f97316',
          transilvania: '#a855f7',
          moldova: '#0ea5e9',
          banat: '#22c55e',
          dobrogea: '#06b6d4',
          maramures: '#ef4444',
          neamt: '#3b82f6',
          alba: '#eab308',
        }
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px rgba(0, 0, 0, 0.07)',
        lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
        xl: '0 20px 25px rgba(0, 0, 0, 0.1)',
      },
      backdropFilter: {
        'blur-md': 'blur(12px)',
      }
    },
  },
  plugins: [],
}
