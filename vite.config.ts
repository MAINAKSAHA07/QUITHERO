import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const pbTarget = (
    env.VITE_POCKETBASE_URL ||
    env.AWS_POCKETBASE_URL ||
    'http://localhost:8096'
  ).replace(/\/$/, '')

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './frontend'),
      },
    },
    server: {
      port: 5175,
      host: true,
      proxy: {
        // Media uploads + API files are stored as /api/pocketbase/api/files/...
        '/api/pocketbase': {
          target: pbTarget,
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\/pocketbase/, ''),
        },
        '/api/push': {
          target: env.VITE_PUSH_PROXY_TARGET || 'http://54.153.95.239',
          changeOrigin: true,
        },
        '/api/support': {
          target: env.VITE_PUSH_PROXY_TARGET || 'http://127.0.0.1:8787',
          changeOrigin: true,
        },
        '/api/create-order': {
          target: env.VITE_PUSH_PROXY_TARGET || 'http://127.0.0.1:8787',
          changeOrigin: true,
        },
        '/api/preview-coupon': {
          target: env.VITE_PUSH_PROXY_TARGET || 'http://127.0.0.1:8787',
          changeOrigin: true,
        },
        '/api/verify-payment': {
          target: env.VITE_PUSH_PROXY_TARGET || 'http://127.0.0.1:8787',
          changeOrigin: true,
        },
        '/api/razorpay': {
          target: env.VITE_PUSH_PROXY_TARGET || 'http://127.0.0.1:8787',
          changeOrigin: true,
        },
        '/api/iap': {
          target: env.VITE_PUSH_PROXY_TARGET || 'http://127.0.0.1:8787',
          changeOrigin: true,
        },
      },
    },
    preview: {
      port: 5175,
      host: true,
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
        },
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-vendor': ['framer-motion', 'lucide-react'],
            'query-vendor': ['@tanstack/react-query'],
            'chart-vendor': ['recharts'],
          },
        },
      },
      chunkSizeWarningLimit: 600,
      minify: 'esbuild',
    },
    esbuild: {
      drop: ['console', 'debugger'],
    },
    publicDir: 'public',
  }
})
