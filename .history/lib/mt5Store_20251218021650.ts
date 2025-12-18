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
  activeAccountId: null,

  addOrUpdateAccount: (account) =>
    set((state) => {
      const exists = state.accounts.find(
        (a) => a.login === account.login && a.server === account.server
      )

      if (exists) {
        return {
          accounts: state.accounts.map((a) =>
            a.login === account.login && a.server === account.server
              ? { ...a, ...account, lastSync: Date.now() }
              : a
          ),
        }
      }

      return {
        accounts: [...state.accounts, { ...account, lastSync: Date.now() }],
        activeAccountId: account.id,
      }
    }),

  setActiveAccount: (id) =>
    set(() => ({
      activeAccountId: id,
    })),
}))
