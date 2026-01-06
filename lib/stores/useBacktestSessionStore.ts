import { create } from "zustand"


/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

type Mode = "percent" | "dollar"
type TradeResult = "win" | "loss" | "breakeven"

export type Trade = {
  id: number
  ts: number
  result: TradeResult
  mode: Mode
  riskInput: number
  rewardInput: number
  multiplier: number
  feesEnabled: boolean
  feeInput: number
  feePctApplied: number
  rMultiple: number
  grossReturnPct: number
  netReturnPct: number
  feeAmount: number
  pnl: number
  equityBefore: number
  equityAfter: number
}

export type BacktestConfig = {
  mode: Mode
  initial: number
  risk: number
  reward: number
  multiplier: number
  feesEnabled: boolean
  feeValue: number
  advancedOpen?: boolean
}

export type BacktestSession = {
  id: string | null
  name: string
  notes: string
  config: BacktestConfig
  trades: Trade[]
  isDirty: boolean
}

export type BacktestSnapshotV1 = {
  version: 1
  config: BacktestConfig
  trades: Trade[]
}


/* -------------------------------------------------------------------------- */
/*                               Initial State                                */
/* -------------------------------------------------------------------------- */

const emptyConfig: BacktestConfig = {
  mode: "percent",
  initial: 1000,
  risk: 1,
  reward: 2,
  multiplier: 1,
  feesEnabled: false,
  feeValue: 0,
  advancedOpen: false,
}

const initialState: BacktestSession = {
  id: null,
  name: "",
  notes: "",
  config: emptyConfig,
  trades: [],
  isDirty: false,
}

/* -------------------------------------------------------------------------- */
/*                                   Store                                    */
/* -------------------------------------------------------------------------- */

type BacktestSessionStore = BacktestSession & {
  /* lifecycle */
  startNew: () => void
  hydrateFromDb: (payload: {
    id: string
    name: string
    notes?: string | null
    config: BacktestConfig
    trades: Trade[]
  }) => void

  hydrateFromSnapshot: (snapshot: BacktestSnapshotV1) => void

  /* mutations */
  setName: (name: string) => void
  setNotes: (notes: string) => void
  updateConfig: (partial: Partial<BacktestConfig>) => void

  setTrades: (trades: Trade[]) => void
  appendTrade: (trade: Trade) => void
  undoTrade: () => void

  /* persistence helpers */
  markSaved: (id: string) => void
  reset: () => void
}

export const useBacktestSessionStore = create<BacktestSessionStore>((set) => ({
  ...initialState,

  /* ----------------------------- lifecycle ----------------------------- */

  startNew: () =>
    set({
      ...initialState,
      config: { ...emptyConfig },
    }),

  hydrateFromDb: (payload) =>
    set({
      id: payload.id,
      name: payload.name,
      notes: payload.notes ?? "",
      config: payload.config,
      trades: payload.trades ?? [],
      isDirty: false,
    }),

  hydrateFromSnapshot: (snapshot) =>
    set({
      id: null, // because snapshot is "open session", not necessarily tied to a saved row yet
      name: "", // optional: you can keep last name if you want
      notes: "",
      config: snapshot.config,
      trades: snapshot.trades ?? [],
      isDirty: false,
    }),

  /* ----------------------------- mutations ----------------------------- */

  setName: (name) =>
    set((s) => ({
      name,
      isDirty: true,
    })),

  setNotes: (notes) =>
    set((s) => ({
      notes,
      isDirty: true,
    })),

  updateConfig: (partial) =>
    set((s) => ({
      config: { ...s.config, ...partial },
      isDirty: true,
    })),

  setTrades: (trades) =>
    set({
      trades,
      isDirty: true,
    }),

  appendTrade: (trade) =>
    set((s) => ({
      trades: [...s.trades, trade],
      isDirty: true,
    })),

  undoTrade: () =>
    set((s) => ({
      trades: s.trades.slice(0, -1),
      isDirty: true,
    })),

  /* ------------------------- persistence helpers ------------------------ */

  markSaved: (id) =>
    set({
      id,
      isDirty: false,
    }),

  reset: () =>
    set({
      ...initialState,
      config: { ...emptyConfig },
    }),
}))

