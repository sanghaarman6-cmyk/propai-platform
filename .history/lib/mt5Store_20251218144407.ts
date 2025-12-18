import { create } from "zustand"

/* ---------- TYPES ---------- */

export type MT5Account = {
  id: string
  login: number
  server: string
  name: string
  balance: number
  equity: number
  currency: string

  firmDetected?: string
  status?: string

  metrics?: {
    // drawdown used (USD + %)
    ddTodayUsd: number
    ddTodayPct: number
    ddTotalUsd: number
    ddTotalPct: number

    // limits (USD)
    dailyLimitUsd: number
    maxLimitUsd: number
    dailyRemainingUsd: number
    maxRemainingUsd: number

    // prop status (simple for now)
    phase: "Phase 1" | "Phase 2" | "Funded" | "Unknown"
    status: "in_progress" | "passed" | "failed" | "unknown"
    riskScore: number // 0–100
  }


  positions?: any[]
  history?: any[]

  lastSync?: number
}

type MT5State = {
  accounts: MT5Account[]
  activeAccountId: string | null

  addOrUpdateAccount: (account: MT5Account) => void
  setActiveAccount: (id: string) => void
}

/* ---------- STORE ---------- */

export const useMT5Store = create<MT5State>((set) => ({
  accounts: [],
  activeAccountId: null,

  /**
   * Safely MERGES incoming MT5 data.
   * This prevents flicker, zero resets, and partial overwrites during polling.
   */
  addOrUpdateAccount: (incoming) =>
    set((state) => {
      const existing = state.accounts.find(
        (a) => a.id === incoming.id
      )

      const merged: MT5Account = existing
        ? {
            ...existing,                 // 👈 preserve old data
            ...incoming,                 // 👈 overwrite updated fields only
            positions:
              incoming.positions ??
              existing.positions ??
              [],
            history:
              incoming.history ??
              existing.history ??
              [],
            metrics:
              incoming.metrics ??
              existing.metrics,
            lastSync: Date.now(),
          }
        : {
            ...incoming,
            positions: incoming.positions ?? [],
            history: incoming.history ?? [],
            lastSync: Date.now(),
          }

      return {
        accounts: existing
          ? state.accounts.map((a) =>
              a.id === merged.id ? merged : a
            )
          : [...state.accounts, merged],

        // auto-select most recent account
        activeAccountId: merged.id,
      }
    }),

  setActiveAccount: (id: string) =>
    set({
      activeAccountId: id,
    }),
}))
