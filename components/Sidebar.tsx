"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import clsx from "clsx"
import { useTradeRiskStore } from "@/lib/stores/useTradeRiskStore"

import {
  LayoutDashboard,
  Calculator,
  BarChart3,
  Bot,
  Shield,
  BookOpen,
  FlaskConical,
  CandlestickChart,
  UserPen,
  ChevronUp,
  User,
  Settings,
  LogOut,
  Wallet,
  CalendarSearch,
  Command,
  Sparkles,
  RefreshCw,
  Newspaper,
  Globe2,
  NewspaperIcon
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useMT5Store } from "@/lib/mt5Store"
import { useManualSync } from "@/lib/hooks/useManualSync"

type NavItem = {
  label: string
  href: string
  icon: any
  group: "CORE" | "TOOLS" | "AI & RULES" | "ACCOUNT"
  accent?: "green" | "yellow" | "blue" | "none"
}

const NAV: NavItem[] = [
  { label: "Analytics", href: "/app/analytics", icon: BarChart3, group: "CORE" },
  { label: "Journal", href: "/app/journal", icon: BookOpen, group: "CORE" },
  



  { label: "Calculators", href: "/app/calculators", icon: Calculator, group: "TOOLS" },
  { label: "Backtester", href: "/app/backtester", icon: FlaskConical, group: "TOOLS" },
  { label: "News Calendar", href: "/app/calendar", icon: NewspaperIcon, group: "TOOLS" },

  { label: "Edge AI", href: "/app/guru", icon: Bot, group: "AI & RULES", accent: "green" },
  { label: "Fundamentals", href: "/app/fundamentals", icon: Globe2, group: "AI & RULES" },
  { label: "Rules", href: "/app/propfirm", icon: Shield, group: "AI & RULES" },

  { label: "Accounts", href: "/app/accounts", icon: UserPen, group: "ACCOUNT" },
]

function groupItems(items: NavItem[]) {
  return items.reduce<Record<string, NavItem[]>>((acc, it) => {
    acc[it.group] = acc[it.group] ?? []
    acc[it.group].push(it)
    return acc
  }, {})
}

