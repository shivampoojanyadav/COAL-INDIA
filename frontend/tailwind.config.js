/**
 * MineGov design system.
 *
 * Ported from ecosankalan.in: a Material 3 surface ladder built around a deep
 * regulator green, large soft radii, tinted shadows, glass panels and blurred
 * colour blobs. Two type voices — Plus Jakarta Sans for headings and figures,
 * Inter for body and UI. Light theme only, matching the reference.
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    screens: {
      // Mobile-first. 1024 is the shell's sidebar breakpoint.
      'xs': '380px',
      '2xs': '400px',
      'sm': '480px',
      'md': '640px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },

    extend: {
      colors: {
        // ---- brand ----
        primary: {
          DEFAULT: '#005127',
          dark: '#003818',
          light: '#1b6b3a',
          // White-text-only fill. Ink on this measures 2.62:1.
          container: '#1b6b3a',
          fixed: '#a5f4b6',
          'fixed-dim': '#8ad89c',
        },
        secondary: {
          DEFAULT: '#1b6d24',
          container: '#a0f399',
          onContainer: '#217128',
        },
        tertiary: {
          DEFAULT: '#782c39',
          fixed: '#ffd9dc',
        },

        // ---- surface ladder ----
        canvas: '#f7faf3',
        card: '#ffffff',
        ink: '#181d18',
        // 8.92:1 on canvas, 8.02:1 on card.
        muted: '#404940',
        outline: '#707a6f',
        'outline-variant': '#bfc9bd',

        // Surface tones, needed for the tonal containers the app leans on.
        'surface-low': '#f1f5ed',
        'surface-container': '#ebefe8',
        'surface-high': '#e6e9e2',
        'surface-highest': '#e0e4dd',

        // ---- accents ----
        // These survive from the previous palette because risk severity needs
        // a four-step warm ramp that the brand green cannot express. Each is a
        // FILL carrying ink.
        lime: '#a0f399',
        amber: '#ff8a3d',
        sun: '#ffd9dc',
        coral: '#782c39',

        // ---- status ----
        danger: '#ba1a1a',
        dangerContainer: '#ffdad6',
        dangerText: '#ba1a1a',
        dangerOnDark: '#ffb4ab',
        onErrorContainer: '#93000a',

        // ---- hairlines ----
        line: '#e0e4dd',
        lineSoft: '#f1f5ed',
        lineStrong: '#c8cfc6',

        // ---- muted ink ramp ----
        inkRamp: {
          20: 'rgba(24, 29, 24, 0.2)',
          30: 'rgba(24, 29, 24, 0.35)',
          40: 'rgba(24, 29, 24, 0.4)',
          50: 'rgba(24, 29, 24, 0.55)',
          60: 'rgba(24, 29, 24, 0.68)',
          70: 'rgba(24, 29, 24, 0.7)',
          90: 'rgba(24, 29, 24, 0.94)',
        },

        // ---- risk severity ----
        // A warm ramp carrying ink (12.90 / 13.25 / 5.80 / 18.10:1).
        risk: {
          low: '#a0f399',
          medium: '#ffd9dc',
          high: '#ff8a3d',
          critical: '#782c39',
        },

        // ---- legacy aliases ----
        // Kept so existing markup still resolves; remapped onto the new palette.
        white: '#ffffff',
        black: '#181d18',
        cream: '#f7faf3',
        creamDeep: '#f1f5ed',
        offWhite: '#f1f5ed',
        darkWhite: '#f7faf3',
        paper: '#f7faf3',
        mist: '#f1f5ed',
        shade: '#f7faf3',
        acid: '#a0f399',
        orange: '#ff8a3d',
        pink: '#ffd9dc',
        purple: '#a0f399',
        blue: '#1b6b3a',
        darkBlue: '#1b6b3a',
        headerBlue: '#005127',
        green: '#a0f399',
        red: '#ba1a1a',
        alarm: '#ff8a3d',
        error: '#ba1a1a',
        errorText: '#ba1a1a',
        errorOnDark: '#ffb4ab',
      },

      fontFamily: {
        // The reference's two voices. `display` carries every heading and any
        // number doing emphasis work; `body` carries everything else.
        display: ['"Plus Jakarta Sans"', 'system-ui', 'Segoe UI', 'Helvetica', 'Arial', 'sans-serif'],
        body: ['Inter', 'system-ui', 'Segoe UI', 'Helvetica', 'Arial', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'Segoe UI', 'Helvetica', 'Arial', 'sans-serif'],
        // Figures in tables and IDs, where column alignment matters.
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },

      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
      },

      fontSize: {
        // --- micro / metadata ---
        micro: ['0.6875rem', { lineHeight: '1.3', letterSpacing: '0.08em' }],
        label: ['0.75rem', { lineHeight: '1.35', letterSpacing: '0.04em' }],
        // --- body ramp ---
        body: ['0.9375rem', { lineHeight: '1.55' }],
        lead: ['clamp(1rem, 0.55vw + 0.9rem, 1.125rem)', { lineHeight: '1.6' }],
        // --- display ramp ---
        d1: ['clamp(2rem, 2.2vw + 1.4rem, 3.25rem)', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        d2: ['clamp(1.625rem, 1.4vw + 1.2rem, 2.375rem)', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        d3: ['clamp(1.25rem, 0.8vw + 1rem, 1.625rem)', { lineHeight: '1.25', letterSpacing: '-0.015em' }],
        d4: ['clamp(1.0625rem, 0.4vw + 0.95rem, 1.25rem)', { lineHeight: '1.35' }],
        d5: ['1.0625rem', { lineHeight: '1.4' }],
        odo: ['clamp(2.5rem, 3vw + 1.5rem, 4.5rem)', { lineHeight: '1' }],
      },

      lineHeight: {
        display: '1.1',
        snug: '1.2',
        hero: '1.1',
        copy: '1.55',
        loose: '1.6',
      },

      borderRadius: {
        // The reference's scale: 12 / 20 / 32 / 40 / full.
        none: '0',
        chip: '12px',
        well: '12px',
        card: '20px',
        media: '20px',
        bar: '12px',
        pill: '9999px',
        full: '100%',
      },

      transitionTimingFunction: {
        // The reference's house curve, on everything.
        primary: 'cubic-bezier(0.22, 1, 0.36, 1)',
        primary2: 'cubic-bezier(0.22, 1, 0.36, 1)',
        expo: 'cubic-bezier(0.16, 1, 0.3, 1)',
        soft: 'cubic-bezier(0.4, 0, 0.2, 1)',
        loop: 'cubic-bezier(0.4, 0, 0.6, 1)',
      },

      transitionDuration: {
        100: '100ms',
        150: '150ms',
        200: '200ms',
        300: '300ms',
        500: '500ms',
        600: '600ms',
        700: '700ms',
      },

      spacing: {
        gutter: 'var(--base-padding-x)',
        section: 'var(--base-padding-y)',
      },

      maxWidth: {
        prose: '34em',
        measure: '62ch',
        container: '80rem',
      },

      zIndex: {
        content: '1',
        header: '52',
        overlay: '99',
        transition: '100',
        preloader: '200',
        blocker: '1000',
      },

      boxShadow: {
        // Tinted, low-opacity shadows — grey ones muddied the green surfaces.
        card: '0 4px 24px rgba(27, 107, 58, 0.07)',
        'card-hover': '0 16px 50px rgba(27, 107, 58, 0.12)',
        lift: '0 20px 50px rgba(27, 107, 58, 0.07)',
        float: '0 20px 50px rgba(0, 0, 0, 0.12)',
        nav: '0 20px 50px rgba(27, 107, 58, 0.07)',
        pill: '0 8px 24px rgba(0, 81, 39, 0.22)',
        'pill-lg': '0 16px 40px rgba(0, 81, 39, 0.25)',
        modal: '0 24px 64px rgba(0, 0, 0, 0.2)',
      },

      keyframes: {
        'float-bob': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'marquee-scroll': {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        'skeleton-shift': {
          from: { backgroundPosition: '200% 0' },
          to: { backgroundPosition: '-200% 0' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'pop-in': {
          from: { opacity: '0', transform: 'translateY(12px) scale(0.98)' },
          to: { opacity: '1', transform: 'none' },
        },
        'sheet-up': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'none' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(1rem)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
      },

      animation: {
        'float-bob': 'float-bob 5s cubic-bezier(0.22, 1, 0.36, 1) infinite',
        marquee: 'marquee-scroll 28s linear infinite',
        skeleton: 'skeleton-shift 1.4s ease-in-out infinite',
        'fade-in': 'fade-in 200ms cubic-bezier(0.22, 1, 0.36, 1)',
        'fade-up': 'fade-up 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        'pop-in': 'pop-in 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        'sheet-up': 'sheet-up 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-right': 'slide-in-right 300ms cubic-bezier(0.16,1,0.3,1)',
      },
    },
  },

  plugins: [],
}