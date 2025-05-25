import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        bob: {
          "0%, 100%": { transform: "translateY(-2px) translateX(-50%)" },
          "50%": { transform: "translateY(2px) translateX(-50%)" },
        },
        "confetti-fall": {
          "0%": {
            transform: "translateY(-100px) rotate(0deg) scale(1)",
            opacity: "1",
          },
          "100%": {
            transform: "translateY(100px) rotate(360deg) scale(0)",
            opacity: "0",
          },
        },
        "confetti-pop": {
          "0%": {
            transform: "translate(-50%, -50%) scale(0) rotate(0deg)",
            opacity: "0",
          },
          "50%": {
            transform:
              "translate(calc(-50% + var(--tx, 0px)), calc(-50% + var(--ty, 0px))) scale(1.2) rotate(var(--r, 0deg))",
            opacity: "1",
          },
          "100%": {
            transform:
              "translate(calc(-50% + var(--tx, 0px) * 2), calc(-50% + var(--ty, 0px) * 2)) scale(0) rotate(calc(var(--r, 0deg) + 180deg))",
            opacity: "0",
          },
        },
        "wheel-result-appear": {
          "0%": { transform: "scale(0.5)", opacity: "0" },
          "70%": { transform: "scale(1.2)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "bounce-slow": {
          "0%, 100%": { transform: "translateY(-5px)" },
          "50%": { transform: "translateY(0px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        bob: "bob 1s ease-in-out infinite",
        "confetti-fall": "confetti-fall 2s ease-out forwards",
        "confetti-pop": "confetti-pop 1s ease-out forwards",
        "wheel-result-appear": "wheel-result-appear 0.5s ease-out forwards",
        "bounce-slow": "bounce-slow 1s cubic-bezier(.12,.98,.26,1) infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
