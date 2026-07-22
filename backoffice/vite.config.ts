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
          target: rootEnv.VITE_PUSH_PROXY_TARGET || 'http://127.0.0.1:8787',
          changeOrigin: true,
        },
        '/api/support': {
          target: rootEnv.VITE_PUSH_PROXY_TARGET || 'http://127.0.0.1:8787',
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





