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
  baselineBalance?: number

  metrics?: {
    ddTodayUsd: number
    ddTodayPct: number
    ddTotalUsd: number
    ddTotalPct: number

    dailyLimitUsd: number
    maxLimitUsd: number
    dailyRemainingUsd: number
    maxRemainingUsd: number

    phase: "Phase 1" | "Phase 2" | "Funded" | "Unknown"
    status: "in_progress" | "passed" | "failed" | "unknown"
    riskScore: number
  }

  positions?: any[]
  history?: any[]

  lastSync?: number
}

/**
 * ✅ FINAL: partial updates allowed, but `id` is mandatory
 * This supports polling, AI updates, Supabase sync, etc.
 */
export type MT5AccountUpdate = Partial<MT5Account> & {
  id: string
}

type MT5State = {
  accounts: MT5Account[]
  activeAccountId: string | null

  addOrUpdateAccount: (account: MT5AccountUpdate) => void
  setActiveAccount: (id: string) => void
}

/* ---------- STORE ---------- */

export const useMT5Store = create<MT5State>((set) => ({
  accounts: [],
  activeAccountId: null,

  /**
   * Safely MERGES incoming MT5 data.
   * Supports partial updates without corrupting state.
   */
  addOrUpdateAccount: (incoming: MT5AccountUpdate) =>
    set((state) => {
      const existing = state.accounts.find(
        (a) => a.id === incoming.id
      )

      const merged: MT5Account = existing
        ? {
            ...existing,
            ...incoming,
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
            // first insert MUST eventually receive full account data
            ...(incoming as MT5Account),
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

        activeAccountId: merged.id,
      }
    }),

  setActiveAccount: (id: string) =>
    set({
      activeAccountId: id,
    }),
}))
