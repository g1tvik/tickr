import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Pin the dev port so the page origin is stable. Google Sign-In rejects any
    // origin (scheme+host+PORT) that isn't registered as an Authorized JavaScript
    // origin — letting Vite drift to 5174/5178/... breaks OAuth with
    // "Access blocked: Authorization Error" (Error 400: origin_mismatch).
    // strictPort makes a busy 5173 fail loudly (so you kill the stale server)
    // instead of silently moving to an unregistered port.
    port: 5173,
    strictPort: true,
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
