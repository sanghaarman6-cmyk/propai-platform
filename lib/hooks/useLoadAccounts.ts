"use client"

import { useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase/client"
import { useMT5Store } from "@/lib/mt5Store"

export function useLoadAccounts() {
  const hydrated = useRef(false)

  const addOrUpdateAccount = useMT5Store((s) => s.addOrUpdateAccount)
  const reset = useMT5Store((s) => s.reset)
  const setActiveAccount = useMT5Store((s) => s.setActiveAccount)

  useEffect(() => {
    if (hydrated.current) return
    hydrated.current = true

    const load = async () => {
      // Always start clean to prevent “phantom accounts”
      reset()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const res = await fetch(`/api/accounts?userId=${user.id}`, {
        cache: "no-store",
      })

      if (!res.ok) return

      const accounts = await res.json()

      if (!Array.isArray(accounts) || accounts.length === 0) return

      for (const a of accounts) {
        addOrUpdateAccount({
          id: a.id,
          login: a.login,
          server: a.server,
          name: a.name,
          balance: Number(a.balance),
          equity: Number(a.equity),
          currency: a.currency,
          firmDetected: a.firm_detected,
          baselineBalance: a.baseline_balance,
          status: a.status,
        })
      }

      // Select newest (accounts are ordered newest-first)
      setActiveAccount(String(accounts[0].id))
    }

    load()
  }, [addOrUpdateAccount, reset, setActiveAccount])
}
