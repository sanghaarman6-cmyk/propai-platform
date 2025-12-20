"use client"

import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { useMT5Store } from "@/lib/mt5Store"
import { useStrategyStore } from "@/lib/strategyStore"

export function useLogout() {
  const router = useRouter()

  const resetAccounts = useMT5Store((s) => s.reset)
  const resetStrategy = useStrategyStore((s) => s.reset)

  async function logout() {
    await supabase.auth.signOut()

    // 🧹 clear client state
    resetAccounts()
    resetStrategy()

    // 🚀 go to login
    router.replace("/auth/login")
  }

  return logout
}
