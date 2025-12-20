import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './frontend'),
    },
  },
  server: {
    port: 5175,
    host: true,
  },
  preview: {
    port: 5175,
    host: true,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Ensure proper handling of SPA routes
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
      output: {
        manualChunks: {
          // Split vendor chunks for better caching
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['framer-motion', 'lucide-react'],
          'query-vendor': ['@tanstack/react-query'],
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'chart-vendor': ['recharts', 'd3'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
  // Copy public files to dist
  publicDir: 'public',
})

