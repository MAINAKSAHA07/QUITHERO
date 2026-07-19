import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const rootEnv = loadEnv(mode, path.resolve(__dirname, '..'), '')
  const pbTarget = (
    rootEnv.VITE_POCKETBASE_URL ||
    process.env.VITE_POCKETBASE_URL ||
    'http://127.0.0.1:8096'
  ).replace(/\/$/, '')
  const apiTarget = rootEnv.VITE_PUSH_PROXY_TARGET || 'http://127.0.0.1:8787'

  const pbProxy = {
    '/api/pocketbase': {
      target: pbTarget,
      changeOrigin: true,
      rewrite: (p: string) => p.replace(/^\/api\/pocketbase/, ''),
    },
    '/api/create-order': {
      target: apiTarget,
      changeOrigin: true,
    },
    '/api/preview-coupon': {
      target: apiTarget,
      changeOrigin: true,
    },
    '/api/verify-payment': {
      target: apiTarget,
      changeOrigin: true,
    },
  }

  return {
    plugins: [react()],
    envDir: path.resolve(__dirname, '..'),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5177,
      host: true,
      proxy: pbProxy,
    },
    preview: {
      port: 5177,
      host: true,
      proxy: pbProxy,
    },
    publicDir: 'public',
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      emptyOutDir: true,
    },
  }
})
