import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@wayofpi-server": resolve(__dirname, "../wayofpi-server/src"),
    },
  },
  server: {
    port: 5173,
  },
})
