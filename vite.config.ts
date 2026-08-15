import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/twisto-alert/',
  optimizeDeps: {
    exclude: ['maplibre-gl'],
  },
})
