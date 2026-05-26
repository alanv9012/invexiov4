import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "rgb(var(--color-background) / <alpha-value>)",
        foreground: "rgb(var(--color-foreground) / <alpha-value>)",
        surface: {
          DEFAULT: "rgb(var(--color-surface) / <alpha-value>)",
          muted: "rgb(var(--color-surface-muted) / <alpha-value>)"
        },
        border: {
          DEFAULT: "rgb(var(--color-border) / <alpha-value>)",
          strong: "rgb(var(--color-border-strong) / <alpha-value>)"
        },
        muted: {
          DEFAULT: "rgb(var(--color-muted) / <alpha-value>)",
          foreground: "rgb(var(--color-muted-foreground) / <alpha-value>)"
        },
        primary: {
          DEFAULT: "rgb(var(--color-primary) / <alpha-value>)",
          foreground: "rgb(var(--color-primary-foreground) / <alpha-value>)",
          hover: "rgb(var(--color-primary-hover) / <alpha-value>)"
        },
        sidebar: {
          DEFAULT: "rgb(var(--color-sidebar) / <alpha-value>)",
          foreground: "rgb(var(--color-sidebar-foreground) / <alpha-value>)",
          muted: "rgb(var(--color-sidebar-muted) / <alpha-value>)",
          accent: "rgb(var(--color-sidebar-accent) / <alpha-value>)"
        },
        success: {
          DEFAULT: "rgb(var(--color-success) / <alpha-value>)",
          foreground: "rgb(var(--color-success-foreground) / <alpha-value>)",
          muted: "rgb(var(--color-success-muted) / <alpha-value>)",
          border: "rgb(var(--color-success-border) / <alpha-value>)"
        },
        warning: {
          DEFAULT: "rgb(var(--color-warning) / <alpha-value>)",
          foreground: "rgb(var(--color-warning-foreground) / <alpha-value>)",
          muted: "rgb(var(--color-warning-muted) / <alpha-value>)",
          border: "rgb(var(--color-warning-border) / <alpha-value>)"
        },
        danger: {
          DEFAULT: "rgb(var(--color-danger) / <alpha-value>)",
          foreground: "rgb(var(--color-danger-foreground) / <alpha-value>)",
          muted: "rgb(var(--color-danger-muted) / <alpha-value>)",
          border: "rgb(var(--color-danger-border) / <alpha-value>)"
        },
        info: {
          DEFAULT: "rgb(var(--color-info) / <alpha-value>)",
          foreground: "rgb(var(--color-info-foreground) / <alpha-value>)",
          muted: "rgb(var(--color-info-muted) / <alpha-value>)",
          border: "rgb(var(--color-info-border) / <alpha-value>)"
        }
      },
      spacing: {
        sidebar: "16rem",
        "page-x": "var(--space-page-x)",
        "page-y": "var(--space-page-y)",
        card: "var(--space-card)",
        "card-sm": "var(--space-card-sm)"
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        DEFAULT: "var(--radius-md)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        card: "var(--radius-card)",
        button: "var(--radius-button)"
      },
      boxShadow: {
        card: "var(--shadow-card)",
        drawer: "var(--shadow-drawer)",
        modal: "var(--shadow-modal)"
      },
      fontSize: {
        display: ["1.5rem", { lineHeight: "2rem", fontWeight: "600" }],
        title: ["1.25rem", { lineHeight: "1.75rem", fontWeight: "600" }],
        "body-sm": ["0.875rem", { lineHeight: "1.25rem" }],
        caption: ["0.75rem", { lineHeight: "1rem" }]
      },
      transitionDuration: {
        DEFAULT: "150ms",
        slow: "250ms"
      },
      transitionTimingFunction: {
        DEFAULT: "ease",
        out: "cubic-bezier(0.16, 1, 0.3, 1)"
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" }
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" }
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" }
        }
      },
      animation: {
        "fade-in": "fade-in 200ms ease-out forwards",
        "slide-up": "slide-up 240ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "page-enter": "slide-up 280ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
        shimmer: "shimmer 1.4s ease-in-out infinite"
      },
      screens: {
        xs: "480px"
      },
      maxWidth: {
        content: "80rem"
      }
    }
  },
  plugins: []
};

export default config;
