import PocketBase from 'pocketbase'

const env = import.meta.env
const isProd = env?.PROD === true || process.env.NODE_ENV === 'production'
const PB_URL = isProd
  ? '/api/pocketbase'
  : (env?.VITE_POCKETBASE_URL as string | undefined) || 'http://localhost:8096'

export const pb = new PocketBase(PB_URL)
