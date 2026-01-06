import { useMT5Store } from "@/lib/mt5Store"

export function useHasAccounts() {
  return useMT5Store((s) => s.accounts.length > 0)
}
