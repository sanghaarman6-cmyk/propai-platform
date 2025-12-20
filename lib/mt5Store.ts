import { create } from "zustand"

/* ---------- TYPES ---------- */

export type MT5Metrics = {
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

export type MT5Account = {
  id: string
  login?: number
  server?: string
  name?: string
  currency?: string
  balance?: number
  equity?: number
  baselineBalance?: number
  firmDetected?: string
  status?: "connecting" | "connected" | "error" | "archived"
  metrics?: MT5Metrics
  positions?: any[]
  history?: any[]
  lastSync?: number
  createdAt?: number
}

type MT5State = {
  accounts: MT5Account[]
  activeAccountId: string | null

  addOrUpdateAccount: (
    account: Partial<MT5Account> & { id: string }
  ) => void

  setActiveAccount: (id: string) => void
  removeAccount: (id: string) => void
  reset: () => void
}

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  )
}

/* ---------- STORE ---------- */

export const useMT5Store = create<MT5State>((set) => ({
  accounts: [],
  activeAccountId: null,

  addOrUpdateAccount: (incoming) =>
    set((state) => {
      const existing = state.accounts.find(
        (a) =>
          a.login === incoming.login &&
          a.server === incoming.server
      )

      // Prefer DB UUID when it arrives
      const incomingIsUuid = isUuid(incoming.id)
      const existingIsUuid = existing ? isUuid(existing.id) : false

      const finalId =
        incomingIsUuid
          ? incoming.id
          : existing?.id ?? incoming.id

      const merged: MT5Account = existing
        ? {
            ...existing,
            ...incoming,
            id: finalId,
            positions:
              incoming.positions ?? existing.positions ?? [],
            history: incoming.history ?? existing.history ?? [],
            metrics: incoming.metrics ?? existing.metrics,
            lastSync: Date.now(),
          }
        : {
            ...incoming,
            id: finalId,
            positions: incoming.positions ?? [],
            history: incoming.history ?? [],
            createdAt: Date.now(),
            lastSync: Date.now(),
          }

      // If active account was old non-uuid id, move it to the uuid id
      const activeAccountId =
        state.activeAccountId &&
        existing &&
        state.activeAccountId === existing.id &&
        existing.id !== finalId
          ? finalId
          : state.activeAccountId ?? finalId

      return {
        accounts: existing
          ? state.accounts.map((a) =>
              a.id === existing.id ? merged : a
            )
          : [...state.accounts, merged],
        activeAccountId,
      }
    }),

  setActiveAccount: (id) => set({ activeAccountId: id }),

  removeAccount: (id) =>
    set((state) => {
      const remaining = state.accounts.filter(
        (a) => a.id !== id
      )

      return {
        accounts: remaining,
        activeAccountId:
          state.activeAccountId === id
            ? remaining[0]?.id ?? null
            : state.activeAccountId,
      }
    }),

  reset: () =>
    set({
      accounts: [],
      activeAccountId: null,
    }),
}))
