import { create } from "zustand"
import type { GuruMessage } from "@/lib/guru"
import { makeId } from "@/lib/guru"

type GuruState = {
  desktopCollapsed: boolean
  mobileOpen: boolean
  setDesktopCollapsed: (v: boolean) => void
  setMobileOpen: (v: boolean) => void

  messages: GuruMessage[]
  pushUser: (content: string) => void
  pushGuru: (content: string) => void
  clear: () => void

  suggestedPrompts: string[]
}

export const useGuruStore = create<GuruState>((set) => ({
  desktopCollapsed: false,
  mobileOpen: false,
  setDesktopCollapsed: (v) => set({ desktopCollapsed: v }),
  setMobileOpen: (v) => set({ mobileOpen: v }),

  messages: [
    {
      id: makeId("m"),
      role: "guru",
      tsISO: new Date().toISOString(),
      content:
        "I’m your prop-firm-aware Guru. I’ll coach you to pass — and stay funded — using your rules + behavior patterns.",
    },
  ],
  pushUser: (content) =>
    set((s) => ({
      messages: [
        ...s.messages,
        { id: makeId("m"), role: "user", tsISO: new Date().toISOString(), content },
      ],
    })),
  pushGuru: (content) =>
    set((s) => ({
      messages: [
        ...s.messages,
        { id: makeId("m"), role: "guru", tsISO: new Date().toISOString(), content },
      ],
    })),
  clear: () => set({ messages: [] }),

  suggestedPrompts: [
    "What rules am I closest to violating today?",
    "Build me a Phase 1 plan for the next 7 trading days",
    "Why do I keep failing challenges?",
    "What should I stop doing immediately?",
  ],
}))
