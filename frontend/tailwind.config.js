import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({
    plugins: [
        tailwindcss(),
    ],
})
module.exports = {
    darkMode: 'class', // ✅ must be 'class'
    content: ['./src/**/*.{js,jsx,ts,tsx}'],
    theme: {
        extend: {},
    },
    plugins: [],
};
