import { create } from "zustand"
import type {
  AiInsight,
  Challenge,
  FirmTemplate,
  NextAction,
  Trade,
  User,
} from "./types"
import {
  mockActiveChallenge,
  mockChallenges,
  mockFirmTemplates,
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

type ChallengesUIState = {
  selectedFirmId: string | "All"
  selectedChallengeId: string | null
}

type AppState = {
  // auth (mock)
  user: User | null
  setUser: (u: User | null) => void

  // templates + challenges
  firmTemplates: FirmTemplate[]
  challenges: Challenge[]
  activeChallenge: Challenge | null
  setActiveChallengeById: (id: string) => void
  addChallenge: (c: Challenge) => void // ✅ ADDED

  // dashboard
  insights: AiInsight[]
  nextActions: NextAction[]
  recentTrades: Trade[]

  dashboardLoading: boolean
  setDashboardLoading: (v: boolean) => void
  filters: DashboardFilters
  setFilters: (p: Partial<DashboardFilters>) => void
  toggleNextAction: (id: string) => void

  // challenges page UI
  challengesUI: ChallengesUIState
  setChallengesUI: (p: Partial<ChallengesUIState>) => void
  getSelectedChallenge: () => Challenge | null
}


export const useAppStore = create<AppState>((set, get) => ({
  user: mockUser,
  setUser: (u) => set({ user: u }),

  firmTemplates: mockFirmTemplates,
  challenges: mockChallenges,
  activeChallenge: mockActiveChallenge,
  setActiveChallengeById: (id) => {
    const found = get().challenges.find((c) => c.id === id) || null
    set({ activeChallenge: found })
  },

addChallenge: (c) =>
  set((s) => ({
    challenges: [c, ...s.challenges],
    activeChallenge: c,
    challengesUI: {
      ...s.challengesUI,
      selectedChallengeId: c.id,
      selectedFirmId: c.firmId,
    },
  })),


  insights: mockInsights,
  nextActions: mockNextActions,
  recentTrades: mockRecentTrades,

  dashboardLoading: true,
  setDashboardLoading: (v) => set({ dashboardLoading: v }),

  filters: { instrument: "All", session: "All", outcome: "All" },
  setFilters: (p) => set({ filters: { ...get().filters, ...p } }),

  toggleNextAction: (id) =>
    set((s) => ({
      nextActions: s.nextActions.map((a) =>
        a.id === id ? { ...a, done: !a.done } : a
      ),
    })),

  challengesUI: { selectedFirmId: "All", selectedChallengeId: mockActiveChallenge.id },
  setChallengesUI: (p) =>
    set({ challengesUI: { ...get().challengesUI, ...p } }),

  getSelectedChallenge: () => {
    const { selectedChallengeId } = get().challengesUI
    if (!selectedChallengeId) return null
    return get().challenges.find((c) => c.id === selectedChallengeId) || null
  },
}))
