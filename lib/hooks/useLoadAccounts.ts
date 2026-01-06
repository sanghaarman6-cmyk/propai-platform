"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { useMT5Store } from "@/lib/mt5Store"

export function useLoadAccounts() {
  const [loaded, setLoaded] = useState(false)

  const addOrUpdateAccount = useMT5Store((s) => s.addOrUpdateAccount)
  const setActiveAccount = useMT5Store((s) => s.setActiveAccount)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      // ⏳ Auth not ready yet → try again next tick
      if (!user) {
        return
      }

      const res = await fetch(`/api/accounts?userId=${user.id}`, {
        cache: "no-store",
      })

      if (!res.ok) {
        if (!cancelled) setLoaded(true)
        return
      }

      const json = await res.json()
      const rows = Array.isArray(json?.accounts) ? json.accounts : []

      let firstId: string | null = null
      const prevActive = useMT5Store.getState().activeAccountId

      for (const a of rows) {
        const id = String(a.id)
        if (!firstId) firstId = id

        addOrUpdateAccount({
          id,
          userId: a.user_id,
          label: a.label ?? null,

          login: a.login ?? undefined,
          server: a.server ?? undefined,
          name: a.name ?? undefined,

          balance: a.balance != null ? Number(a.balance) : undefined,
          equity: a.equity != null ? Number(a.equity) : undefined,
          currency: a.currency ?? undefined,

          firmDetected: a.firm_detected ?? null,
          firmKey: a.firm_key ?? null,
          firmName: a.firm_name ?? null,

          program: a.program ?? null,
          programKey: a.program_key ?? null,
          phase: a.phase ?? null,
          accountSize: a.account_size ?? null,
          platform: a.platform ?? null,

          rulesConfirmed: Boolean(a.rules_confirmed),
          ruleset:
            typeof a.ruleset === "string"
              ? JSON.parse(a.ruleset)
              : a.ruleset ?? null,

          baselineBalance:
            a.baseline_balance != null
              ? Number(a.baseline_balance)
              : undefined,

          status: a.status ?? "connected",
        })
      }

      if (prevActive) {
        setActiveAccount(prevActive)
      } else if (firstId) {
        setActiveAccount(firstId)
      }

      if (!cancelled) setLoaded(true)
    }

    load()

    // 🔁 ALSO listen for auth becoming ready
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) load()
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [addOrUpdateAccount, setActiveAccount])

  return loaded
}
