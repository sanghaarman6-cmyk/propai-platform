import { create } from "zustand"
import { persist } from "zustand/middleware"

export type PropAccountProfile = {
  id: string
  firm_name: string
  account_size: number | null

  phase: "Phase 1" | "Phase 2" | "Funded" | "Unknown"
  status:
    | "Active"
    | "Failed"
    | "Passed"
    | "Drawdown Hit"
    | "Expired"
    | "Unknown"

  rules: {
    profit_target_pct?: number
    daily_drawdown_pct?: number
    max_drawdown_pct?: number
    min_trading_days?: number
  }

  inferred: {
    confidence: number
    missing_info: string[]
  }

  notes: string
}

type AccountState = {
  accounts: PropAccountProfile[]
  addAccount: (a: PropAccountProfile) => void
  updateAccount: (id: string, p: Partial<PropAccountProfile>) => void
}

export const useAccountStore = create<AccountState>()(
  persist(
    (set) => ({
      accounts: [],
      addAccount: (a) =>
        set((s) => ({ accounts: [...s.accounts, a] })),
      updateAccount: (id, p) =>
        set((s) => ({
          accounts: s.accounts.map((a) =>
            a.id === id ? { ...a, ...p } : a
          ),
        })),
    }),
    { name: "prop-accounts" }
  )
)
