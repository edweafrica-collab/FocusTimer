/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src_v2/**/*.{html,js}"],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                // Standard Brand Colors - All themes derive from these
                "primary": "#3b82f6",        // Bright Blue - Primary actions (High Contrast)
                "primary-hover": "#2563eb",  // Darker blue for hover states
                "accent": "#d91c26",         // Crimson Red - Warnings/accents
                "accent-hover": "#b0161f",   // Darker red for hover
                "background-dark": "#0a0a0a",// Deep black background
                "surface-dark": "#1a1a1a",   // Card/surface backgrounds
                "surface-light": "#2a2a2a",  // Lighter surfaces
                "text-muted": "#888888"      // Muted text
            },
            fontFamily: {
                "display": ["Inter", "sans-serif"],
                "timer": ["Space Grotesk", "monospace"],
                "viewer": ["Oswald", "sans-serif"]
            },
            boxShadow: {
                'glow': '0 0 40px -10px rgba(58, 182, 118, 0.15)',
            }
        },
    }
}
