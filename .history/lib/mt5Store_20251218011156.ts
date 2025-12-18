import { create } from "zustand"
import type { MT5Account } from "./types"

export type MT5Account = {
  id: string
  userId: string

  // Connection state
  status: "connecting" | "connected" | "error"

  // Filled AFTER successful connection
  login?: number
  server?: string
  name?: string
  balance?: number
  equity?: number
  currency?: string
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
