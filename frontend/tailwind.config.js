/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#F4F5F7",
        bg_sidebar: "#1B2A4A",
        fg: "#1A2332",
        fg_sidebar: "#CDD6E4",
        accent: {
          DEFAULT: "#2563EB",
          hover: "#1D4ED8",
          light: "#DBEAFE",
          subtle: "#EFF6FF",
        },
        border: {
          DEFAULT: "#D1D5DB",
          light: "#E5E7EB",
        },
        muted: "#6B7280",
        danger: {
          DEFAULT: "#EF4444",
          light: "#FEE2E2",
        },
        warning: {
          DEFAULT: "#F59E0B",
          light: "#FEF3C7",
        },
        success: "#10B981",
        card_bg: "#FFFFFF",
        overlay: "rgba(0,0,0,0.4)",
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "system-ui",
          "sans-serif",
        ],
      },
      fontSize: {
        xs: "12px",
        sm: "14px",
        base: "16px",
        lg: "18px",
        xl: "22px",
        "2xl": "28px",
      },
      spacing: {
        0: "4px",
        1: "8px",
        2: "12px",
        3: "16px",
        4: "24px",
        5: "32px",
        6: "48px",
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
        pill: "999px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06)",
        "card-hover": "0 4px 16px rgba(0,0,0,0.08)",
        "ticket-hover": "0 4px 12px rgba(0,0,0,0.1)",
        toast: "0 8px 24px rgba(0,0,0,0.2)",
      },
      minWidth: {
        "column": "280px",
      },
      maxWidth: {
        "column": "340px",
        "toast": "380px",
        "search": "480px",
      },
    },
  },
  plugins: [],
};
