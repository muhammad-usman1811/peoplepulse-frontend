/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            colors: {
                brand: {
                    DEFAULT: '#2C6F7F',
                    light: '#EAF3F5',
                    dark: '#245D69',
                },
            },
        },
    },
    corePlugins: {
        preflight: false,
    },
};