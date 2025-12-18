import { create } from "zustand"
import type { MT5Account } from "./types"

type MT5State = {
  accounts: MT5Account[]
  addAccount: (a: MT5Account) => void
  updateAccount: (id: string, patch: Partial<MT5Account>) => void
}

export const useMT5Store = create<MT5State>((set) => ({
  accounts: [],

  addAccount: (a) =>
    set((s) => ({
      accounts: [...s.accounts, a],
    })),

  updateAccount: (id, patch) =>
    set((s) => ({
      accounts: s.accounts.map((a) =>
        a.id === id ? { ...a, ...patch } : a
      ),
    })),
}))
