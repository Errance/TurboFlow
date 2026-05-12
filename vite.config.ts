import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/TurboFlow/',
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('lightweight-charts')) return 'charts'
          if (id.includes('react') || id.includes('react-dom')) return 'react'
          if (id.includes('zustand')) return 'state'
          return 'vendor'
        },
      },
    },
  },
})
