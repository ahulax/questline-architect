/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                "bg-panel": "var(--bg-panel)",
                "bg-card": "var(--bg-card)",
                "bg-void": "var(--bg-void)",
                text: {
                    primary: "var(--text-primary)",
                    secondary: "var(--text-secondary)",
                    muted: "var(--text-muted)",
                },
                primary: "var(--primary)",
                secondary: "var(--secondary)",
                accent: "var(--accent)",
                border: {
                    subtle: "var(--border-subtle)",
                },
                status: {
                    active: "var(--status-active)",
                    done: "var(--status-done)",
                    dropped: "var(--status-dropped)",
                },
                alert: "var(--alert)",
            },
            fontFamily: {
                fantasy: ["var(--font-fantasy)", "serif"],
                display: ["var(--font-fantasy-header)", "serif"],
                sans: ["var(--font-fantasy)", "serif"], // Fallback for defaults
            },
        },
    },
    plugins: [],
};
