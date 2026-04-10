/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: "#3C81C6",
                    hover: "#2a6da8",
                },
                secondary: "#C6E7FF",
                notification: "#D4F6FF",
                success: "#D2F7E1",
                warning: "#FFF3CC",
                error: "#FA707A",
                neutral: "#F6F6F6",
            },
            fontFamily: {
                display: ["Inter", "sans-serif"],
            },
            animation: {
                "float-slow": "float 8s ease-in-out infinite",
                "float-medium": "float 6s ease-in-out infinite",
                "float-fast": "float 4s ease-in-out infinite",
                "pulse-slow": "pulse-glow 6s ease-in-out infinite",
                "ecg-line": "ecg-dash 3s linear infinite",
                marquee: "marquee 30s linear infinite",
            },
            keyframes: {
                float: {
                    "0%, 100%": { transform: "translateY(0px)" },
                    "50%": { transform: "translateY(-20px)" },
                },
                "pulse-glow": {
                    "0%, 100%": { opacity: "0.15" },
                    "50%": { opacity: "0.3" },
                },
                "ecg-dash": {
                    "0%": { strokeDashoffset: "2400" },
                    "100%": { strokeDashoffset: "0" },
                },
                marquee: {
                    "0%": { transform: "translateX(0)" },
                    "100%": { transform: "translateX(-50%)" },
                },
            },
        },
    },
    plugins: [],
};
