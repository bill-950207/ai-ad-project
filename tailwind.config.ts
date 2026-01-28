import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
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
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        // 시맨틱 컬러
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      backgroundImage: {
        // 브랜드 그라데이션
        "gradient-brand": "linear-gradient(135deg, hsl(var(--gradient-from)), hsl(var(--gradient-via)), hsl(var(--gradient-to)))",
        "gradient-brand-horizontal": "linear-gradient(90deg, hsl(var(--gradient-from)), hsl(var(--gradient-to)))",
        "gradient-brand-vertical": "linear-gradient(180deg, hsl(var(--gradient-from)), hsl(var(--gradient-to)))",
        // 표면 그라데이션
        "gradient-surface": "linear-gradient(145deg, hsl(var(--card)) 0%, hsl(240 10% 8%) 100%)",
        // 글로우 효과용
        "gradient-glow": "radial-gradient(ellipse at center, hsl(var(--primary) / 0.15), transparent 70%)",
      },
      boxShadow: {
        "glow-sm": "0 0 10px hsl(var(--primary) / 0.2), 0 0 20px hsl(var(--accent) / 0.1)",
        "glow": "0 0 20px hsl(var(--primary) / 0.3), 0 0 40px hsl(var(--accent) / 0.2)",
        "glow-lg": "0 0 30px hsl(var(--primary) / 0.4), 0 0 60px hsl(var(--accent) / 0.3)",
      },
      animation: {
        "shimmer": "shimmer 1.5s infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "gradient-shift": "gradient-shift 3s ease infinite",
      },
    },
  },
  plugins: [],
};

export default config;
