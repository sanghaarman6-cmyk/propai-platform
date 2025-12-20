"use client"

import { Bell, Search, Plus, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useMT5Store } from "@/lib/mt5Store"

export default function Topbar() {
  const router = useRouter()
  const supabase = createClient()
  const resetMT5 = useMT5Store((s) => s.reset)

  async function handleLogout() {
    await supabase.auth.signOut()
    resetMT5()
    router.push("/auth/login")
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-bg-panel px-6">
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <Search size={16} />
        <span>Search trades, challenges, rules…</span>
      </div>

      <div className="flex items-center gap-3">
        <button className="rounded border border-border p-2 hover:bg-black">
          <Plus size={16} />
        </button>

        <button className="rounded border border-border p-2 hover:bg-black">
          <Bell size={16} />
        </button>

        <button
          onClick={handleLogout}
          className="rounded border border-border p-2 hover:bg-black"
          title="Logout"
        >
          <LogOut size={16} />
        </button>

        <div className="h-8 w-8 rounded-full bg-bg-secondary" />
      </div>
    </header>
  )
}
