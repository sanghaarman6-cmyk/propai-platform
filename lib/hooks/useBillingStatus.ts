"use client"

import { useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { useBillingStore } from "@/lib/stores/useBillingStore"

export function useBillingStatus() {
  const { hasAccess, setAccess } = useBillingStore()

  useEffect(() => {
    // ✅ If already resolved as TRUE, never downgrade on navigation
    if (hasAccess === true) return

    let cancelled = false

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        if (!cancelled) setAccess(false)
        return
      }

      const { data } = await supabase
        .from("profiles")
        .select("subscription_status, trial_end")
        .eq("id", user.id)
        .single()

      if (cancelled) return

      const now = new Date()

      const allowed =
        data?.subscription_status === "active" ||
        (data?.subscription_status === "trialing" &&
          data.trial_end &&
          new Date(data.trial_end) > now)

      setAccess(Boolean(allowed))
    }

    load()
    return () => {
      cancelled = true
    }
  }, [hasAccess, setAccess])

  return { hasAccess }
}
