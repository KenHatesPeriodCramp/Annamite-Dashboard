/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Fira Mono', 'monospace'],
      },
      colors: {
        bg:      '#f4f7fb',
        surface: '#ffffff',
        panel:   '#ffffff',
        border:  '#e2e8f0',
        accent:  '#2563eb',
        success: '#059669',
        danger:  '#dc2626',
        warn:    '#d97706',
        purple:  '#7c3aed',
        orange:  '#ea580c',
        muted:   '#64748b',
        text:    '#1e293b',
      },
    },
  },
  plugins: [],
}
