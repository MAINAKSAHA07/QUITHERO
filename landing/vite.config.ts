import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5177,
    host: true,
    proxy: {
      '/api/pocketbase': {
        target: process.env.VITE_POCKETBASE_URL || 'http://localhost:8096',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/pocketbase/, ''),
      },
    },
  },
  preview: {
    port: 5177,
    host: true,
  },
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
  },
})
