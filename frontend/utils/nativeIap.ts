/**
 * Native StoreKit / Play Billing via Capgo — only runs inside Capacitor.
 * Web Paywall never imports this module; it only calls window.__smonoIapPurchase when native.
 */
import { Capacitor } from '@capacitor/core'
import { NativePurchases, PURCHASE_TYPE } from '@capgo/native-purchases'
import { getNativeProductId } from '../services/iap.service'

export type NativePurchaseResult = {
  platform: 'ios' | 'android'
  receipt?: string
  purchaseToken?: string
  transactionId?: string
}

/** Installs window.__smonoIapPurchase used by Paywall on native only. */
export function installNativeIapBridge(): void {
  if (!Capacitor.isNativePlatform()) return

  ;(window as unknown as { __smonoIapPurchase?: () => Promise<NativePurchaseResult> }).__smonoIapPurchase =
    async () => {
      const billing = await NativePurchases.isBillingSupported()
      if (!billing.isBillingSupported) {
        throw new Error('In-app purchases are not available on this device.')
      }

      const productId = getNativeProductId()
      const productType =
        Capacitor.getPlatform() === 'android' ? PURCHASE_TYPE.SUBS : PURCHASE_TYPE.INAPP

      const transaction = await NativePurchases.purchaseProduct({
        productIdentifier: productId,
        productType,
        quantity: 1,
      })

      const platform = Capacitor.getPlatform() === 'ios' ? 'ios' : 'android'
      return {
        platform,
        receipt: transaction.receipt,
        purchaseToken: transaction.purchaseToken,
        transactionId: transaction.transactionId,
      }
    }
}
