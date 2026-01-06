"use client"

import { useState } from "react"
import { useMT5Store } from "@/lib/mt5Store"

export function useManualSync() {
  const activeAccountId = useMT5Store((s) => s.activeAccountId)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function syncNow() {
    if (!activeAccountId || loading) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/sync/ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: activeAccountId,
          priority: true,
        }),
      })

      if (!res.ok) {
        throw new Error("Ping failed")
      }
    } catch {
      setError("Failed to request sync")
    } finally {
      setLoading(false)
    }
  }

  return {
    syncNow,
    loading,
    error,
    disabled: !activeAccountId,
  }
}
