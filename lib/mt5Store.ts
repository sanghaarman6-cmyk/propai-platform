import { create } from "zustand"
import { persist } from "zustand/middleware"

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

  userId?: string

  login?: number
  server?: string
  name?: string
  currency?: string
  leverage?: number | null

  label?: string | null

  balance?: number
  equity?: number
  baselineBalance?: number | null

  firmDetected?: string | null
  firmKey?: string | null
  firmName?: string | null

  program?: string | null
  programKey?: string | null

  phase?: string | null
  accountSize?: number | null
  platform?: string | null

  status?: "connecting" | "connected" | "error" | "archived"

  metrics?: MT5Metrics

  positions?: any[]
  positionsClosed?: any[]
  closedTrades?: any[]

  history?: any[]
  closedDeals?: any[]

  lastSync?: number
  createdAt?: number

  ruleset?: any
  rulesConfirmed?: boolean

  /** 🔒 RISK / FINANCIAL RULES (USED BY DASHBOARD) */
  riskRules?: {
    drawdown: {
      daily?: {
        percent: number
        model:
          | "static_balance"
          | "static_equity"
          | "trailing_balance"
          | "trailing_equity"
      }
      max: {
        percent: number
        model:
          | "static_balance"
          | "static_equity"
          | "trailing_balance"
          | "trailing_equity"
      }
    }
    profitTargetPct?: number
  }

  /** 📜 BEHAVIORAL / TRADING RULES */
  tradeRules?: {
    minTradingDays?: number
    maxTradingDays?: number
    weekendHoldingAllowed?: boolean
    newsTradingAllowed?: boolean
    eaAllowed?: boolean
  }
}

/* ---------- STORE STATE ---------- */

type MT5State = {
  accounts: MT5Account[]
  activeAccountId: string | null
  refreshNonce: number
  bumpRefresh: () => void

  addOrUpdateAccount: (account: Partial<MT5Account> & { id: string }) => void
  setActiveAccount: (id: string | null) => void
  removeAccount: (id: string) => void
  reset: () => void
  hasHydrated: boolean
  setHasHydrated: (v: boolean) => void

}

/* ---------- HELPERS ---------- */

function mergeAccount(existing: MT5Account, incoming: Partial<MT5Account> & { id: string }): MT5Account {
  return {
    ...existing,
    ...incoming,
    id: incoming.id,

    // "nullable" fields: preserve existing unless explicitly provided
    label: incoming.label ?? existing.label ?? null,

    firmDetected: incoming.firmDetected ?? existing.firmDetected ?? null,
    firmKey: incoming.firmKey ?? existing.firmKey ?? null,
    firmName: incoming.firmName ?? existing.firmName ?? null,

    program: incoming.program ?? existing.program ?? null,
    programKey: incoming.programKey ?? existing.programKey ?? null,

    phase: incoming.phase ?? existing.phase ?? null,
    accountSize: incoming.accountSize ?? existing.accountSize ?? null,
    platform: incoming.platform ?? existing.platform ?? null,

    ruleset: incoming.ruleset ?? existing.ruleset,
    rulesConfirmed: incoming.rulesConfirmed ?? existing.rulesConfirmed,

    riskRules: incoming.riskRules ?? existing.riskRules,
    tradeRules: incoming.tradeRules ?? existing.tradeRules,


    // arrays: only replace if provided
    positions: incoming.positions ?? existing.positions ?? [],
    positionsClosed: incoming.positionsClosed ?? existing.positionsClosed ?? [],
    closedDeals: incoming.closedDeals ?? existing.closedDeals ?? [],
    closedTrades: incoming.closedTrades ?? existing.closedTrades ?? [],

    metrics: incoming.metrics ?? existing.metrics,

    lastSync: incoming.lastSync ?? Date.now(),
  }
}

/* ---------- STORE ---------- */

export const useMT5Store = create<MT5State>()(
  persist(
    (set) => ({
      hasHydrated: false,
      setHasHydrated: (v) => set({ hasHydrated: v }),

      accounts: [],
      activeAccountId: null,
      refreshNonce: 0,
      bumpRefresh: () =>
        set((s) => ({ refreshNonce: s.refreshNonce + 1 })),

      /**
       * ✅ IMPORTANT:
       * We ONLY dedupe by `id` (uuid).
       * Never merge by login/server — that is exactly what was causing your
       * 100k + 200k accounts to collapse into one.
       */
      addOrUpdateAccount: (incoming) =>
        set((state) => {
          const existing = state.accounts.find((a) => a.id === incoming.id)

          const merged = existing
            ? mergeAccount(existing, incoming)
            : ({
                ...incoming,
                id: incoming.id,
                label: incoming.label ?? null,
                firmDetected: incoming.firmDetected ?? null,
                firmKey: incoming.firmKey ?? null,
                firmName: incoming.firmName ?? null,
                program: incoming.program ?? null,
                programKey: incoming.programKey ?? null,
                phase: incoming.phase ?? null,
                accountSize: incoming.accountSize ?? null,
                platform: incoming.platform ?? null,
                rulesConfirmed: incoming.rulesConfirmed,
                positions: incoming.positions ?? [],
                positionsClosed: incoming.positionsClosed ?? [],
                closedDeals: incoming.closedDeals ?? [],
                closedTrades: incoming.closedTrades ?? [],
                createdAt: Date.now(),
                lastSync: Date.now(),
              } as MT5Account)

          const accounts = existing
            ? state.accounts.map((a) => (a.id === incoming.id ? merged : a))
            : [...state.accounts, merged]

          // ✅ Do NOT auto-change active account on every update
          // Only set it if it's currently null.
          const activeAccountId = state.activeAccountId ?? merged.id

          return {
            accounts,
            activeAccountId,
            refreshNonce: state.refreshNonce + 1, // 🔥 FORCE SIGNAL
          }

        }),

      setActiveAccount: (id) => set(() => ({ activeAccountId: id })),

      removeAccount: (id) =>
        set((state) => {
          const remaining = state.accounts.filter((a) => a.id !== id)

          let nextActive = state.activeAccountId
          if (state.activeAccountId === id) {
            nextActive = remaining[0]?.id ?? null
          }

          return {
            accounts: remaining,
            activeAccountId: nextActive,
          }
        }),

      reset: () => set({ accounts: [], activeAccountId: null }),
    }),
    {
      name: "propguru.mt5",
      partialize: (state) => ({
        accounts: state.accounts,
        activeAccountId: state.activeAccountId,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
