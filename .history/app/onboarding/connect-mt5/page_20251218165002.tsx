"use client"
export const dynamic = "force-dynamic"


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
 * Partial updates allowed, but `id` is mandatory
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
   * ✅ SAFE MERGE
   * Never overwrites valid values with `undefined` or transient bad data.
   */
  addOrUpdateAccount: (incoming: MT5AccountUpdate) =>
    set((state) => {
      const existing = state.accounts.find(
        (a) => a.id === incoming.id
      )

      const merged: MT5Account = existing
        ? {
            ...existing,

            // 🔒 guarded numeric fields
            balance:
              incoming.balance !== undefined
                ? incoming.balance
                : existing.balance,

            equity:
              incoming.equity !== undefined
                ? incoming.equity
                : existing.equity,

            // 🔒 guarded identity fields
            login: incoming.login ?? existing.login,
            server: incoming.server ?? existing.server,
            name: incoming.name ?? existing.name,
            currency: incoming.currency ?? existing.currency,

            // 🔒 status / metadata
            status: incoming.status ?? existing.status,
            firmDetected:
              incoming.firmDetected ?? existing.firmDetected,
            baselineBalance:
              incoming.baselineBalance ?? existing.baselineBalance,

            // 🔒 complex objects
            metrics: incoming.metrics ?? existing.metrics,

            positions:
              incoming.positions ??
              existing.positions ??
              [],

            history:
              incoming.history ??
              existing.history ??
              [],

            lastSync: Date.now(),
          }
        : {
            // First insert (must eventually be a full payload)
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
    set({ activeAccountId: id }),
}))
