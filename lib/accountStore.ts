import { create } from "zustand"
import { persist } from "zustand/middleware"

import type { FailureAnalysis } from "@/lib/types"

export type PropAccountProfile = {
  id: string
  firm_name: string
  account_size: number | null
  phase: string
  status: string
  rules: Record<string, any>
  inferred: {
    confidence: number
    missing_info: string[]
  }
  failure_analysis?: FailureAnalysis   // ✅ ADD THIS
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
