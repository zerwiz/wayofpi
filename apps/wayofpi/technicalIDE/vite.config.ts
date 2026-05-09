import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@wop": resolve(__dirname, "../wayofpi-ui/src"),
    },
  },
  server: {
    port: 5174,
    strictPort: false,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3333',
        changeOrigin: true,
      },
      '/ws': {
        target: 'http://127.0.0.1:3333',
        ws: true,
        changeOrigin: true,
      },
    },
    cors: true,
  },
})
