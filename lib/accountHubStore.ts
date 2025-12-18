import { create } from "zustand"

export type PropPhase = "Phase 1" | "Phase 2" | "Funded" | "Unknown"

export type RuleTemplate = {
  id: string
  firmName: string
  profitTargetPct: number
  dailyLossPct: number
  maxLossPct: number
  minDays?: number
  timeLimitDays?: number
}

export type AccountMetrics = {
  lastSyncAt?: string
  startingBalance?: number
  balance?: number
  equity?: number
  currency?: string

  // Computed risk metrics
  dailyPnL?: number
  dailyLossRemaining?: number
  maxLossRemaining?: number
  ddTodayPct?: number
  ddTotalPct?: number

  // Phase / progress
  phase: PropPhase
  profitTargetRemaining?: number
  status: "ok" | "at_risk" | "breached" | "unknown"
}

export type ConnectedAccount = {
  id: string
  userId: string

  // identity from MT5
  login?: number
  server?: string
  name?: string

  // firm detection + rules
  firmDetected?: string
  ruleTemplate?: RuleTemplate

  // raw MT5 snapshots (trim later)
  positions?: any[]
  history?: any[]

  metrics: AccountMetrics

  status: "connecting" | "connected" | "error"
  error?: string
}

type State = {
  accounts: ConnectedAccount[]
  selectedAccountId: string | null

  upsertFromMt5Snapshot: (p: {
    userId: string
    account: any
    positions: any[]
    history: any[]
  }) => void

  setSelectedAccount: (id: string) => void
  getSelected: () => ConnectedAccount | null

  // Used by connect button (no duplicates)
  ensureSingleAccountSlot: (userId: string) => string
  setAccountStatus: (id: string, patch: Partial<ConnectedAccount>) => void
}

export const useAccountHubStore = create<State>((set, get) => ({
  accounts: [],
  selectedAccountId: null,

  ensureSingleAccountSlot: (userId) => {
    const existing = get().accounts.find((a) => a.userId === userId)
    if (existing) return existing.id
    const id = crypto.randomUUID()
    set((s) => ({
      accounts: [
        ...s.accounts,
        {
          id,
          userId,
          status: "connecting",
          metrics: { phase: "Unknown", status: "unknown" },
        },
      ],
      selectedAccountId: id,
    }))
    return id
  },

  setAccountStatus: (id, patch) =>
    set((s) => ({
      accounts: s.accounts.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    })),

  setSelectedAccount: (id) => set({ selectedAccountId: id }),
  getSelected: () => {
    const { accounts, selectedAccountId } = get()
    if (!selectedAccountId) return null
    return accounts.find((a) => a.id === selectedAccountId) || null
  },

  upsertFromMt5Snapshot: ({ userId, account, positions, history }) => {
    const { detectFirmAndTemplate } = require("./rules/detectFirm")
    const { computeMetrics } = require("./rules/computeMetrics")

    const detected = detectFirmAndTemplate(account)

    set((s) => {
      // lock one account per login+server (or per user if only one)
      const existing =
        s.accounts.find(
          (a) =>
            a.userId === userId &&
            a.login === account.login &&
            a.server === account.server
        ) || s.accounts.find((a) => a.userId === userId)

      const id = existing?.id ?? crypto.randomUUID()

      const base: ConnectedAccount = existing ?? {
        id,
        userId,
        metrics: { phase: "Unknown", status: "unknown" },
        status: "connected",
      }

      const updated: ConnectedAccount = {
        ...base,
        status: "connected",
        login: account.login,
        server: account.server,
        name: account.name,
        firmDetected: detected.firmName,
        ruleTemplate: detected.template,
        positions,
        history,
        metrics: computeMetrics({
          account,
          template: detected.template,
          history,
          prev: base.metrics,
        }),
      }

      const accounts = existing
        ? s.accounts.map((a) => (a.id === id ? updated : a))
        : [...s.accounts, updated]

      return {
        accounts,
        selectedAccountId: s.selectedAccountId ?? id,
      }
    })
  },
}))
