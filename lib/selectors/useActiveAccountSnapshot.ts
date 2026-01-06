import { useMT5Store } from "@/lib/mt5Store"
import type { MT5Account } from "@/lib/mt5Store"

export type ActiveAccountSnapshot = {
  id: string
  firmKey?: string
  firmDetected?: string
  rulesConfirmed?: boolean
}

export function useActiveAccountSnapshot(): ActiveAccountSnapshot | null {
  const activeAccountId = useMT5Store((s) => s.activeAccountId)

  const account = useMT5Store(
    (s) => s.accounts.find((a) => a.id === activeAccountId) ?? null
  )

  if (!account) return null

  return {
    id: account.id,
    firmKey: account.firmKey ?? undefined,
    firmDetected: account.firmDetected ?? undefined, // 🔥 REQUIRED
    rulesConfirmed: account.rulesConfirmed,
  }
}
