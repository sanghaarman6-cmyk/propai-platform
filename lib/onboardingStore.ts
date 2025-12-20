import { create } from "zustand"

export type OnboardingStep =
  | "strategy"
  | "account"
  | "complete"

type OnboardingState = {
  step: OnboardingStep
  strategySummary?: string
  hasAccount: boolean

  setStrategy: (summary: string) => void
  setAccountConnected: () => void
  reset: () => void
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  step: "strategy",
  strategySummary: undefined,
  hasAccount: false,

  setStrategy: (summary) =>
    set({
      step: "account",
      strategySummary: summary,
    }),

  setAccountConnected: () =>
    set({
      step: "complete",
      hasAccount: true,
    }),

  reset: () =>
    set({
      step: "strategy",
      strategySummary: undefined,
      hasAccount: false,
    }),
}))
