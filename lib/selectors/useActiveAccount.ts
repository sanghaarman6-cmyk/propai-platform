import { useMT5Store } from "@/lib/mt5Store"
import type { MT5Account } from "@/lib/mt5Store"

type ActiveAccountSnapshot = {
  id: string
  firmKey?: string
  rulesConfirmed?: boolean
}

export function useActiveAccount(): ActiveAccountSnapshot | null {
  return useMT5Store((s: { accounts: MT5Account[]; activeAccountId: string | null }) => {
    const account = s.accounts.find(
      (x: MT5Account) => x.id === s.activeAccountId
    )

    if (!account) return null

    return {
      id: account.id,
      firmKey: account.firmKey,
      rulesConfirmed: account.rulesConfirmed,
    }
  })
}
