import { create } from "zustand"

/* ---------- TYPES ---------- */

export type StrategyProfile = {
  style?: string
  timeframe?: string
  risk?: string
  markets?: string[]
}

type StrategyState = {
  rawText: string
  profile: StrategyProfile | null
  confirmed: boolean

  setRawText: (text: string) => void
  setProfile: (profile: StrategyProfile) => void
  confirm: () => void
  reset: () => void
}

/* ---------- STORE ---------- */

export const useStrategyStore = create<StrategyState>((set) => ({
  rawText: "",
  profile: null,
  confirmed: false,

  setRawText: (text) =>
    set({
      rawText: text,
      confirmed: false,
    }),

  setProfile: (profile) =>
    set({
      profile,
    }),

  confirm: () =>
    set({
      confirmed: true,
    }),

  reset: () =>
    set({
      rawText: "",
      profile: null,
      confirmed: false,
    }),
}))
