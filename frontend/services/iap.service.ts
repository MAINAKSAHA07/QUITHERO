import pb from '../lib/pocketbase'
import { apiUrl, isNativePlatform } from '../utils/apiOrigin'

export type IapVerifyInput = {
  platform: 'ios' | 'android'
  productId: string
  receipt?: string
  purchaseToken?: string
  country?: string
}

function authHeaders(): HeadersInit {
  const token = pb.authStore.token
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: token } : {}),
  }
}

export function shouldUseNativeIap(): boolean {
  return isNativePlatform()
}

export async function verifyIapPurchase(payload: IapVerifyInput): Promise<{ success: boolean; already?: boolean }> {
  const res = await fetch(apiUrl('/api/iap/verify'), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || `IAP verification failed (${res.status})`)
  }
  return data
}

/** Product id from env — store listing must match server IAP_PRODUCT_IDS allowlist. */
export function getNativeProductId(): string {
  return (import.meta.env.VITE_IAP_PRODUCT_ID as string) || 'smono_premium'
}
