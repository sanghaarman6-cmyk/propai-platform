"use client"

import { useEffect } from "react"
import { useAccountHubStore } from "@/lib/accountHubStore"

export default function Mt5SyncProvider() {
  const upsertFromMt5Snapshot = useAccountHubStore((s) => s.upsertFromMt5Snapshot)
  const setAccountStatus = useAccountHubStore((s) => s.setAccountStatus)
  const selected = useAccountHubStore((s) => s.getSelected())

  useEffect(() => {
    // Only poll once we have an account slot selected/created
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/mt5/sync")
        if (!res.ok) return
        const data = await res.json()

        upsertFromMt5Snapshot({
          userId: "demo-user",
          account: data.account,
          positions: data.positions,
          history: data.history,
        })
      } catch {}
    }, 10_000)

    return () => clearInterval(interval)
  }, [upsertFromMt5Snapshot])

  return null
}
