import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--bg-primary)",
        foreground: "var(--text-primary)",
        card: {
          DEFAULT: "var(--surface-default)",
          foreground: "var(--text-primary)",
        },
        popover: {
          DEFAULT: "var(--surface-default)",
          foreground: "var(--text-primary)",
        },
        primary: {
          DEFAULT: "var(--brand-500)",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "var(--bg-tertiary)",
          foreground: "var(--text-primary)",
        },
        muted: {
          DEFAULT: "var(--bg-tertiary)",
          foreground: "var(--text-muted)",
        },
        accent: {
          DEFAULT: "var(--bg-tertiary)",
          foreground: "var(--text-primary)",
        },
        destructive: {
          DEFAULT: "var(--error-500)",
          foreground: "#ffffff",
        },
        border: "var(--border-default)",
        input: "var(--border-default)",
        ring: "var(--brand-500)",
      },
      borderRadius: {
        lg: "var(--radius-lg)",
        md: "var(--radius-md)",
        sm: "var(--radius-sm)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
