import { create } from "zustand"

export type MT5Account = {
  id: string
  login: number
  server: string
  name: string
  balance: number
  equity: number
  currency: string

  firmDetected?: string
  status?: string

  metrics?: {
    ddTodayPct: number
    ddTotalPct: number
  }

  positions?: any[]
  history?: any[]

  lastSync?: number
}

type MT5State = {
  accounts: MT5Account[]
  activeAccountId: string | null

  addOrUpdateAccount: (a: MT5Account) => void
  setActiveAccount: (id: string) => void
}

export const useMT5Store = create<MT5State>((set) => ({
  accounts: [],
  selectedAccountId: null,

  addOrUpdateAccount: (account) =>
    set((s) => {
      const exists = s.accounts.find((a) => a.id === account.id)
      return {
        accounts: exists
          ? s.accounts.map((a) =>
              a.id === account.id ? { ...a, ...account } : a
            )
          : [...s.accounts, account],
        selectedAccountId: account.id, // auto-select latest
      }
    }),

  selectAccount: (id) => set({ selectedAccountId: id }),
}))

