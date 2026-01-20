/**
 * FocusTimer Website - Configuration
 */

tailwind.config = {
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                primary: "#e8dcb9",
                "primary-dark": "#d4c59f",
                "background-light": "#ffffff",
                "background-dark": "#1a1a1a",
                "text-light": "#4a4a4a",
                "text-dark": "#e0e0e0",
                "accent-dark": "#333333",
            },
            fontFamily: {
                display: ["Merriweather", "serif"],
                sans: ["Inter", "sans-serif"],
            },
            boxShadow: {
                'deep': '0 20px 40px -5px rgba(0, 0, 0, 0.1), 0 10px 20px -5px rgba(0, 0, 0, 0.04)',
                'button': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255,255,255,0.4)',
            }
        },
    },
};
