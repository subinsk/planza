module.exports = {
  purge: ['apps/**/*.{ts,html}', 'libs/web/**/*.{ts,html}'],
  mode: 'jit',
  darkMode: false,
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--primary)',
          50: 'var(--primary-50)',
          100: 'var(--primary-100)',
          200: 'var(--primary-200)',
          300: 'var(--primary-300)',
          400: 'var(--primary-400)',
          500: 'var(--primary-500)',
          600: 'var(--primary-600)',
          700: 'var(--primary-700)',
          800: 'var(--primary-800)',
          900: 'var(--primary-900)',
          950: 'var(--primary-950)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          light: 'var(--accent-light)',
          dark: 'var(--accent-dark)',
        },
        'secondary-accent': {
          DEFAULT: 'var(--secondary-accent)',
          light: 'var(--secondary-accent-light)',
          dark: 'var(--secondary-accent-dark)',
        },
        neutral: {
          50: 'var(--neutral-50)',
          100: 'var(--neutral-100)',
          200: 'var(--neutral-200)',
          300: 'var(--neutral-300)',
          400: 'var(--neutral-400)',
          500: 'var(--neutral-500)',
          600: 'var(--neutral-600)',
          700: 'var(--neutral-700)',
          800: 'var(--neutral-800)',
          900: 'var(--neutral-900)',
          950: 'var(--neutral-950)',
        },
        success: {
          DEFAULT: 'var(--success)',
          light: 'var(--success-light)',
          dark: 'var(--success-dark)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          light: 'var(--warning-light)',
          dark: 'var(--warning-dark)',
        },
        danger: {
          DEFAULT: 'var(--danger)',
          light: 'var(--danger-light)',
          dark: 'var(--danger-dark)',
        },
        info: {
          DEFAULT: 'var(--info)',
          light: 'var(--info-light)',
          dark: 'var(--info-dark)',
        },
        'primary-translucent': 'var(--primary-translucent)',
        'primary-hover': 'var(--primary-hover)',
        surface: {
          DEFAULT: 'var(--surface)',
          hover: 'var(--surface-hover)',
          active: 'var(--surface-active)',
          elevated: 'var(--surface-elevated)',
          sunken: 'var(--surface-sunken)',
        },
      },
      backgroundImage: {
        'primary-gradient': 'var(--primary-gradient)',
        'primary-gradient-alt': 'var(--primary-gradient-alt)',
        'subtle-gradient': 'var(--subtle-gradient)',
      },
      boxShadow: {
        'sm-colored': '0 1px 2px 0 rgba(104, 84, 228, 0.05)',
        'md-colored': '0 4px 6px -1px rgba(104, 84, 228, 0.07), 0 2px 4px -1px rgba(104, 84, 228, 0.05)',
        'lg-colored': '0 10px 15px -3px rgba(104, 84, 228, 0.05), 0 4px 6px -2px rgba(104, 84, 228, 0.03)',
      },
    },
    minHeight: {
      2: '40px',
    },
  },
  variants: {
    extend: {
      opacity: ['disabled'],
      cursor: ['disabled'],
      backgroundColor: ['disabled', 'active', 'group-hover'],
      textColor: ['disabled', 'active', 'group-hover'],
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/line-clamp')],
};
