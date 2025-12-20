"use client"

import { useEffect } from "react"
import { useMT5Store } from "@/lib/mt5Store"

export function useMT5Sync() {
  const activeId = useMT5Store((s) => s.activeAccountId)
  const addOrUpdateAccount = useMT5Store((s) => s.addOrUpdateAccount)

  useEffect(() => {
    if (!activeId) return

    let cancelled = false

    const sync = async () => {
      try {
        const res = await fetch("/api/mt5/sync", {
          cache: "no-store",
        })

        if (!res.ok) return

        const data = await res.json()

        if (cancelled) return

        addOrUpdateAccount({
          id: String(data.account.login),
          login: data.account.login,
          server: data.account.server,
          name: data.account.name,
          balance: data.account.balance,
          equity: data.account.equity,
          currency: data.account.currency,
          firmDetected: data.account.firmDetected,
          status: data.account.status,
          metrics: data.account.metrics,
          positions: data.positions,
          history: data.history,
        })
      } catch (e) {
        console.error("MT5 sync failed", e)
      }
    }

    // initial sync
    sync()

    // poll every 10s
    const interval = setInterval(sync, 10_000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [activeId, addOrUpdateAccount])
}
