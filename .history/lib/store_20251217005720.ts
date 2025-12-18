import { create } from "zustand"
import type { AiInsight, Challenge, NextAction, Trade, User } from "./types"
import {
  mockActiveChallenge,
  mockInsights,
  mockNextActions,
  mockRecentTrades,
  mockUser,
} from "./mockData"

type DashboardFilters = {
  instrument: string | "All"
  session: "All" | "Asia" | "London" | "NY" | "Off-hours"
  outcome: "All" | "Win" | "Loss" | "BE"
}

type AppState = {
  user: User | null
  setUser: (u: User | null) => void

  activeChallenge: Challenge | null
  insights: AiInsight[]
  nextActions: NextAction[]
  recentTrades: Trade[]

  dashboardLoading: boolean
  setDashboardLoading: (v: boolean) => void

  filters: DashboardFilters
  setFilters: (p: Partial<DashboardFilters>) => void

  toggleNextAction: (id: string) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  user: mockUser,
  setUser: (u) => set({ user: u }),

  activeChallenge: mockActiveChallenge,
  insights: mockInsights,
  nextActions: mockNextActions,
  recentTrades: mockRecentTrades,

  dashboardLoading: true,
  setDashboardLoading: (v) => set({ dashboardLoading: v }),

  filters: { instrument: "All", session: "All", outcome: "All" },
  setFilters: (p) =>
    set({ filters: { ...get().filters, ...p } }),

  toggleNextAction: (id) =>
    set((s) => ({
      nextActions: s.nextActions.map((a) =>
        a.id === id ? { ...a, done: !a.done } : a
      ),
    })),
}))
