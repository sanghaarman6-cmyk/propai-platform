import { useMT5Store } from "@/lib/mt5Store"
import type { MT5Account } from "@/lib/mt5Store"

export function useActiveAccountLive(): MT5Account | null {
  return useMT5Store((s) => {
    if (s.accounts.length === 0) return null

    // ✅ If no active account yet, fall back to first account
    return (
      s.accounts.find((a) => a.id === s.activeAccountId) ??
      s.accounts[0]
    )
  })
}
