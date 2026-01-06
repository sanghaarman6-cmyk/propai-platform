import { create } from "zustand"

type TradeRiskState = {
  canTrade: boolean
  lastUpdated: number
  setCanTrade: (v: boolean) => void
}

export const useTradeRiskStore = create<TradeRiskState>((set) => ({
  canTrade: true,
  lastUpdated: Date.now(),
  setCanTrade: (v) =>
    set({ canTrade: v, lastUpdated: Date.now() }),
}))
