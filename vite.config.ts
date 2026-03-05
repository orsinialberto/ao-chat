import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const proxyTarget = process.env.VITE_API_PROXY_TARGET || 'http://localhost:3001'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Split node_modules into separate chunks
          if (id.includes('node_modules')) {
            // Leaflet maps (large library, check before react-leaflet)
            if (id.includes('leaflet') || id.includes('react-leaflet')) {
              return 'leaflet-vendor'
            }
            // Charts library
            if (id.includes('recharts')) {
              return 'recharts-vendor'
            }
            // Markdown processing
            if (id.includes('react-markdown') || id.includes('remark') || id.includes('rehype')) {
              return 'markdown-vendor'
            }
            // Syntax highlighter
            if (id.includes('react-syntax-highlighter')) {
              return 'syntax-vendor'
            }
            // React ecosystem (React, React DOM, React Router, React Query)
            // Check these after more specific libraries to avoid false matches
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router') || id.includes('react-query')) {
              return 'react-vendor'
            }
            // All other vendor code
            return 'vendor'
          }
          // Return undefined for app code (will be automatically chunked)
          return undefined
        },
      },
    },
    // Increase chunk size warning limit slightly since we're now splitting chunks properly
    chunkSizeWarningLimit: 600,
  },
})
