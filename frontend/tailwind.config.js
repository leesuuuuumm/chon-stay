/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#1C1B18",
          soft: "#514E47",
          faint: "#8A8579",
        },
        clay: {
          50: "#FBF6EC",
          100: "#F3E8D2",
          200: "#E4CFA0",
          300: "#D0AF71",
          400: "#B78F4F",
          500: "#9C7A42",
          600: "#7C6236",
          700: "#5E492A",
        },
        leaf: {
          50: "#EEF3E7",
          100: "#DCE8CD",
          400: "#7FA05F",
          500: "#5F7F45",
          600: "#4A6636",
        },
        sand: {
          DEFAULT: "#FAF7F1",
          dark: "#F1EADC",
        },
        line: "#E7E1D4",
      },
      fontFamily: {
        sans: [
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "Apple SD Gothic Neo",
          "Malgun Gothic",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px rgba(28,27,24,0.04), 0 4px 16px rgba(28,27,24,0.06)",
      },
      maxWidth: {
        app: "480px",
      },
    },
  },
  plugins: [],
};
