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

  addOrUpdateAccount: (account: MT5Account) => void
  setActiveAccount: (id: string) => void
}

export const useMT5Store = create<MT5State>((set) => ({
  accounts: [],
  activeAccountId: null,

  addOrUpdateAccount: (account) =>
    set((state) => {
      const exists = state.accounts.find((a) => a.id === account.id)

      return {
        accounts: exists
          ? state.accounts.map((a) =>
              a.id === account.id ? { ...a, ...account } : a
            )
          : [...state.accounts, account],

        // auto-select latest connected account
        activeAccountId: account.id,
      }
    }),

  setActiveAccount: (id: string) =>
    set({
      activeAccountId: id,
    }),
}))
