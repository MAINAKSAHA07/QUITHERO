import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const rootEnv = loadEnv(mode, path.resolve(__dirname, '..'), '')
  const pbTarget = (
    rootEnv.VITE_POCKETBASE_URL ||
    rootEnv.AWS_POCKETBASE_URL ||
    'http://54.153.95.239:8096'
  ).replace(/\/$/, '')
  // Same EC2 host as the app push proxy — local 8787 only if API server is running.
  const apiTarget = (
    rootEnv.VITE_PUSH_PROXY_TARGET ||
    rootEnv.AWS_PUBLIC_URL ||
    'http://54.153.95.239'
  ).replace(/\/$/, '')

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5176,
      host: true,
      proxy: {
        '/api/pocketbase': {
          target: pbTarget,
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\/pocketbase/, ''),
        },
        '/api/push': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/api/support': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/api/coach': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/api/admin': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/api/email': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
    preview: {
      port: 5176,
      host: true,
    },
    root: './',
    publicDir: 'public',
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-vendor': ['lucide-react'],
            'query-vendor': ['@tanstack/react-query'],
            'table-vendor': ['@tanstack/react-table'],
            'chart-vendor': ['d3'],
          },
        },
      },
      chunkSizeWarningLimit: 600,
      minify: 'esbuild',
    },
    esbuild: {
      drop: ['console', 'debugger'],
    },
  }
})





