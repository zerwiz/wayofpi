import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@wayofpi-server": resolve(__dirname, "../wayofpi-server"),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3333',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://127.0.0.1:3333',
        ws: true,
      },
    },
    hmr: {
      port: 5173,
      protocol: 'ws',
      enabled: true,
    },
    cors: true,
  },
  define: {
    'import.meta.env.DEV': process.env.NODE_ENV !== 'production',
  },
})
