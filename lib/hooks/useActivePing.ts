"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { useMT5Store } from "@/lib/mt5Store"

const PING_INTERVAL = 15_000 // 15s is fine

export function useActivePing() {
  const pathname = usePathname()
  const timer = useRef<NodeJS.Timeout | null>(null)

  const activeAccountId = useMT5Store((s) => s.activeAccountId)

  useEffect(() => {
    if (!activeAccountId) return

    let cancelled = false

    async function ping() {
      try {
        await fetch("/api/sync/ping", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accountId: activeAccountId,
            path: pathname,
          }),
        })
      } catch {
        // intentionally ignore
      }
    }

    // fire immediately
    ping()

    // then keep alive
    timer.current = setInterval(() => {
      if (!cancelled) ping()
    }, PING_INTERVAL)

    return () => {
      cancelled = true
      if (timer.current) clearInterval(timer.current)
    }
  }, [activeAccountId, pathname])
}
