import { useMT5Store } from "@/lib/mt5Store"

export function useActiveAccount() {
  const { accounts, activeAccountId } = useMT5Store()

  return accounts.find((a) => a.id === activeAccountId) ?? null
}
