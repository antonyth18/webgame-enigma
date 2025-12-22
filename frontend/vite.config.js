import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // <--- The plugin you just installed
  ],
  server: {
    proxy: {
      // Proxy API calls during development to the Express backend
      // Frontend can call `/api/...` and this will forward to `http://localhost:3000/api/...`
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})