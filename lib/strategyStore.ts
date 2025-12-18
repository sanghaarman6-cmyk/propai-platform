import { create } from "zustand"
import { persist } from "zustand/middleware"

export type StrategyProfile = {
  style: string
  markets: string[]
  instruments: string[]
  timeframes: string[]
  sessions: string[]

  entry_model: string
  exit_model: string

  risk_per_trade_pct: number
  daily_stop_rule: string
  max_trades_per_day: number

  edge_definition: string
  known_failures: string[]

  confidence_score: number
  uncertainty_notes: string[]
}

type StrategyState = {
  rawText: string | null
  profile: StrategyProfile | null
  confirmed: boolean

  setRawText: (t: string) => void
  setProfile: (p: StrategyProfile) => void
  confirm: () => void
  reset: () => void
}

export const useStrategyStore = create<StrategyState>()(
  persist(
    (set) => ({
      rawText: null,
      profile: null,
      confirmed: false,

      setRawText: (t) => set({ rawText: t }),
      setProfile: (p) => set({ profile: p }),
      confirm: () => set({ confirmed: true }),
      reset: () =>
        set({
          rawText: null,
          profile: null,
          confirmed: false,
        }),
    }),
    {
      name: "strategy-profile",
    }
  )
)
