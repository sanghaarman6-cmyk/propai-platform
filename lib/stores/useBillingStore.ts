import { create } from "zustand"

type BillingState = {
  hasAccess: boolean | null
  setAccess: (v: boolean) => void
}

export const useBillingStore = create<BillingState>((set) => ({
  hasAccess: null, // unknown on first load
  setAccess: (v) => set({ hasAccess: v }),
}))
