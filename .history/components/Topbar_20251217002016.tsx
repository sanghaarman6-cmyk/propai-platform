"use client"

import { Bell, Search, Plus } from "lucide-react"

export default function Topbar() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-bg-panel px-6">
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <Search size={16} />
        <span>Search trades, challenges, rules…</span>
      </div>

      <div className="flex items-center gap-4">
        <button className="rounded border border-border p-2 hover:bg-black">
          <Plus size={16} />
        </button>
        <button className="rounded border border-border p-2 hover:bg-black">
          <Bell size={16} />
        </button>
        <div className="h-8 w-8 rounded-full bg-bg-secondary" />
      </div>
    </header>
  )
}
