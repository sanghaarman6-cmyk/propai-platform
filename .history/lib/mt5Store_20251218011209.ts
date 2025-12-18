import { create } from "zustand"
import type { MT5Account } from "./types"

type MT5State = {
  accounts: MT5Account[]
  addAccount: (a: MT5Account) => void
  updateStatus: (id: string, status: MT5Account["status"]) => void
}

export const useMT5Store = create<MT5State>((set) => ({
  accounts: [],
  addAccount: (a) =>
    set((s) => ({
      accounts: [...s.accounts, a],
    })),
  updateStatus: (id, status) =>
    set((s) => ({
      accounts: s.accounts.map((a) =>
        a.id === id ? { ...a, status } : a
      ),
    })),
}))
