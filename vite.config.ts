import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:3001'

  return {
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
            if (id.includes('node_modules')) {
              if (id.includes('leaflet') || id.includes('react-leaflet')) {
                return 'leaflet-vendor'
              }
              if (id.includes('recharts')) {
                return 'recharts-vendor'
              }
              if (id.includes('react-markdown') || id.includes('remark') || id.includes('rehype')) {
                return 'markdown-vendor'
              }
              if (id.includes('react-syntax-highlighter')) {
                return 'syntax-vendor'
              }
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router') || id.includes('react-query')) {
                return 'react-vendor'
              }
              return 'vendor'
            }
            return undefined
          },
        },
      },
      chunkSizeWarningLimit: 600,
    },
  }
})
