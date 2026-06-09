import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // Split heavy vendors into their own chunks so the main bundle stays small.
        // Function form only chunks packages actually present in the graph, so
        // unused dependencies are never force-bundled.
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('three') || id.includes('@react-three')) return 'three'
          if (id.includes('lightweight-charts')) return 'charts'
          if (id.includes('react-markdown') || id.includes('micromark') || id.includes('mdast') || id.includes('hast')) return 'markdown'
          if (id.includes('react-router')) return 'react-vendor'
          if (id.includes('/react/') || id.includes('/react-dom/')) return 'react-vendor'
          return 'vendor'
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.js']
  },
})