function accentClasses(a?: NavItem["accent"]) {
  switch (a) {
    case "green":
      return "text-accent-green"
    case "yellow":
      return "text-yellow-400"
    case "blue":
      return "text-sky-400"
    default:
      return "text-text-muted"
  }
}

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const resetMT5 = useMT5Store((s) => s.reset)
  const canTrade = useTradeRiskStore((s) => s.canTrade)

  const [email, setEmail] = useState<string | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)

  const popoverRef = useRef<HTMLDivElement>(null)

  // ✅ Manual MT5 sync hook (NEW, isolated)
  const { syncNow, loading: syncing, disabled: syncDisabled } = useManualSync()
  const bumpRefresh = useMT5Store((s) => s.bumpRefresh)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null)
    })
  }, [supabase])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    resetMT5()
    router.push("/auth/login")
  }

  const grouped = useMemo(() => groupItems(NAV), [])

  async function handleManualSync() {
    await syncNow()
    bumpRefresh()
  }

  return (
    <aside className="relative flex h-full w-64 flex-col border-r border-border bg-bg-panel px-4 py-6">
      {/* Brand */}
      <div className="mb-6 flex items-center gap-3 pl-2">

        <div className="leading-tight">
          <div className="text-xs font-semibold tracking-widest text-emerald-400">
            EDGELY.AI
          </div>
          <div className="text-[10px] text-text-muted">All In One AI Prop Toolkit</div>
        </div>
      </div>

      {/* Command Palette (UI only) */}
      <div className="mb-6">
        <div className="flex cursor-pointer items-center gap-2 rounded-xl bg-black/30 px-3 py-2 ring-1 ring-border transition hover:bg-black/40">
          <Command size={16} className="text-text-muted" />
          <span className="text-sm text-text-muted">Command</span>
          <span className="ml-auto rounded-md bg-black/60 px-2 py-0.5 text-[10px] text-text-muted ring-1 ring-border">
            ⌘K
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto pr-1">
        <div className="space-y-5">
          {(["CORE", "TOOLS", "AI & RULES", "ACCOUNT"] as const).map((g) => {
            const items = grouped[g] ?? []
            if (!items.length) return null

            return (
              <div key={g}>
                <div className="mb-2 px-3 text-[10px] font-semibold tracking-[0.22em] text-text-muted/60">
                  {g}
                </div>

                <div className="space-y-1">
                  {items.map(({ label, href, icon: Icon, accent }) => {
                    const active = pathname.startsWith(href)

                    return (
                      <Link
                        key={href}
                        href={label === "Edge AI" ? "#" : href}
                        onClick={(e) => {
                          if (label === "Edge AI") e.preventDefault()
                        }}
                        title={label === "Edge AI" ? "Edge AI is temporarily unavailable" : undefined}
                        className={clsx(
                          "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all",
                          label === "Edge AI"
                            ? "cursor-not-allowed opacity-60"
                            : active
                              ? "bg-gradient-to-r from-accent-green/15 to-transparent text-white ring-1 ring-accent-green/30"
                              : "text-text-muted hover:bg-black/40 hover:text-white"
                        )}
                      >

                        <span
                          className={clsx(
                            "absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full",
                            active ? "bg-accent-green" : "bg-transparent group-hover:bg-white/20"
                          )}
                        />

                        <Icon
                          size={16}
                          className={clsx(
                            "transition-transform group-hover:translate-x-[1px]",
                            active ? "text-white" : accentClasses(accent)
                          )}
                        />

                        <span className="flex-1 truncate">
                          {label}
                          {label === "Edge AI" && (
                            <span className="ml-2 rounded-full bg-accent-green/10 px-2 py-0.5 text-[10px] text-accent-green ring-1 ring-accent-green/20">
                              LIVE
                            </span>
                          )}
                        </span>
                        {/* 🔴🟢 Trade status dot (Calendar only) */}
                        {label === "News Calendar" && (
                          <span
                            className={clsx(
                              "ml-2 h-1.5 w-1.5 shrink-0 rounded-full transition",
                              canTrade
                                ? "bg-emerald-400 shadow-[0_0_4px_rgba(16,185,129,0.5)]"
                                : "bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.5)] animate-pulse"
                            )}
                          />
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </nav>

      {/* Manual MT5 Sync */}
      <div className="mt-4">
        <button
          onClick={handleManualSync}
          disabled={syncDisabled || syncing}
          className={clsx(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm",
            "border border-border bg-black/35 hover:bg-black/45",
            "transition disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <RefreshCw
            size={16}
            className={clsx(
              "text-text-muted",
              syncing && "animate-spin text-accent-green"
            )}
          />
          <span className="flex-1 text-left">
            {syncing ? "Syncing MT5…" : "Refresh account"}
          </span>
        </button>
      </div>

      {/* Profile */}
      <div className="relative mt-4" ref={popoverRef}>
        {profileOpen && (
          <div className="absolute bottom-14 left-0 w-full overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-neutral-900 to-black shadow-2xl">
            <div className="px-3 py-2 text-[10px] font-semibold tracking-widest text-text-muted/70">
              SESSION
            </div>

            <button
              onClick={() => {
                setProfileOpen(false)
                router.push("/app/settings/account")
              }}
              className="flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-black/40"
            >
              <User size={14} />
              Account Settings
            </button>

            <button
              onClick={() => {
                setProfileOpen(false)
                router.push("/app/settings/password")
              }}
              className="flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-black/40"
            >
              <Settings size={14} />
              Change Password
            </button>

            <button
              onClick={() => {
                setProfileOpen(false)
                router.push("/app/settings/billing")
              }}
              className="flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-black/40"
            >
              <Wallet size={14} />
              Billing
            </button>


            <div className="my-1 border-t border-border" />

            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-3 py-2 text-sm text-red-300 hover:bg-red-500/10"
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        )}

        <button
          onClick={() => setProfileOpen((v) => !v)}
          className="flex w-full items-center gap-3 rounded-2xl bg-black/35 px-2 py-2 ring-1 ring-border transition hover:bg-black/45"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/40 ring-1 ring-border">
            <User size={16} />
          </div>

          <div className="flex-1 overflow-hidden text-left">
            <div className="truncate text-sm font-medium">{email ?? "Trading User"}</div>
            <div className="text-xs text-text-muted">Active session</div>
          </div>

          <ChevronUp
            size={14}
            className={clsx(
              "transition",
              profileOpen ? "rotate-0 opacity-100" : "rotate-180 opacity-60"
            )}
          />
        </button>
      </div>
    </aside>
  )
}
